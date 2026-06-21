// apps/cms-service/router/contest.go
package router

import (
	"github.com/KPV2004/gradient-backend/apps/cms-service/config"
	contestHandler "github.com/KPV2004/gradient-backend/apps/cms-service/handler/contest"
	"github.com/KPV2004/gradient-backend/apps/cms-service/handler/middleware"
	"github.com/KPV2004/gradient-backend/apps/shared/model"
	"github.com/gin-gonic/gin"
)

// RegisterContestRoutes ลงทะเบียน API endpoints ด้านการจัดการห้องสอบและการแข่งขัน
func RegisterContestRoutes(apiGroup *gin.RouterGroup, contestH *contestHandler.ContestHandler, cfg *config.Config) {
	contestsGroup := apiGroup.Group("/contests")
	contestsGroup.Use(middleware.AuthMiddleware(cfg))
	{
		contestsGroup.GET("", contestH.List)
		contestsGroup.GET("/:id", contestH.GetByID)
		contestsGroup.POST("/:id/join", contestH.Join)
		contestsGroup.GET("/:id/problems", contestH.GetProblems)
		contestsGroup.GET("/:id/participants", contestH.GetParticipants)

		// เฉพาะผู้ที่มีสิทธิ์ระดับ Teacher หรือ Admin เท่านั้น
		teacherOrAdmin := contestsGroup.Group("")
		teacherOrAdmin.Use(middleware.RequireRole(model.RoleTeacher, model.RoleAdmin))
		{
			teacherOrAdmin.POST("", contestH.Create)
			teacherOrAdmin.PUT("/:id", contestH.Update)
			teacherOrAdmin.DELETE("/:id", contestH.Delete)
			teacherOrAdmin.POST("/:id/problems", contestH.AddProblem)
		}
	}
}
