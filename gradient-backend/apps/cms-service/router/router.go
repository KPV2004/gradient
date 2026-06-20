// apps/cms-service/router/router.go
package router

import (
	"github.com/KPV2004/gradient-backend/apps/cms-service/client"
	"github.com/KPV2004/gradient-backend/apps/cms-service/config"
	contestHandler "github.com/KPV2004/gradient-backend/apps/cms-service/handler/contest"
	problemHandler "github.com/KPV2004/gradient-backend/apps/cms-service/handler/problem"
	subHandler "github.com/KPV2004/gradient-backend/apps/cms-service/handler/submission"
	authHandler "github.com/KPV2004/gradient-backend/apps/cms-service/handler/auth"
	contestRepo "github.com/KPV2004/gradient-backend/apps/cms-service/repository/contest"
	problemRepo "github.com/KPV2004/gradient-backend/apps/cms-service/repository/problem"
	subRepo "github.com/KPV2004/gradient-backend/apps/cms-service/repository/submission"
	authRepo "github.com/KPV2004/gradient-backend/apps/cms-service/repository/auth"
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

	// 2. Initialize Handlers
	authH := authHandler.NewAuthHandler(userRepository, cfg)
	problemH := problemHandler.NewProblemHandler(problemRepository)
	contestH := contestHandler.NewContestHandler(contestRepository)
	subH := subHandler.NewSubmissionHandler(subRepository, problemRepository, graderClient)

	// 3. API Group
	apiGroup := r.Group("/api")

	// 4. Register modular routes
	RegisterAuthRoutes(apiGroup, authH, cfg)
	RegisterProblemRoutes(apiGroup, problemH, cfg)
	RegisterContestRoutes(apiGroup, contestH, cfg)
	RegisterSubmissionRoutes(apiGroup, subH, cfg)
}
