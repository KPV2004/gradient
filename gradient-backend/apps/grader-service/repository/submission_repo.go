// apps/grader-service/repository/submission_repo.go
package repository

import (
	"context"
	"fmt"

	"github.com/KPV2004/gradient-backend/apps/shared/model"
	"gorm.io/gorm"
)

// SubmissionRepository interface สำหรับ operation ที่ grader ต้องการ
type SubmissionRepository interface {
	// UpdateResult บันทึกผลการตรวจกลับ DB
	UpdateResult(ctx context.Context, id string, params UpdateResultParams) error
}

// UpdateResultParams พารามิเตอร์สำหรับอัปเดตผลการตรวจ
type UpdateResultParams struct {
	Status       model.SubmissionStatus
	Stdout       string
	Stderr       string
	TimeUsedMs   int64
	MemoryUsedKb int64
}

// postgresSubmissionRepo implement SubmissionRepository ด้วย GORM
type postgresSubmissionRepo struct {
	db *gorm.DB
}

// NewSubmissionRepository สร้าง SubmissionRepository จาก GORM DB
func NewSubmissionRepository(db *gorm.DB) SubmissionRepository {
	return &postgresSubmissionRepo{db: db}
}

// UpdateResult อัปเดตผลการตรวจใน submissions table
func (r *postgresSubmissionRepo) UpdateResult(ctx context.Context, id string, params UpdateResultParams) error {
	result := r.db.WithContext(ctx).Model(&model.Submission{}).Where("id = ?", id).Updates(map[string]interface{}{
		"status":         params.Status,
		"stdout":         params.Stdout,
		"stderr":         params.Stderr,
		"time_used_ms":   params.TimeUsedMs,
		"memory_used_kb": params.MemoryUsedKb,
	})
	if result.Error != nil {
		return fmt.Errorf("UpdateResult failed for submission %s: %w", id, result.Error)
	}

	if result.RowsAffected == 0 {
		return fmt.Errorf("submission %s not found", id)
	}

	return nil
}
