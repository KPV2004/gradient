// apps/cms-service/handler/middleware/jwt_middleware.go
package middleware

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/KPV2004/gradient-backend/apps/cms-service/config"
	"github.com/KPV2004/gradient-backend/apps/shared/model"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// AuthMiddleware ตรวจสอบ JWT token ใน Header Authorization: Bearer <token>
func AuthMiddleware(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header is required"})
			c.Abort()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header must be Bearer <token>"})
			c.Abort()
			return
		}

		tokenStr := parts[1]
		claims := &jwt.MapClaims{}

		token, err := jwt.ParseWithClaims(tokenStr, claims, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return []byte(cfg.JWTSecret), nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			c.Abort()
			return
		}

		userID, ok1 := (*claims)["userID"].(string)
		roleStr, ok2 := (*claims)["role"].(string)
		if !ok1 || !ok2 {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
			c.Abort()
			return
		}

		// เซ็ตค่าลง Gin Context เพื่อให้ handler ดึงไปใช้ต่อ
		c.Set("userID", userID)
		c.Set("userRole", model.Role(roleStr))
		c.Next()
	}
}

// RequireRole ตรวจสอบว่าผู้ใช้มีบทบาทตามที่กำหนดหรือไม่ (เช่น Admin, Teacher)
func RequireRole(allowedRoles ...model.Role) gin.HandlerFunc {
	return func(c *gin.Context) {
		roleVal, exists := c.Get("userRole")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			c.Abort()
			return
		}

		userRole := roleVal.(model.Role)
		for _, role := range allowedRoles {
			if userRole == role {
				c.Next()
				return
			}
		}

		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: insufficient permissions"})
		c.Abort()
	}
}
