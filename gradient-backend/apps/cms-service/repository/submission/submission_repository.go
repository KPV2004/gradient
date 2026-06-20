// apps/cms-service/repository/submission/submission_repository.go
package submission

import (
	"context"
	"errors"
	"fmt"

	"github.com/KPV2004/gradient-backend/apps/shared/model"
	"gorm.io/gorm"
)

var (
	ErrSubmissionNotFound = errors.New("submission not found")
)

type SubmissionRepository interface {
	Create(ctx context.Context, s *model.Submission) error
	GetByID(ctx context.Context, id string) (*model.Submission, error)
	List(ctx context.Context, userID, problemID string) ([]*model.Submission, error)
	Update(ctx context.Context, s *model.Submission) error
}

type postgresSubmissionRepository struct {
	db *gorm.DB
}

func NewSubmissionRepository(db *gorm.DB) SubmissionRepository {
	return &postgresSubmissionRepository{db: db}
}

func (r *postgresSubmissionRepository) Create(ctx context.Context, s *model.Submission) error {
	if err := r.db.WithContext(ctx).Create(s).Error; err != nil {
		return fmt.Errorf("failed to create submission: %w", err)
	}
	return nil
}

func (r *postgresSubmissionRepository) GetByID(ctx context.Context, id string) (*model.Submission, error) {
	var s model.Submission
	if err := r.db.WithContext(ctx).First(&s, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrSubmissionNotFound
		}
		return nil, err
	}
	return &s, nil
}

func (r *postgresSubmissionRepository) List(ctx context.Context, userID, problemID string) ([]*model.Submission, error) {
	var submissions []*model.Submission
	tx := r.db.WithContext(ctx)
	if userID != "" {
		tx = tx.Where("user_id = ?", userID)
	}
	if problemID != "" {
		tx = tx.Where("problem_id = ?", problemID)
	}
	if err := tx.Order("created_at DESC").Find(&submissions).Error; err != nil {
		return nil, fmt.Errorf("failed to list submissions: %w", err)
	}
	return submissions, nil
}

func (r *postgresSubmissionRepository) Update(ctx context.Context, s *model.Submission) error {
	if err := r.db.WithContext(ctx).Save(s).Error; err != nil {
		return fmt.Errorf("failed to update submission: %w", err)
	}
	return nil
}
