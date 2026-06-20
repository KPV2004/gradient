// apps/cms-service/handler/problem/problem_handler.go
package problem

import (
	"errors"
	"net/http"

	problemRepo "github.com/KPV2004/gradient-backend/apps/cms-service/repository/problem"
	"github.com/KPV2004/gradient-backend/apps/shared/model"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ProblemHandler struct {
	repo problemRepo.ProblemRepository
}

func NewProblemHandler(repo problemRepo.ProblemRepository) *ProblemHandler {
	return &ProblemHandler{repo: repo}
}

type CreateProblemRequest struct {
	Title         string           `json:"title" binding:"required"`
	Slug          string           `json:"slug" binding:"required"`
	Description   string           `json:"description" binding:"required"`
	InputFormat   string           `json:"input_format"`
	OutputFormat  string           `json:"output_format"`
	Constraints   string           `json:"constraints"`
	Difficulty    model.Difficulty `json:"difficulty" binding:"required"`
	TimeoutMs     int64            `json:"timeout_ms" binding:"required,min=100"`
	MemoryLimitMb int64            `json:"memory_limit_mb" binding:"required,min=4"`
	Score         int              `json:"score" binding:"required,min=1"`
	IsPublished   bool             `json:"is_published"`
}

func (h *ProblemHandler) Create(c *gin.Context) {
	userID, _ := c.Get("userID")

	var req CreateProblemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	p := &model.Problem{
		ID:            uuid.New().String(),
		Title:         req.Title,
		Slug:          req.Slug,
		Description:   req.Description,
		InputFormat:   req.InputFormat,
		OutputFormat:  req.OutputFormat,
		Constraints:   req.Constraints,
		Difficulty:    req.Difficulty,
		TimeoutMs:     req.TimeoutMs,
		MemoryLimitMb: req.MemoryLimitMb,
		Score:         req.Score,
		CreatedBy:     userID.(string),
		IsPublished:   req.IsPublished,
	}

	if err := h.repo.Create(c.Request.Context(), p); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, p)
}

func (h *ProblemHandler) GetByID(c *gin.Context) {
	id := c.Param("id")
	p, err := h.repo.GetByID(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, problemRepo.ErrProblemNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "problem not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Simple role checks if we want to restrict unpublished problems
	userRole, exists := c.Get("userRole")
	if !p.IsPublished {
		if !exists || (userRole.(model.Role) != model.RoleAdmin && userRole.(model.Role) != model.RoleTeacher) {
			c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: problem is not published"})
			return
		}
	}

	c.JSON(http.StatusOK, p)
}

func (h *ProblemHandler) List(c *gin.Context) {
	userRole, exists := c.Get("userRole")
	publishedOnly := true

	// If logged in as admin/teacher, they can see all problems
	if exists && (userRole.(model.Role) == model.RoleAdmin || userRole.(model.Role) == model.RoleTeacher) {
		publishedOnly = false
	}

	problems, err := h.repo.List(c.Request.Context(), publishedOnly)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, problems)
}

type CreateTestcaseRequest struct {
	OrderIndex     int    `json:"order_index" binding:"required"`
	Input          string `json:"input"`
	ExpectedOutput string `json:"expected_output" binding:"required"`
	IsSample       bool   `json:"is_sample"`
	Score          int    `json:"score" binding:"required,min=0"`
}

func (h *ProblemHandler) CreateTestcase(c *gin.Context) {
	problemID := c.Param("id")

	// Validate problem exists
	_, err := h.repo.GetByID(c.Request.Context(), problemID)
	if err != nil {
		if errors.Is(err, problemRepo.ErrProblemNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "problem not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var req CreateTestcaseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tc := &model.Testcase{
		ID:             uuid.New().String(),
		ProblemID:      problemID,
		OrderIndex:     req.OrderIndex,
		Input:          req.Input,
		ExpectedOutput: req.ExpectedOutput,
		IsSample:       req.IsSample,
		Score:          req.Score,
	}

	if err := h.repo.CreateTestcase(c.Request.Context(), tc); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, tc)
}

func (h *ProblemHandler) GetTestcases(c *gin.Context) {
	problemID := c.Param("id")
	userRole, exists := c.Get("userRole")

	// Only admin/teacher can view all testcases (including expected output and input).
	// Students can only view sample testcases.
	samplesOnly := true
	if exists && (userRole.(model.Role) == model.RoleAdmin || userRole.(model.Role) == model.RoleTeacher) {
		samplesOnly = false
	}

	testcases, err := h.repo.GetTestcases(c.Request.Context(), problemID, samplesOnly)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, testcases)
}
