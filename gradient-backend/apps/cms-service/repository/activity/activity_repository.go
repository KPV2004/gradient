// apps/cms-service/repository/activity/activity_repository.go
package activity

import (
	"context"

	"github.com/KPV2004/gradient-backend/apps/shared/model"
	"gorm.io/gorm"
)

type ActivityRepository interface {
	Create(ctx context.Context, log *model.ActivityLog) error
	List(ctx context.Context, limit int) ([]*model.ActivityLog, error)
}

type postgresActivityRepository struct {
	db *gorm.DB
}

func NewActivityRepository(db *gorm.DB) ActivityRepository {
	return &postgresActivityRepository{db: db}
}

func (r *postgresActivityRepository) Create(ctx context.Context, log *model.ActivityLog) error {
	return r.db.WithContext(ctx).Create(log).Error
}

func (r *postgresActivityRepository) List(ctx context.Context, limit int) ([]*model.ActivityLog, error) {
	var logs []*model.ActivityLog
	if limit <= 0 {
		limit = 50
	}
	err := r.db.WithContext(ctx).Order("created_at DESC").Limit(limit).Find(&logs).Error
	return logs, err
}
