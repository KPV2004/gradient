// apps/cms-service/config/config.go
package config

import (
	"fmt"
	"log"
	"os"
	"time"
)

// Config เก็บ config ทั้งหมดของ CMS Service
type Config struct {
	Port        string
	Env         string
	PostgresDSN string
	GraderAddr  string
	JWTSecret   string
	JWTExpires  time.Duration
}

// Load อ่านค่าจาก environment variables
func Load() *Config {
	jwtExpires, err := time.ParseDuration(getEnv("JWT_EXPIRES_IN", "24h"))
	if err != nil {
		log.Printf("⚠️  JWT_EXPIRES_IN format invalid, using default 24h: %v", err)
		jwtExpires = 24 * time.Hour
	}

	return &Config{
		Port:        getEnv("CMS_PORT", "8080"),
		Env:         getEnv("APP_ENV", "development"),
		PostgresDSN: buildPostgresDSN(),
		GraderAddr:  getEnv("GRADER_ADDR", "localhost:8081"),
		JWTSecret:   mustGetEnv("JWT_SECRET"),
		JWTExpires:  jwtExpires,
	}
}

// buildPostgresDSN ประกอบ DSN string สำหรับ pgx
func buildPostgresDSN() string {
	host := getEnv("POSTGRES_HOST", "localhost")
	port := getEnv("POSTGRES_PORT", "5432")
	user := getEnv("POSTGRES_USER", "gradient_user")
	pass := getEnv("POSTGRES_PASSWORD", "gradient_pass")
	db := getEnv("POSTGRES_DB", "gradient")
	sslmode := getEnv("POSTGRES_SSLMODE", "disable")

	return fmt.Sprintf(
		"postgres://%s:%s@%s:%s/%s?sslmode=%s",
		user, pass, host, port, db, sslmode,
	)
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}

func mustGetEnv(key string) string {
	val := os.Getenv(key)
	if val == "" {
		log.Fatalf("❌ Required environment variable %q is not set", key)
	}
	return val
}
