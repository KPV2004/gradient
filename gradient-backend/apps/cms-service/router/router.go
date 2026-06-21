// apps/cms-service/router/router.go
package router

import (
	"github.com/KPV2004/gradient-backend/apps/cms-service/client"
	"github.com/KPV2004/gradient-backend/apps/cms-service/config"
	adminHandler "github.com/KPV2004/gradient-backend/apps/cms-service/handler/admin"
	authHandler "github.com/KPV2004/gradient-backend/apps/cms-service/handler/auth"
	contestHandler "github.com/KPV2004/gradient-backend/apps/cms-service/handler/contest"
	problemHandler "github.com/KPV2004/gradient-backend/apps/cms-service/handler/problem"
	subHandler "github.com/KPV2004/gradient-backend/apps/cms-service/handler/submission"
	activityRepo "github.com/KPV2004/gradient-backend/apps/cms-service/repository/activity"
	authRepo "github.com/KPV2004/gradient-backend/apps/cms-service/repository/auth"
	contestRepo "github.com/KPV2004/gradient-backend/apps/cms-service/repository/contest"
	problemRepo "github.com/KPV2004/gradient-backend/apps/cms-service/repository/problem"
	subRepo "github.com/KPV2004/gradient-backend/apps/cms-service/repository/submission"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// RegisterRoutes ลงทะเบียน API endpoints ทั้งหมดของ CMS Service
func RegisterRoutes(r *gin.Engine, db *gorm.DB, graderClient *client.GraderClient, cfg *config.Config) {
	// 1. Initialize Repositories
	userRepository := authRepo.NewUserRepository(db)
	problemRepository := problemRepo.NewProblemRepository(db)
	contestRepository := contestRepo.NewContestRepository(db)
	subRepository := subRepo.NewSubmissionRepository(db)
	activityRepository := activityRepo.NewActivityRepository(db)

	// 2. Initialize Handlers
	authH := authHandler.NewAuthHandler(userRepository, activityRepository, cfg)
	problemH := problemHandler.NewProblemHandler(problemRepository)
	contestH := contestHandler.NewContestHandler(contestRepository)
	subH := subHandler.NewSubmissionHandler(subRepository, problemRepository, graderClient, activityRepository)
	adminH := adminHandler.NewAdminHandler(userRepository, subRepository, activityRepository, db, cfg)

	// 3. API Group
	apiGroup := r.Group("/api")

	// 4. Register modular routes
	RegisterAuthRoutes(apiGroup, authH, cfg)
	RegisterProblemRoutes(apiGroup, problemH, cfg)
	RegisterContestRoutes(apiGroup, contestH, cfg)
	RegisterSubmissionRoutes(apiGroup, subH, cfg)
	RegisterAdminRoutes(apiGroup, adminH, cfg)
}
