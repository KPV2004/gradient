// apps/cms-service/main.go
package main

import (
	"log"
	"net/http"
	"time"

	"github.com/KPV2004/gradient-backend/apps/cms-service/client"
	"github.com/KPV2004/gradient-backend/apps/cms-service/config"
	"github.com/KPV2004/gradient-backend/apps/cms-service/handler/middleware"
	"github.com/KPV2004/gradient-backend/apps/cms-service/repository"
	"github.com/KPV2004/gradient-backend/apps/cms-service/router"
	"github.com/KPV2004/gradient-backend/apps/shared/metrics"
	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

func main() {

	// 1. โหลด Config จาก environment variables
	cfg := config.Load()

	// 2. เชื่อมต่อ PostgreSQL
	db, err := repository.NewDB(cfg.PostgresDSN)
	if err != nil {
		log.Fatalf("🚨 Failed to connect to database: %v", err)
	}
	sqlDB, err := db.DB()
	if err == nil {
		defer sqlDB.Close()
	}
	log.Println("✅ Connected to PostgreSQL (via GORM)")

	// 3. เชื่อมต่อ Grader Service ผ่าน gRPC
	graderClient, err := client.NewGraderClient(cfg.GraderAddr)
	if err != nil {
		log.Fatalf("🚨 Failed to connect to grader service: %v", err)
	}
	defer graderClient.Close()

	// 4. Setup Gin router
	if cfg.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.Default()

	// Use metrics middleware to count requests (ponytail: keep middleware setup minimal)
	r.Use(middleware.MetricsMiddleware())

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// Prometheus metrics endpoint
	r.GET("/metrics", gin.WrapH(promhttp.Handler()))

	// Start DB connections metrics exporter in background
	go func() {
		ticker := time.NewTicker(5 * time.Second)
		for range ticker.C {
			if sqlDB, err := db.DB(); err == nil {
				stats := sqlDB.Stats()
				metrics.DBConnectionsOpen.Set(float64(stats.OpenConnections))
				metrics.DBConnectionsInUse.Set(float64(stats.InUse))
			}
		}
	}()

	// 5. ลงทะเบียน handler endpoints และ middleware ทั้งหมด
	router.RegisterRoutes(r, db, graderClient, cfg)

	// 6. Start HTTP server
	addr := ":" + cfg.Port
	log.Printf("🚀 CMS Service listening on %s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatalf("🚨 HTTP server error: %v", err)
	}
}
