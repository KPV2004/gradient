// apps/shared/model/submission.go
package model

import "time"

// SubmissionStatus สถานะการตรวจโค้ด
type SubmissionStatus string

const (
	StatusPending  SubmissionStatus = "pending"           // รอตรวจ
	StatusRunning  SubmissionStatus = "running"           // กำลังรัน
	StatusAC       SubmissionStatus = "accepted"          // ถูกต้อง
	StatusWA       SubmissionStatus = "wrong_answer"      // คำตอบผิด
	StatusTLE      SubmissionStatus = "time_limit_exceeded"  // เกินเวลา
	StatusMLE      SubmissionStatus = "memory_limit_exceeded" // เกิน memory
	StatusRE       SubmissionStatus = "runtime_error"     // เกิด error ขณะรัน
	StatusCE       SubmissionStatus = "compile_error"     // คอมไพล์ไม่ผ่าน
	StatusSE       SubmissionStatus = "system_error"      // ระบบผิดพลาด
)

// Submission เก็บข้อมูลการส่งโค้ดของผู้ใช้
type Submission struct {
	ID            string
	ProblemID     string
	UserID        string
	Language      string
	SourceCode    string
	Status        SubmissionStatus
	Score         int
	TimeUsedMs    int64
	MemoryUsedKb  int64
	Stdout        string
	Stderr        string
	CreatedAt     time.Time
	UpdatedAt     time.Time
}
