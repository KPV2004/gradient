// apps/cms-service/repository/contest/contest_repository.go
package contest

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/KPV2004/gradient-backend/apps/shared/model"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

var (
	ErrContestNotFound = errors.New("contest not found")
)

type ContestProblemDetail struct {
	Problem    *model.Problem
	Label      string
	OrderIndex int
}

type ContestRepository interface {
	Create(ctx context.Context, c *model.Contest) error
	GetByID(ctx context.Context, id string) (*model.Contest, error)
	List(ctx context.Context) ([]*model.Contest, error)
	Update(ctx context.Context, c *model.Contest) error
	Delete(ctx context.Context, id string) error
	Join(ctx context.Context, contestID, userID string) error
	AddProblem(ctx context.Context, cp *model.ContestProblem) error
	GetProblems(ctx context.Context, contestID string) ([]*ContestProblemDetail, error)
	IsParticipant(ctx context.Context, contestID, userID string) (bool, error)
	GetParticipants(ctx context.Context, contestID string) ([]string, error)
}

type postgresContestRepository struct {
	db *gorm.DB
}

func NewContestRepository(db *gorm.DB) ContestRepository {
	return &postgresContestRepository{db: db}
}

func (r *postgresContestRepository) Create(ctx context.Context, c *model.Contest) error {
	if err := r.db.WithContext(ctx).Create(c).Error; err != nil {
		return fmt.Errorf("failed to create contest: %w", err)
	}
	return nil
}

func (r *postgresContestRepository) GetByID(ctx context.Context, id string) (*model.Contest, error) {
	var c model.Contest
	if err := r.db.WithContext(ctx).First(&c, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrContestNotFound
		}
		return nil, err
	}
	return &c, nil
}

func (r *postgresContestRepository) List(ctx context.Context) ([]*model.Contest, error) {
	var contests []*model.Contest
	if err := r.db.WithContext(ctx).Order("start_time ASC").Find(&contests).Error; err != nil {
		return nil, fmt.Errorf("failed to list contests: %w", err)
	}
	return contests, nil
}

func (r *postgresContestRepository) Join(ctx context.Context, contestID, userID string) error {
	participant := model.ContestParticipant{
		ContestID: contestID,
		UserID:    userID,
		JoinedAt:  time.Now(),
	}
	if err := r.db.WithContext(ctx).Clauses(clause.OnConflict{DoNothing: true}).Create(&participant).Error; err != nil {
		return fmt.Errorf("failed to join contest: %w", err)
	}
	return nil
}

func (r *postgresContestRepository) AddProblem(ctx context.Context, cp *model.ContestProblem) error {
	if err := r.db.WithContext(ctx).Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "contest_id"}, {Name: "problem_id"}},
		DoUpdates: clause.AssignmentColumns([]string{"label", "order_index"}),
	}).Create(cp).Error; err != nil {
		return fmt.Errorf("failed to add problem to contest: %w", err)
	}
	return nil
}

func (r *postgresContestRepository) GetProblems(ctx context.Context, contestID string) ([]*ContestProblemDetail, error) {
	type flatRow struct {
		ID            string
		Title         string
		Slug          string
		Description   string
		InputFormat   string
		OutputFormat  string
		Constraints   string
		Difficulty    model.Difficulty
		TimeoutMs     int64
		MemoryLimitMb int64
		Score         int
		CreatedBy     string
		IsPublished   bool
		CreatedAt     time.Time
		UpdatedAt     time.Time
		Label         string
		OrderIndex    int
	}

	var rows []flatRow
	query := `
		SELECT p.id, p.title, p.slug, p.description, p.input_format, p.output_format, p.constraints, 
		       p.difficulty, p.timeout_ms, p.memory_limit_mb, p.score, p.created_by, p.is_published, 
		       p.created_at, p.updated_at, cp.label, cp.order_index
		FROM contest_problems cp
		JOIN problems p ON cp.problem_id = p.id
		WHERE cp.contest_id = ?
		ORDER BY cp.order_index ASC
	`
	if err := r.db.WithContext(ctx).Raw(query, contestID).Scan(&rows).Error; err != nil {
		return nil, fmt.Errorf("failed to get contest problems: %w", err)
	}

	var list []*ContestProblemDetail
	for _, row := range rows {
		list = append(list, &ContestProblemDetail{
			Problem: &model.Problem{
				ID:            row.ID,
				Title:         row.Title,
				Slug:          row.Slug,
				Description:   row.Description,
				InputFormat:   row.InputFormat,
				OutputFormat:  row.OutputFormat,
				Constraints:   row.Constraints,
				Difficulty:    row.Difficulty,
				TimeoutMs:     row.TimeoutMs,
				MemoryLimitMb: row.MemoryLimitMb,
				Score:         row.Score,
				CreatedBy:     row.CreatedBy,
				IsPublished:   row.IsPublished,
				CreatedAt:     row.CreatedAt,
				UpdatedAt:     row.UpdatedAt,
			},
			Label:      row.Label,
			OrderIndex: row.OrderIndex,
		})
	}
	return list, nil
}

func (r *postgresContestRepository) IsParticipant(ctx context.Context, contestID, userID string) (bool, error) {
	var exists bool
	query := `
		SELECT EXISTS(
			SELECT 1 FROM contest_participants 
			WHERE contest_id = ? AND user_id = ?
		)
	`
	if err := r.db.WithContext(ctx).Raw(query, contestID, userID).Scan(&exists).Error; err != nil {
		return false, err
	}
	return exists, nil
}

func (r *postgresContestRepository) GetParticipants(ctx context.Context, contestID string) ([]string, error) {
	var usernames []string
	query := `
		SELECT u.username 
		FROM contest_participants cp
		JOIN users u ON cp.user_id = u.id
		WHERE cp.contest_id = ?
		ORDER BY cp.joined_at ASC
	`
	if err := r.db.WithContext(ctx).Raw(query, contestID).Scan(&usernames).Error; err != nil {
		return nil, fmt.Errorf("failed to get contest participants: %w", err)
	}
	if usernames == nil {
		usernames = []string{}
	}
	return usernames, nil
}

func (r *postgresContestRepository) Update(ctx context.Context, c *model.Contest) error {
	if err := r.db.WithContext(ctx).Save(c).Error; err != nil {
		return fmt.Errorf("failed to update contest: %w", err)
	}
	return nil
}

func (r *postgresContestRepository) Delete(ctx context.Context, id string) error {
	if err := r.db.WithContext(ctx).Delete(&model.Contest{}, "id = ?", id).Error; err != nil {
		return fmt.Errorf("failed to delete contest: %w", err)
	}
	return nil
}
