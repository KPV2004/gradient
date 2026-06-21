// apps/shared/model/activity_log.go
package model

import "time"

// ActivityLog บันทึกเหตุการณ์สำคัญในระบบ
type ActivityLog struct {
	ID        string    `gorm:"primaryKey" json:"id"`
	UserID    string    `gorm:"column:user_id" json:"user_id"`
	Username  string    `gorm:"column:username" json:"username"`
	Action    string    `gorm:"column:action" json:"action"` // 'login', 'register', 'submit'
	IPAddress string    `gorm:"column:ip_address" json:"ip_address"`
	UserAgent string    `gorm:"column:user_agent" json:"user_agent"`
	Metadata  string    `gorm:"column:metadata;type:jsonb" json:"metadata"` // JSON string
	CreatedAt time.Time `gorm:"column:created_at" json:"created_at"`
}
