// apps/cms-service/router/submission.go
package router

import (
	"github.com/KPV2004/gradient-backend/apps/cms-service/config"
	subHandler "github.com/KPV2004/gradient-backend/apps/cms-service/handler/submission"
	"github.com/KPV2004/gradient-backend/apps/cms-service/handler/middleware"
	"github.com/gin-gonic/gin"
)

// RegisterSubmissionRoutes ลงทะเบียน API endpoints ด้านการส่งโค้ดตรวจคำตอบ
func RegisterSubmissionRoutes(apiGroup *gin.RouterGroup, subH *subHandler.SubmissionHandler, cfg *config.Config) {
	submissionsGroup := apiGroup.Group("/submissions")
	submissionsGroup.Use(middleware.AuthMiddleware(cfg))
	{
		submissionsGroup.POST("", subH.Create)
		submissionsGroup.GET("/:id", subH.GetByID)
		submissionsGroup.GET("", subH.List)
	}
}
