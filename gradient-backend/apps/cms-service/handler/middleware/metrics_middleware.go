// apps/cms-service/handler/middleware/metrics_middleware.go
package middleware

import (
	"strconv"

	"github.com/KPV2004/gradient-backend/apps/shared/metrics"
	"github.com/gin-gonic/gin"
)

// MetricsMiddleware counts HTTP requests processed by Gin (ponytail: keep middleware simple)
func MetricsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()
		path := c.FullPath()
		if path == "" {
			path = "unknown"
		}
		status := strconv.Itoa(c.Writer.Status())
		metrics.HTTPRequestsTotal.WithLabelValues(c.Request.Method, path, status).Inc()
	}
}
