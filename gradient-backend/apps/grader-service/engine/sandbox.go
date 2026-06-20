// apps/grader-service/engine/sandbox.go
package engine

import (
	"archive/tar"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/containerd/errdefs"
	"github.com/moby/moby/api/pkg/stdcopy"
	"github.com/moby/moby/api/types/container"
	dockerclient "github.com/moby/moby/client"
)

// SandboxConfig สเปกคอนฟิกที่ handler คำนวณและส่งมาให้รัน
type SandboxConfig struct {
	Image       string
	CompileCmd  string
	RunCmd      string
	Stdin       string        // Input ของ testcase
	Timeout     time.Duration // เป็นหน่วย time.Duration
	MemoryLimit int64         // เป็นหน่วย Bytes
}

// SandboxResult ผลลัพธ์ดิบที่ Sandbox ส่งคืนให้ handler
type SandboxResult struct {
	Stdout   string
	Stderr   string
	IsTLE    bool
	ExitCode int
}

type DockerSandbox struct {
	cli *dockerclient.Client
}

func NewDockerSandbox() (*DockerSandbox, error) {
	cli, err := dockerclient.NewClientWithOpts(dockerclient.FromEnv, dockerclient.WithAPIVersionNegotiation())
	if err != nil {
		return nil, err
	}
	return &DockerSandbox{cli: cli}, nil
}

