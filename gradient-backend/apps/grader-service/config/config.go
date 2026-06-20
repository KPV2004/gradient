// apps/grader-service/config/config.go
package config

import (
	"fmt"
	"log"
	"os"

	"gopkg.in/yaml.v3"
)

// ─── Environment Config ──────────────────────────────────────

// Config เก็บ config ทั้งหมดที่โหลดจาก environment variables
type Config struct {
	Port        string
	Env         string
	PostgresDSN string
	Profiles    *SandboxProfiles // โหลดจาก YAML พร้อมกันเลย
}

// Load อ่าน env vars และ YAML profile ทีเดียวจบ
func Load() *Config {
	profilePath := getEnv("GRADER_SANDBOX_PROFILE_PATH", "./config/sandbox_profiles.yaml")

	profiles, err := loadSandboxProfiles(profilePath)
	if err != nil {
		log.Fatalf("❌ Failed to load sandbox profiles from %s: %v", profilePath, err)
	}

	return &Config{
		Port:        getEnv("GRADER_PORT", "8081"),
		Env:         getEnv("APP_ENV", "development"),
		PostgresDSN: buildPostgresDSN(),
		Profiles:    profiles,
	}
}

// ─── Sandbox Profile (จาก YAML) ─────────────────────────────

// LanguageProfile เก็บ Docker image และคำสั่งสำหรับแต่ละภาษา
type LanguageProfile struct {
	Image      string `yaml:"image"`
	CompileCmd string `yaml:"compile_cmd"`
	RunCmd     string `yaml:"run_cmd"`
}

// SandboxProfiles เก็บ profile ของทุกภาษาที่รองรับ
type SandboxProfiles struct {
	Languages map[string]LanguageProfile `yaml:"languages"`
}

// loadSandboxProfiles อ่านไฟล์ YAML แล้ว parse เป็น SandboxProfiles
func loadSandboxProfiles(filePath string) (*SandboxProfiles, error) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return nil, fmt.Errorf("read file: %w", err)
	}

	var profiles SandboxProfiles
	if err := yaml.Unmarshal(data, &profiles); err != nil {
		return nil, fmt.Errorf("parse yaml: %w", err)
	}

	return &profiles, nil
}

// ─── Helpers ────────────────────────────────────────────────

func buildPostgresDSN() string {
	return fmt.Sprintf(
		"postgres://%s:%s@%s:%s/%s?sslmode=%s",
		getEnv("POSTGRES_USER", "gradient_user"),
		getEnv("POSTGRES_PASSWORD", "gradient_pass"),
		getEnv("POSTGRES_HOST", "localhost"),
		getEnv("POSTGRES_PORT", "5432"),
		getEnv("POSTGRES_DB", "gradient"),
		getEnv("POSTGRES_SSLMODE", "disable"),
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
