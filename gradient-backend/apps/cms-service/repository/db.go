// apps/cms-service/repository/db.go
package repository

import (
	"fmt"

	"github.com/KPV2004/gradient-backend/apps/shared/model"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// NewDB สร้าง GORM DB connection สำหรับ CMS Service
func NewDB(dsn string) (*gorm.DB, error) {
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, fmt.Errorf("unable to connect to database: %w", err)
	}

	// ทดสอบ connection
	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("unable to get database instance: %w", err)
	}

	if err := sqlDB.Ping(); err != nil {
		return nil, fmt.Errorf("unable to ping database: %w", err)
	}

	// Run migrations (ponytail: automatically migrate tables to avoid missing table errors)
	if err := db.AutoMigrate(&model.ActivityLog{}); err != nil {
		return nil, fmt.Errorf("failed to auto-migrate: %w", err)
	}

	return db, nil
}
