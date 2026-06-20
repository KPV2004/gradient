// apps/grader-service/handler/grpc_handler.go
package handler

import (
	"context"
	"log"
	"time"

	"github.com/KPV2004/gradient-backend/apps/grader-service/config"
	"github.com/KPV2004/gradient-backend/apps/grader-service/engine"
	"github.com/KPV2004/gradient-backend/apps/grader-service/repository"
	"github.com/KPV2004/gradient-backend/apps/shared/model"
	pb "github.com/KPV2004/gradient-backend/apps/shared/proto"
)

// GraderHandler implement gRPC GraderServiceServer
type GraderHandler struct {
	pb.UnimplementedGraderServiceServer
	profiles *config.SandboxProfiles
	sandbox  *engine.DockerSandbox
	subRepo  repository.SubmissionRepository
}

func NewGraderHandler(
	profiles *config.SandboxProfiles,
	sandbox *engine.DockerSandbox,
	subRepo repository.SubmissionRepository,
) *GraderHandler {
	return &GraderHandler{
		profiles: profiles,
		sandbox:  sandbox,
		subRepo:  subRepo,
	}
}

// Grade รับ GradeRequest จาก CMS → รันใน sandbox → บันทึกผลกลับ DB
func (h *GraderHandler) Grade(ctx context.Context, req *pb.GradeRequest) (*pb.GradeResponse, error) {
	log.Printf("📥 Grade request: submission_id=%s lang=%s", req.SubmissionId, req.Language)

	// 1. Mark submission เป็น "running" ก่อน
	_ = h.subRepo.UpdateResult(ctx, req.SubmissionId, repository.UpdateResultParams{
		Status: model.StatusRunning,
	})

	// 2. ดึง language profile
	profile, exists := h.profiles.Languages[req.Language]
	if !exists {
		// ภาษาไม่รองรับ → บันทึก CE และ return
		_ = h.subRepo.UpdateResult(ctx, req.SubmissionId, repository.UpdateResultParams{
			Status: model.StatusCE,
			Stderr: "unsupported language: " + req.Language,
		})
		return &pb.GradeResponse{
			SubmissionId: req.SubmissionId,
			ExitCode:     1,
			Stderr:       "unsupported language: " + req.Language,
		}, nil
	}

	// 3. สร้าง sandbox config
	sandboxCfg := engine.SandboxConfig{
		Image:       profile.Image,
		CompileCmd:  profile.CompileCmd,
		RunCmd:      profile.RunCmd,
		Stdin:       req.Stdin,
		Timeout:     time.Duration(req.TimeoutMs) * time.Millisecond,
		MemoryLimit: req.MemoryLimitMb * 1024 * 1024,
	}

	// 4. รันโค้ดใน Docker sandbox
	start := time.Now()
	result, err := h.sandbox.RunCodeWithProfile(ctx, sandboxCfg, req.SourceCode, languageFilename(req.Language))
	elapsed := time.Since(start).Milliseconds()

	if err != nil {
		// ระบบผิดพลาด (Docker error) → บันทึก SE
		_ = h.subRepo.UpdateResult(ctx, req.SubmissionId, repository.UpdateResultParams{
			Status: model.StatusSE,
			Stderr: err.Error(),
		})
		return nil, err
	}

	// 5. แปลงผลลัพธ์ sandbox → SubmissionStatus
	status := judgeStatus(result)

	log.Printf("[Grader Log] Executed sandbox code result for submission %s:\n  - ExitCode: %d\n  - IsTLE: %t\n  - Stdout: %q\n  - Stderr: %q",
		req.SubmissionId, result.ExitCode, result.IsTLE, result.Stdout, result.Stderr)

	// 6. บันทึกผลกลับ DB
	if repoErr := h.subRepo.UpdateResult(ctx, req.SubmissionId, repository.UpdateResultParams{
		Status:     status,
		Stdout:     result.Stdout,
		Stderr:     result.Stderr,
		TimeUsedMs: elapsed,
	}); repoErr != nil {
		log.Printf("⚠️  Failed to save result for %s: %v", req.SubmissionId, repoErr)
	}

	log.Printf("✅ Grade done: submission_id=%s status=%s time=%dms", req.SubmissionId, status, elapsed)

	return &pb.GradeResponse{
		SubmissionId: req.SubmissionId,
		IsTle:        result.IsTLE,
		ExitCode:     int32(result.ExitCode),
		Stdout:       result.Stdout,
		Stderr:       result.Stderr,
	}, nil
}

// judgeStatus แปลง SandboxResult → SubmissionStatus
func judgeStatus(result *engine.SandboxResult) model.SubmissionStatus {
	switch {
	case result.IsTLE:
		return model.StatusTLE
	case result.ExitCode != 0 && result.Stderr != "":
		// exit non-zero + มี stderr = Runtime Error หรือ Compile Error
		return model.StatusRE
	case result.ExitCode != 0:
		return model.StatusRE
	default:
		// ผ่านการรัน → ให้ CMS เป็นคนตัดสิน AC/WA โดยเทียบ output
		return model.StatusAC
	}
}

// languageFilename แปลง language name → ชื่อไฟล์ source code
func languageFilename(lang string) string {
	switch lang {
	case "cpp":
		return "solution.cpp"
	case "python":
		return "solution.py"
	case "go":
		return "solution.go"
	case "java":
		return "Solution.java"
	case "c":
		return "solution.c"
	case "rust":
		return "solution.rs"
	case "javascript", "js":
		return "solution.js"
	default:
		return "solution"
	}
}
