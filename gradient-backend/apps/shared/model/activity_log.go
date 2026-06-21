// apps/shared/model/activity_log.go
package model

import "time"

// ActivityLog บันทึกเหตุการณ์สำคัญในระบบ
type ActivityLog struct {
	ID        string    `gorm:"primaryKey"`
	UserID    string    `gorm:"column:user_id"`
	Username  string    `gorm:"column:username"`
	Action    string    `gorm:"column:action"` // 'login', 'register', 'submit'
	IPAddress string    `gorm:"column:ip_address"`
	UserAgent string    `gorm:"column:user_agent"`
	Metadata  string    `gorm:"column:metadata;type:jsonb"` // JSON string
	CreatedAt time.Time `gorm:"column:created_at"`
}
