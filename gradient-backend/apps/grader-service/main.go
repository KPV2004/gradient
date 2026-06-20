// apps/grader-service/main.go
package main

import (
	"context"
	"log"
	"net"

	"github.com/KPV2004/gradient-backend/apps/grader-service/config"
	"github.com/KPV2004/gradient-backend/apps/grader-service/engine"
	"github.com/KPV2004/gradient-backend/apps/grader-service/handler"
	"github.com/KPV2004/gradient-backend/apps/grader-service/repository"
	pb "github.com/KPV2004/gradient-backend/apps/shared/proto"
	"google.golang.org/grpc"
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

	// 3. สร้าง Repository
	subRepo := repository.NewSubmissionRepository(db)

	// 4. เปิด Docker Sandbox Client
	sandbox, err := engine.NewDockerSandbox()
	if err != nil {
		log.Fatalf("🚨 Failed to start Docker Sandbox client: %v", err)
	}

	// 4.5 Pre-pull Docker images in the background on startup
	var imageList []string
	if cfg.Profiles != nil && cfg.Profiles.Languages != nil {
		for _, profile := range cfg.Profiles.Languages {
			if profile.Image != "" {
				imageList = append(imageList, profile.Image)
			}
		}
	}
	if len(imageList) > 0 {
		sandbox.PrePullImages(context.Background(), imageList)
	}

	// 5. สร้าง gRPC Server พร้อม wire ทุก dependency
	grpcServer := grpc.NewServer()
	graderHandler := handler.NewGraderHandler(cfg.Profiles, sandbox, subRepo)
	pb.RegisterGraderServiceServer(grpcServer, graderHandler)

	// 7. เปิด TCP Listener
	addr := ":" + cfg.Port
	lis, err := net.Listen("tcp", addr)
	if err != nil {
		log.Fatalf("🚨 Failed to listen on %s: %v", addr, err)
	}

	log.Printf("🚀 Grader gRPC Service listening on %s", addr)

	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("🚨 gRPC server error: %v", err)
	}
}
