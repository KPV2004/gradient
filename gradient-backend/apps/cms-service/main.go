// apps/cms-service/main.go
package main

import (
	"log"
	"net/http"

	"github.com/KPV2004/gradient-backend/apps/cms-service/client"
	"github.com/KPV2004/gradient-backend/apps/cms-service/config"
	"github.com/KPV2004/gradient-backend/apps/cms-service/repository"
	"github.com/KPV2004/gradient-backend/apps/cms-service/router"
	"github.com/gin-gonic/gin"
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

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// 5. ลงทะเบียน handler endpoints และ middleware ทั้งหมด
	router.RegisterRoutes(r, db, graderClient, cfg)

	// 6. Start HTTP server
	addr := ":" + cfg.Port
	log.Printf("🚀 CMS Service listening on %s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatalf("🚨 HTTP server error: %v", err)
	}
}
