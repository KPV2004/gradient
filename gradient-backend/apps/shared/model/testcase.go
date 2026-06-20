// apps/shared/model/testcase.go
package model

// Testcase ชุดข้อมูล input/output สำหรับตรวจคำตอบ
type Testcase struct {
	ID             string
	ProblemID      string
	OrderIndex     int    // ลำดับการรัน (1, 2, 3, ...)
	Input          string // stdin ที่ส่งเข้าโปรแกรม
	ExpectedOutput string // output ที่ถูกต้อง
	IsSample       bool   // แสดงให้นักเรียนเห็นหรือไม่
	Score          int    // คะแนนของ testcase นี้
}