// RunCodeWithProfile รันโค้ดนักเรียนใน Docker sandbox แบบ isolated
func (s *DockerSandbox) RunCodeWithProfile(ctx context.Context, cfg SandboxConfig, sourceCode string, filename string) (*SandboxResult, error) {

	// 1. ตั้งค่า Isolation & Resource Limits
	hostConfig := &container.HostConfig{
		Resources: container.Resources{
			Memory: cfg.MemoryLimit, // 🛡️ MLE Protection
		},
		NetworkMode: "none", // 🛡️ ตัดเน็ตเวิร์กทิ้ง
	}

	// 2. สร้าง shell command (compile → run)
	var combinedCmd string
	if cfg.CompileCmd != "" {
		if cfg.Stdin != "" {
			combinedCmd = fmt.Sprintf("%s && %s < input.txt", cfg.CompileCmd, cfg.RunCmd)
		} else {
			combinedCmd = fmt.Sprintf("%s && %s", cfg.CompileCmd, cfg.RunCmd)
		}
	} else {
		if cfg.Stdin != "" {
			combinedCmd = fmt.Sprintf("%s < input.txt", cfg.RunCmd)
		} else {
			combinedCmd = cfg.RunCmd
		}
	}

	// 2.5 🛡️ ตรวจสอบและ Pull Image อัตโนมัติหากไม่มีอยู่ในเครื่อง (ใช้ Background context เพื่อกัน timeout จาก client)
	pullCtx, pullCancel := context.WithTimeout(context.Background(), 15*time.Minute)
	defer pullCancel()

	_, err := s.cli.ImageInspect(pullCtx, cfg.Image)
	if err != nil {
		if errdefs.IsNotFound(err) {
			fmt.Printf("📦 Image %s not found locally. Pulling...\n", cfg.Image)

			pullStream, err := s.cli.ImagePull(pullCtx, cfg.Image, dockerclient.ImagePullOptions{})
			if err != nil {
				return nil, fmt.Errorf("failed to pull image %s: %w", cfg.Image, err)
			}
			defer pullStream.Close()

			// ⚡ แกะอ่าน JSON Lines จาก Docker Daemon แบบ Real-time
			decoder := json.NewDecoder(pullStream)
			for {
				var msg struct {
					Status   string `json:"status"`
					ID       string `json:"id,omitempty"`
					Progress string `json:"progress,omitempty"`
					Error    string `json:"error,omitempty"`
				}

				if err := decoder.Decode(&msg); err != nil {
					if err.Error() == "EOF" { // อ่านจนจบสตรีม (ดาวน์โหลดเสร็จ)
						break
					}
					return nil, fmt.Errorf("error decoding pull log: %w", err)
				}

				// พ่นข้อมูลออกมาดูที่ Console ของ Grader
				if msg.Error != "" {
					return nil, fmt.Errorf("pull error: %s", msg.Error)
				}
				if msg.ID != "" && msg.Progress != "" {
					fmt.Printf("[%s] %s: %s\n", msg.ID, msg.Status, msg.Progress)
				} else if msg.ID != "" {
					fmt.Printf("[%s] %s\n", msg.ID, msg.Status)
				} else {
					fmt.Println(msg.Status)
				}
			}

			fmt.Printf("✅ Successfully pulled image %s\n", cfg.Image)
		} else {
			return nil, fmt.Errorf("failed to inspect image: %w", err)
		}
	}

	// 3. สร้าง Container
	createResp, err := s.cli.ContainerCreate(ctx, dockerclient.ContainerCreateOptions{
		Config: &container.Config{
			Image:        cfg.Image,
			Cmd:          []string{"sh", "-c", combinedCmd},
			AttachStdout: true,
			AttachStderr: true,
		},
		HostConfig: hostConfig,
	})
	if err != nil {
		return nil, fmt.Errorf("container create failed: %w", err)
	}

	// ประกันว่า container จะถูกลบทิ้งเสมอ
	defer s.cli.ContainerRemove(ctx, createResp.ID, dockerclient.ContainerRemoveOptions{Force: true}) //nolint:errcheck

	// 3.5 Copy files (source code and input file) into the container via Tar archive
	tarBuf := new(bytes.Buffer)
	tw := tar.NewWriter(tarBuf)

	// Add source code file
	hdr := &tar.Header{
		Name: filename,
		Mode: 0644,
		Size: int64(len(sourceCode)),
	}
	if err := tw.WriteHeader(hdr); err != nil {
		return nil, fmt.Errorf("failed to write tar header for source: %w", err)
	}
	if _, err := tw.Write([]byte(sourceCode)); err != nil {
		return nil, fmt.Errorf("failed to write tar content for source: %w", err)
	}

	// Add input file if stdin is provided
	if cfg.Stdin != "" {
		hdrStdin := &tar.Header{
			Name: "input.txt",
			Mode: 0644,
			Size: int64(len(cfg.Stdin)),
		}
		if err := tw.WriteHeader(hdrStdin); err != nil {
			return nil, fmt.Errorf("failed to write tar header for stdin: %w", err)
		}
		if _, err := tw.Write([]byte(cfg.Stdin)); err != nil {
			return nil, fmt.Errorf("failed to write tar content for stdin: %w", err)
		}
	}

	if err := tw.Close(); err != nil {
		return nil, fmt.Errorf("failed to close tar writer: %w", err)
	}

	_, err = s.cli.CopyToContainer(ctx, createResp.ID, dockerclient.CopyToContainerOptions{
		DestinationPath: "/",
		Content:         tarBuf,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to copy files to container: %w", err)
	}

	// 4. Start Container
	if _, err := s.cli.ContainerStart(ctx, createResp.ID, dockerclient.ContainerStartOptions{}); err != nil {
		return nil, fmt.Errorf("container start failed: %w", err)
	}

	// 5. ⏳ แข่งกันระหว่าง "รันเสร็จ" vs "TLE"
	type waitResult struct {
		statusCode int64
		err        error
	}
	doneChan := make(chan waitResult, 1)

	go func() {
		waitRes := s.cli.ContainerWait(ctx, createResp.ID, dockerclient.ContainerWaitOptions{
			Condition: container.WaitConditionNotRunning,
		})
		select {
		case err := <-waitRes.Error:
			doneChan <- waitResult{err: err}
		case resp := <-waitRes.Result:
			doneChan <- waitResult{statusCode: resp.StatusCode}
		}
	}()

	select {
	case wr := <-doneChan:
		if wr.err != nil {
			return nil, wr.err
		}

		// ดึง stdout/stderr ออกจาก container logs
		logsRes, err := s.cli.ContainerLogs(ctx, createResp.ID, dockerclient.ContainerLogsOptions{
			ShowStdout: true,
			ShowStderr: true,
		})
		if err != nil {
			return nil, fmt.Errorf("container logs failed: %w", err)
		}
		defer logsRes.Close()

		var stdout, stderr bytes.Buffer
		_, _ = stdcopy.StdCopy(&stdout, &stderr, logsRes)

		return &SandboxResult{
			Stdout:   stdout.String(),
			Stderr:   stderr.String(),
			IsTLE:    false,
			ExitCode: int(wr.statusCode),
		}, nil

	case <-time.After(cfg.Timeout):
		// 🚨 TLE — Kill container ทันที
		_, _ = s.cli.ContainerKill(ctx, createResp.ID, dockerclient.ContainerKillOptions{Signal: "SIGKILL"})
		return &SandboxResult{
			IsTLE:    true,
			ExitCode: 137,
		}, nil
	}
}

// PrePullImages loops over all provided images and pulls them in the background on startup
func (s *DockerSandbox) PrePullImages(ctx context.Context, images []string) {
	for _, img := range images {
		go func(imageName string) {
			pullCtx, cancel := context.WithTimeout(context.Background(), 15*time.Minute)
			defer cancel()

			_, err := s.cli.ImageInspect(pullCtx, imageName)
			if err != nil {
				if errdefs.IsNotFound(err) {
					fmt.Printf("📦 [Startup Pre-Pull] Image %s not found. Pulling in background...\n", imageName)
					pullStream, err := s.cli.ImagePull(pullCtx, imageName, dockerclient.ImagePullOptions{})
					if err != nil {
						fmt.Printf("❌ [Startup Pre-Pull] Failed to pull image %s: %v\n", imageName, err)
						return
					}
					defer pullStream.Close()

					decoder := json.NewDecoder(pullStream)
					for {
						var msg struct {
							Status string `json:"status"`
							Error  string `json:"error,omitempty"`
						}
						if err := decoder.Decode(&msg); err != nil {
							if err.Error() == "EOF" {
								break
							}
							fmt.Printf("❌ [Startup Pre-Pull] Error decoding pull log for %s: %v\n", imageName, err)
							return
						}
						if msg.Error != "" {
							fmt.Printf("❌ [Startup Pre-Pull] Pull error for %s: %s\n", imageName, msg.Error)
							return
						}
					}
					fmt.Printf("✅ [Startup Pre-Pull] Successfully pulled image %s\n", imageName)
				} else {
					fmt.Printf("❌ [Startup Pre-Pull] Failed to inspect image %s: %v\n", imageName, err)
				}
			} else {
				fmt.Printf("📦 [Startup Pre-Pull] Image %s is already available locally.\n", imageName)
			}
		}(img)
	}
}
