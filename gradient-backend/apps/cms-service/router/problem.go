// apps/cms-service/router/problem.go
package router

import (
	"github.com/KPV2004/gradient-backend/apps/cms-service/config"
	problemHandler "github.com/KPV2004/gradient-backend/apps/cms-service/handler/problem"
	"github.com/KPV2004/gradient-backend/apps/cms-service/handler/middleware"
	"github.com/KPV2004/gradient-backend/apps/shared/model"
	"github.com/gin-gonic/gin"
)

// RegisterProblemRoutes ลงทะเบียน API endpoints ด้านการจัดการโจทย์และ testcases
func RegisterProblemRoutes(apiGroup *gin.RouterGroup, problemH *problemHandler.ProblemHandler, cfg *config.Config) {
	problemsGroup := apiGroup.Group("/problems")
	problemsGroup.Use(middleware.AuthMiddleware(cfg))
	{
		problemsGroup.GET("", problemH.List)
		problemsGroup.GET("/:id", problemH.GetByID)
		problemsGroup.GET("/:id/testcases", problemH.GetTestcases)

		// เฉพาะผู้ที่มีสิทธิ์ระดับ Teacher หรือ Admin เท่านั้น
		teacherOrAdmin := problemsGroup.Group("")
		teacherOrAdmin.Use(middleware.RequireRole(model.RoleTeacher, model.RoleAdmin))
		{
			teacherOrAdmin.POST("", problemH.Create)
			teacherOrAdmin.PUT("/:id", problemH.Update)
			teacherOrAdmin.DELETE("/:id", problemH.Delete)
			teacherOrAdmin.POST("/:id/testcases", problemH.CreateTestcase)
			teacherOrAdmin.DELETE("/:id/testcases/:tcId", problemH.DeleteTestcase)
		}
	}
}
