// apps/shared/queue/redis_queue.go
package queue

import (
	"context"

	"github.com/redis/go-redis/v9"
)

// นิยามคีย์หลักที่จะใช้ใน Redis เพื่อความเป็นเอกภาพ
const (
	PendingQueue    = "gradient:queue:pending"    // คิวหลักที่งานมารอตรวจ
	ProcessingQueue = "gradient:queue:processing" // คิวสำรองระบุงานที่กำลังตรวจอยู่ (Safety)
)

type GraderQueue struct {
	client *redis.Client
}

func NewGraderQueue(rdb *redis.Client) *GraderQueue {
	return &GraderQueue{client: rdb}
}

// 🌐 ฝั่ง CMS ใช้: ผลัก Submission ID ลงคิวรอตรวจ (Left Push)
func (q *GraderQueue) PushSubmission(ctx context.Context, submissionID string) error {
	return q.client.LPush(ctx, PendingQueue, submissionID).Err()
}

// 🛡️ ฝั่ง Grader Service ใช้: ดึงงานออกจากคิวหลักไปเก็บไว้ในคิวประมวลผล (Reliable Pop)
// กลไกนี้จะย้ายไอดีจาก Pending -> Processing ทันทีแบบ Atomic
// ถ้าระบบ Grader ดับกลางคัน ไอดีจะยังอยู่ใน ProcessingQueue ไม่หายไปในอากาศ
func (q *GraderQueue) PopAndReserve(ctx context.Context) (string, error) {
	// RPopLPush: ดึงจากขวาของ Pending ไปหย่อนซ้ายของ Processing
	return q.client.RPopLPush(ctx, PendingQueue, ProcessingQueue).Result()
}

// 🛡️ ฝั่ง Grader Service ใช้: เมื่อตรวจเสร็จแล้ว (ได้ผล AC/WA) ให้ลบงานออกจากคิวประมวลผล
func (q *GraderQueue) DequeueComplete(ctx context.Context, submissionID string) error {
	return q.client.LRem(ctx, ProcessingQueue, 1, submissionID).Err()
}

// 🌐 ฝั่ง CMS (WebSocket) ใช้: ดึงรายการ ID ทั้งหมดที่กำลังต่อคิวอยู่ไปโชว์หน้าบ้าน (Next.js)
func (q *GraderQueue) GetPendingSubmissions(ctx context.Context) ([]string, error) {
	// ดึงค่าทั้งหมดใน List ตั้งแต่ตัวแรกยันตัวสุดท้าย
	return q.client.LRange(ctx, PendingQueue, 0, -1).Result()
}
