// apps/shared/model/contest.go
package model

import "time"

// ContestStatus สถานะของ contest
type ContestStatus string

const (
	ContestUpcoming ContestStatus = "upcoming" // ยังไม่เริ่ม
	ContestRunning  ContestStatus = "running"  // กำลังแข่ง
	ContestEnded    ContestStatus = "ended"    // จบแล้ว
)

// Contest การแข่งขันโปรแกรมมิ่ง
type Contest struct {
	ID          string
	Title       string
	Description string // Markdown
	StartTime   time.Time
	EndTime     time.Time
	CreatedBy   string // User.ID
	IsPublic    bool   // เปิดให้สมัครเองหรือต้องเชิญ
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

// Status คำนวณสถานะปัจจุบันของ contest
func (c *Contest) Status() ContestStatus {
	now := time.Now()
	switch {
	case now.Before(c.StartTime):
		return ContestUpcoming
	case now.After(c.EndTime):
		return ContestEnded
	default:
		return ContestRunning
	}
}

// ContestProblem เชื่อม Contest กับ Problem (many-to-many)
type ContestProblem struct {
	ContestID  string
	ProblemID  string
	Label      string // ป้ายชื่อโจทย์ใน contest เช่น "A", "B", "C"
	OrderIndex int
}

// ContestParticipant ผู้เข้าร่วมแข่งขัน
type ContestParticipant struct {
	ContestID  string
	UserID     string
	JoinedAt   time.Time
}
