// apps/cms-service/repository/problem/problem_repository.go
package problem

import (
	"context"
	"errors"
	"fmt"

	"github.com/KPV2004/gradient-backend/apps/shared/model"
	"gorm.io/gorm"
)

var (
	ErrProblemNotFound = errors.New("problem not found")
)

type ProblemRepository interface {
	Create(ctx context.Context, p *model.Problem) error
	GetByID(ctx context.Context, id string) (*model.Problem, error)
	GetBySlug(ctx context.Context, slug string) (*model.Problem, error)
	List(ctx context.Context, publishedOnly bool) ([]*model.Problem, error)
	Update(ctx context.Context, p *model.Problem) error
	Delete(ctx context.Context, id string) error
	CreateTestcase(ctx context.Context, tc *model.Testcase) error
	GetTestcases(ctx context.Context, problemID string, samplesOnly bool) ([]*model.Testcase, error)
	DeleteTestcase(ctx context.Context, id string) error
}

type postgresProblemRepository struct {
	db *gorm.DB
}

func NewProblemRepository(db *gorm.DB) ProblemRepository {
	return &postgresProblemRepository{db: db}
}

func (r *postgresProblemRepository) Create(ctx context.Context, p *model.Problem) error {
	if err := r.db.WithContext(ctx).Create(p).Error; err != nil {
		return fmt.Errorf("failed to create problem: %w", err)
	}
	return nil
}

func (r *postgresProblemRepository) GetByID(ctx context.Context, id string) (*model.Problem, error) {
	var p model.Problem
	if err := r.db.WithContext(ctx).First(&p, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrProblemNotFound
		}
		return nil, err
	}
	return &p, nil
}

func (r *postgresProblemRepository) GetBySlug(ctx context.Context, slug string) (*model.Problem, error) {
	var p model.Problem
	if err := r.db.WithContext(ctx).First(&p, "slug = ?", slug).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrProblemNotFound
		}
		return nil, err
	}
	return &p, nil
}

func (r *postgresProblemRepository) List(ctx context.Context, publishedOnly bool) ([]*model.Problem, error) {
	var problems []*model.Problem
	tx := r.db.WithContext(ctx)
	if publishedOnly {
		tx = tx.Where("is_published = ?", true)
	}
	if err := tx.Order("created_at DESC").Find(&problems).Error; err != nil {
		return nil, fmt.Errorf("failed to list problems: %w", err)
	}
	return problems, nil
}

func (r *postgresProblemRepository) CreateTestcase(ctx context.Context, tc *model.Testcase) error {
	if err := r.db.WithContext(ctx).Create(tc).Error; err != nil {
		return fmt.Errorf("failed to create testcase: %w", err)
	}
	return nil
}

func (r *postgresProblemRepository) GetTestcases(ctx context.Context, problemID string, samplesOnly bool) ([]*model.Testcase, error) {
	var testcases []*model.Testcase
	tx := r.db.WithContext(ctx).Where("problem_id = ?", problemID)
	if samplesOnly {
		tx = tx.Where("is_sample = ?", true)
	}
	if err := tx.Order("order_index ASC").Find(&testcases).Error; err != nil {
		return nil, fmt.Errorf("failed to get testcases: %w", err)
	}
	return testcases, nil
}

func (r *postgresProblemRepository) Update(ctx context.Context, p *model.Problem) error {
	if err := r.db.WithContext(ctx).Save(p).Error; err != nil {
		return fmt.Errorf("failed to update problem: %w", err)
	}
	return nil
}

func (r *postgresProblemRepository) Delete(ctx context.Context, id string) error {
	if err := r.db.WithContext(ctx).Delete(&model.Problem{}, "id = ?", id).Error; err != nil {
		return fmt.Errorf("failed to delete problem: %w", err)
	}
	return nil
}

func (r *postgresProblemRepository) DeleteTestcase(ctx context.Context, id string) error {
	result := r.db.WithContext(ctx).Delete(&model.Testcase{}, "id = ?", id)
	if result.Error != nil {
		return fmt.Errorf("failed to delete testcase: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("testcase not found")
	}
	return nil
}
