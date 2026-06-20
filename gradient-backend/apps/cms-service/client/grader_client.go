// apps/cms-service/client/grader_client.go
package client

import (
	"context"
	"fmt"
	"log"

	pb "github.com/KPV2004/gradient-backend/apps/shared/proto"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

// GraderClient เป็น wrapper สำหรับเรียก Grader Service ผ่าน gRPC
type GraderClient struct {
	conn   *grpc.ClientConn
	client pb.GraderServiceClient
}

// NewGraderClient สร้าง connection ไปยัง Grader Service
// addr เช่น "localhost:8081"
func NewGraderClient(addr string) (*GraderClient, error) {
	conn, err := grpc.NewClient(addr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return nil, fmt.Errorf("failed to connect to grader service at %s: %w", addr, err)
	}

	log.Printf("🔗 Connected to Grader Service at %s", addr)

	return &GraderClient{
		conn:   conn,
		client: pb.NewGraderServiceClient(conn),
	}, nil
}

// Grade ส่งโค้ดไปให้ Grader ตรวจ แล้วรอรับผลลัพธ์
func (c *GraderClient) Grade(ctx context.Context, req *pb.GradeRequest) (*pb.GradeResponse, error) {
	return c.client.Grade(ctx, req)
}

// Close ปิด gRPC connection
func (c *GraderClient) Close() error {
	return c.conn.Close()
}
