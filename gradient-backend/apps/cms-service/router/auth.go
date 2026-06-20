// apps/cms-service/router/auth.go
package router

import (
	"github.com/KPV2004/gradient-backend/apps/cms-service/config"
	authHandler "github.com/KPV2004/gradient-backend/apps/cms-service/handler/auth"
	"github.com/KPV2004/gradient-backend/apps/cms-service/handler/middleware"
	"github.com/gin-gonic/gin"
)

// RegisterAuthRoutes ลงทะเบียน API endpoints ด้าน Authentication
func RegisterAuthRoutes(apiGroup *gin.RouterGroup, authH *authHandler.AuthHandler, cfg *config.Config) {
	authGroup := apiGroup.Group("/auth")
	{
		authGroup.POST("/register", authH.Register)
		authGroup.POST("/login", authH.Login)

		// เส้นทางที่ต้องการการยืนยันตัวตน (JWT)
		authRequired := authGroup.Group("")
		authRequired.Use(middleware.AuthMiddleware(cfg))
		{
			authRequired.GET("/me", authH.Me)
		}
	}
}
