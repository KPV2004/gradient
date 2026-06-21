// apps/shared/model/problem.go
package model

import "time"

// Difficulty ระดับความยากของโจทย์
type Difficulty string

const (
	DifficultyEasy   Difficulty = "easy"
	DifficultyMedium Difficulty = "medium"
	DifficultyHard   Difficulty = "hard"
)

// Problem โจทย์โปรแกรมมิ่ง
type Problem struct {
	ID              string
	Title           string
	Slug            string     // URL-friendly identifier เช่น "two-sum"
	Description     string     // Markdown
	InputFormat     string     // Markdown
	OutputFormat    string     // Markdown
	Constraints     string     // Markdown
	Difficulty      Difficulty
	TimeoutMs       int64  // เวลาสูงสุดต่อ testcase (ms)
	MemoryLimitMb   int64  // แรมสูงสุด (MB)
	Score           int    // คะแนนเต็มของโจทย์
	CreatedBy       string // User.ID
	IsPublished     bool
	Tags            string     `gorm:"column:tags;type:text"`
	CreatedAt       time.Time
	UpdatedAt       time.Time
}
