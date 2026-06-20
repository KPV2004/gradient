// apps/shared/model/user.go
package model

import "time"

// Role บทบาทของผู้ใช้ในระบบ
type Role string

const (
	RoleStudent Role = "student" // นักเรียน/ผู้ส่งโค้ด
	RoleTeacher Role = "teacher" // ผู้ออกโจทย์
	RoleAdmin   Role = "admin"   // ผู้ดูแลระบบ
)

// User ข้อมูลบัญชีผู้ใช้
type User struct {
	ID           string
	Username     string
	Email        string
	PasswordHash string
	DisplayName  string
	Role         Role
	CreatedAt    time.Time
	UpdatedAt    time.Time
}
