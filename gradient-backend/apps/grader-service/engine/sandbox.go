// apps/grader-service/engine/sandbox.go
package engine

import (
	"bytes"
	"context"
	"fmt"
	"time"

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

	// 2. สร้าง shell command (write → compile → run)
	var combinedCmd string
	if cfg.Stdin != "" {
		combinedCmd = fmt.Sprintf(
			"printf '%%s' %q > %s && %s && printf '%%s' %q | %s",
			sourceCode, filename, cfg.CompileCmd, cfg.Stdin, cfg.RunCmd,
		)
	} else {
		combinedCmd = fmt.Sprintf(
			"printf '%%s' %q > %s && %s && %s",
			sourceCode, filename, cfg.CompileCmd, cfg.RunCmd,
		)
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
