// apps/cms-service/handler/submission/submission_handler.go
package submission

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/KPV2004/gradient-backend/apps/cms-service/client"
	activityRepo "github.com/KPV2004/gradient-backend/apps/cms-service/repository/activity"
	problemRepo "github.com/KPV2004/gradient-backend/apps/cms-service/repository/problem"
	subRepo "github.com/KPV2004/gradient-backend/apps/cms-service/repository/submission"
	"github.com/KPV2004/gradient-backend/apps/shared/model"
	pb "github.com/KPV2004/gradient-backend/apps/shared/proto"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type SubmissionHandler struct {
	subRepo      subRepo.SubmissionRepository
	problemRepo  problemRepo.ProblemRepository
	graderClient *client.GraderClient
	activityRepo activityRepo.ActivityRepository
}

func NewSubmissionHandler(
	subRepo subRepo.SubmissionRepository,
	problemRepo problemRepo.ProblemRepository,
	graderClient *client.GraderClient,
	activityRepo activityRepo.ActivityRepository,
) *SubmissionHandler {
	return &SubmissionHandler{
		subRepo:      subRepo,
		problemRepo:  problemRepo,
		graderClient: graderClient,
		activityRepo: activityRepo,
	}
}

type CreateSubmissionRequest struct {
	ProblemID  string `json:"problem_id" binding:"required"`
	Language   string `json:"language" binding:"required"` // "cpp", "python", "go"
	SourceCode string `json:"source_code" binding:"required"`
}

func (h *SubmissionHandler) Create(c *gin.Context) {
	userID, _ := c.Get("userID")
	usernameVal, _ := c.Get("username")
	username, _ := usernameVal.(string)

	var req CreateSubmissionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 1. Validate problem exists
	problem, err := h.problemRepo.GetByID(c.Request.Context(), req.ProblemID)
	if err != nil {
		if errors.Is(err, problemRepo.ErrProblemNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "problem not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Validate language
	lang := strings.ToLower(req.Language)
	if lang != "cpp" && lang != "python" && lang != "go" && lang != "java" && lang != "c" && lang != "rust" && lang != "javascript" && lang != "js" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "unsupported language. Choose from: cpp, python, go, java, c, rust, javascript (js)"})
		return
	}

	// 2. Create Submission in DB (status: pending)
	submission := &model.Submission{
		ID:         uuid.New().String(),
		ProblemID:  req.ProblemID,
		UserID:     userID.(string),
		Language:   lang,
		SourceCode: req.SourceCode,
		Status:     model.StatusPending,
		Score:      0,
	}

	if err := h.subRepo.Create(c.Request.Context(), submission); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 3. Asynchronously trigger grading
	go h.gradeSubmission(context.Background(), submission, problem)

	// Log the submit event asynchronously
	go func() {
		_ = h.activityRepo.Create(context.Background(), &model.ActivityLog{
			ID:        uuid.New().String(),
			UserID:    userID.(string),
			Username:  username,
			Action:    "submit",
			IPAddress: c.ClientIP(),
			UserAgent: c.Request.UserAgent(),
			Metadata:  fmt.Sprintf(`{"submission_id":"%s","problem_id":"%s","language":"%s"}`, submission.ID, req.ProblemID, lang),
			CreatedAt: time.Now(),
		})
	}()

	c.JSON(http.StatusCreated, submission)
}

