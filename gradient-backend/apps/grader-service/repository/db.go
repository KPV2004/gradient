// apps/grader-service/repository/db.go
package repository

import (
	"fmt"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// NewDB สร้าง GORM DB connection สำหรับ Grader Service
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

	return db, nil
}
