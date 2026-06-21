// apps/cms-service/router/admin.go
package router

import (
	"github.com/KPV2004/gradient-backend/apps/cms-service/config"
	adminHandler "github.com/KPV2004/gradient-backend/apps/cms-service/handler/admin"
	"github.com/KPV2004/gradient-backend/apps/cms-service/handler/middleware"
	"github.com/KPV2004/gradient-backend/apps/shared/model"
	"github.com/gin-gonic/gin"
)

func RegisterAdminRoutes(apiGroup *gin.RouterGroup, adminH *adminHandler.AdminHandler, cfg *config.Config) {
	adminGroup := apiGroup.Group("/admin")
	adminGroup.Use(middleware.AuthMiddleware(cfg))
	adminGroup.Use(middleware.RequireRole(model.RoleAdmin))
	{
		// User management
		adminGroup.GET("/users", adminH.ListUsers)
		adminGroup.GET("/users/:id", adminH.GetUser)
		adminGroup.PATCH("/users/:id", adminH.UpdateUser)
		adminGroup.DELETE("/users/:id", adminH.DeleteUser)

		// Submission monitoring
		adminGroup.GET("/submissions", adminH.ListAllSubmissions)
		adminGroup.DELETE("/submissions/:id/kill", adminH.KillSubmission)
		adminGroup.POST("/submissions/:id/resend", adminH.ResendSubmission)

		// Activity logs
		adminGroup.GET("/activity-logs", adminH.ListActivityLogs)

		// Infrastructure metrics (Prometheus querying)
		adminGroup.GET("/infra-metrics", adminH.GetInfraMetrics)
	}
}