func (h *SubmissionHandler) GetByID(c *gin.Context) {
	id := c.Param("id")
	submission, err := h.subRepo.GetByID(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, subRepo.ErrSubmissionNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "submission not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, submission)
}

func (h *SubmissionHandler) List(c *gin.Context) {
	userID := c.Query("user_id")
	problemID := c.Query("problem_id")

	submissions, err := h.subRepo.List(c.Request.Context(), userID, problemID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, submissions)
}

// gradeSubmission handles compiling and running code against all testcases
func (h *SubmissionHandler) gradeSubmission(ctx context.Context, sub *model.Submission, problem *model.Problem) {
	log.Printf("⏳ Start grading submission %s for problem %s", sub.ID, problem.ID)

	// Get all testcases
	testcases, err := h.problemRepo.GetTestcases(ctx, problem.ID, false)
	if err != nil {
		log.Printf("❌ Failed to fetch testcases for problem %s: %v", problem.ID, err)
		sub.Status = model.StatusSE
		sub.Stderr = "system error: failed to fetch testcases"
		_ = h.subRepo.Update(ctx, sub)
		return
	}

	if len(testcases) == 0 {
		log.Printf("⚠️ No testcases found for problem %s", problem.ID)
		sub.Status = model.StatusAC
		sub.Score = problem.Score
		_ = h.subRepo.Update(ctx, sub)
		return
	}

	overallStatus := model.StatusAC
	totalScore := 0
	var maxTimeUsed int64 = 0
	var maxMemoryUsed int64 = 0
	var finalStdout strings.Builder
	var finalStderr strings.Builder

	// Run testcases sequentially
	for _, tc := range testcases {
		log.Printf("🏃 Running testcase %d (ID: %s)", tc.OrderIndex, tc.ID)

		req := &pb.GradeRequest{
			SubmissionId:  sub.ID,
			Language:      sub.Language,
			SourceCode:    sub.SourceCode,
			Stdin:         tc.Input,
			TimeoutMs:     problem.TimeoutMs,
			MemoryLimitMb: problem.MemoryLimitMb,
		}

		startTime := time.Now()
		resp, err := h.graderClient.Grade(ctx, req)
		elapsed := time.Since(startTime).Milliseconds()

		if err != nil {
			log.Printf("❌ Grader gRPC call failed: %v", err)
			overallStatus = model.StatusSE
			finalStderr.WriteString("system error: grader failed\n")
			fmt.Fprintf(&finalStdout, "Testcase %d: Crashed (0/%d pts) - System Error\n", tc.OrderIndex, tc.Score)
			break
		}

		if elapsed > maxTimeUsed {
			maxTimeUsed = elapsed
		}

		// Judge this specific testcase run
		var tcStatus model.SubmissionStatus
		var actualOutput string
		expectedOutput := strings.TrimSpace(tc.ExpectedOutput)

		if resp.IsTle {
			tcStatus = model.StatusTLE
			fmt.Fprintf(&finalStdout, "Testcase %d: Failed (0/%d pts) - Time Limit Exceeded\n", tc.OrderIndex, tc.Score)
		} else if resp.ExitCode != 0 {
			// Non-zero exit code usually means Runtime Error
			tcStatus = model.StatusRE
			finalStderr.WriteString(resp.Stderr)
			fmt.Fprintf(&finalStdout, "Testcase %d: Crashed (0/%d pts) - Runtime Error (Exit Code: %d)\n", tc.OrderIndex, tc.Score, resp.ExitCode)
		} else {
			// Compare output (normalized)
			actualOutput = strings.TrimSpace(resp.Stdout)

			if actualOutput == expectedOutput {
				tcStatus = model.StatusAC
				totalScore += tc.Score
				fmt.Fprintf(&finalStdout, "Testcase %d: Success (%d/%d pts)\n", tc.OrderIndex, tc.Score, tc.Score)
			} else {
				tcStatus = model.StatusWA
				fmt.Fprintf(&finalStdout, "Testcase %d: Failed (0/%d pts) - Expected: %q, Actual: %q\n", tc.OrderIndex, tc.Score, expectedOutput, actualOutput)
			}
		}

		log.Printf("[Testcase %d Log] Status: %s, ExitCode: %d, IsTle: %v\n  - Input: %q\n  - Expected: %q\n  - Actual Output: %q\n  - Stderr: %q",
			tc.OrderIndex, tcStatus, resp.ExitCode, resp.IsTle, tc.Input, expectedOutput, actualOutput, resp.Stderr)

		// Update overallStatus based on severity
		// Priority: SE > RE > TLE > WA > AC
		if tcStatus != model.StatusAC {
			if overallStatus == model.StatusAC {
				overallStatus = tcStatus
			} else if tcStatus == model.StatusSE {
				overallStatus = model.StatusSE
			} else if tcStatus == model.StatusRE && overallStatus != model.StatusSE {
				overallStatus = model.StatusRE
			} else if tcStatus == model.StatusTLE && overallStatus != model.StatusSE && overallStatus != model.StatusRE {
				overallStatus = model.StatusTLE
			} else if tcStatus == model.StatusWA && overallStatus == model.StatusAC {
				overallStatus = model.StatusWA
			}
		}
	}

	// Update final state of submission in DB
	sub.Status = overallStatus
	sub.Score = totalScore
	sub.TimeUsedMs = maxTimeUsed
	sub.MemoryUsedKb = maxMemoryUsed
	sub.Stdout = finalStdout.String()
	sub.Stderr = finalStderr.String()

	if err := h.subRepo.Update(ctx, sub); err != nil {
		log.Printf("❌ Failed to save final submission result for %s: %v", sub.ID, err)
	} else {
		log.Printf("🎉 Finished grading submission %s. Final status: %s, Score: %d", sub.ID, sub.Status, sub.Score)
	}
}
