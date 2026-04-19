package usecase

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"sync"
	"time"

	"github.com/KinuGra/giraffe-2604/services/functions/model"
	"github.com/KinuGra/giraffe-2604/services/functions/repository"
	"github.com/docker/docker/api/types/container"
	dockerimage "github.com/docker/docker/api/types/image"
	"github.com/docker/docker/client"
)

var ErrDeactivated = errors.New("DEACTIVATED")

const (
	evolutionWindow   = 10 * time.Second
	evolutionMinCalls = 3
)

type callWindow struct {
	mu        sync.Mutex
	count     int
	scheduled bool
}

type FunctionUsecase struct {
	repo    *repository.FunctionRepo
	sem     chan struct{}
	windows sync.Map // map[functionID]*callWindow
}

func NewFunctionUsecase(repo *repository.FunctionRepo) *FunctionUsecase {
	return &FunctionUsecase{repo: repo, sem: make(chan struct{}, 10)}
}

// recordAndScheduleEvolve は実行を記録し、最初の呼び出し時に10秒後の審判をスケジュールする。
func (u *FunctionUsecase) recordAndScheduleEvolve(id string) {
	raw, _ := u.windows.LoadOrStore(id, &callWindow{})
	cw := raw.(*callWindow)

	cw.mu.Lock()
	cw.count++
	shouldSchedule := !cw.scheduled
	if shouldSchedule {
		cw.scheduled = true
	}
	cw.mu.Unlock()

	if shouldSchedule {
		time.AfterFunc(evolutionWindow, func() {
			u.evaluateEvolution(id)
		})
	}
}

func (u *FunctionUsecase) evaluateEvolution(id string) {
	raw, ok := u.windows.Load(id)
	if !ok {
		return
	}
	cw := raw.(*callWindow)

	cw.mu.Lock()
	count := cw.count
	// ウィンドウをリセットして次のサイクルに備える
	cw.count = 0
	cw.scheduled = false
	cw.mu.Unlock()

	if count <= evolutionMinCalls {
		_ = u.repo.Deactivate(id)
	}
}

func (u *FunctionUsecase) Create(name, runtime, code string, timeoutSec int) (*model.Function, error) {
	if timeoutSec <= 0 {
		timeoutSec = 30
	}
	f := &model.Function{
		Name:       name,
		Runtime:    runtime,
		Code:       code,
		TimeoutSec: timeoutSec,
	}
	if err := u.repo.Create(f); err != nil {
		return nil, err
	}
	return f, nil
}

func (u *FunctionUsecase) Get(id string) (*model.Function, error) {
	return u.repo.FindByID(id)
}

func (u *FunctionUsecase) GetByName(name string) (*model.Function, error) {
	return u.repo.FindByName(name)
}

func (u *FunctionUsecase) List() ([]model.Function, error) {
	return u.repo.FindAll()
}

func (u *FunctionUsecase) Update(id, name, code string, timeoutSec int) (*model.Function, error) {
	return u.repo.Update(id, name, code, timeoutSec)
}

func (u *FunctionUsecase) Delete(id string) error {
	return u.repo.Delete(id)
}

func (u *FunctionUsecase) ListLogs(functionID string) ([]model.ExecutionLog, error) {
	return u.repo.FindLogsByFunctionID(functionID)
}

type ExecuteOptions struct {
	TimeoutSec int
	Env        map[string]string
	Stdin      string
}

type ExecuteResult struct {
	Output     string
	Error      string
	ExitCode   int
	DurationMs int64
}

var runtimeImages = map[string]string{
	"python3.12": "python:3.12-alpine",
	"node20":     "node:20-alpine",
}

func (u *FunctionUsecase) Execute(id string, opts ExecuteOptions) (*ExecuteResult, error) {
	select {
	case u.sem <- struct{}{}:
		defer func() { <-u.sem }()
	default:
		return nil, fmt.Errorf("too many concurrent executions (max 10)")
	}

	f, err := u.repo.FindByID(id)
	if err != nil {
		return nil, fmt.Errorf("function not found: %w", err)
	}

	if f.Status == model.StatusDeactivated {
		return nil, ErrDeactivated
	}

	image, ok := runtimeImages[f.Runtime]
	if !ok {
		return nil, fmt.Errorf("unsupported runtime: %s", f.Runtime)
	}

	timeout := f.TimeoutSec
	if opts.TimeoutSec > 0 {
		timeout = opts.TimeoutSec
	}

	ctx, cancel := context.WithTimeout(context.Background(), time.Duration(timeout)*time.Second)
	defer cancel()

	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return nil, fmt.Errorf("docker client error: %w", err)
	}
	defer cli.Close()

	rc, err := cli.ImagePull(ctx, image, dockerimage.PullOptions{})
	if err != nil {
		return nil, fmt.Errorf("image pull error: %w", err)
	}
	io.Copy(io.Discard, rc)
	rc.Close()

	var cmd []string
	switch f.Runtime {
	case "python3.12":
		cmd = []string{"python3", "-c", f.Code}
	case "node20":
		cmd = []string{"node", "-e", f.Code}
	}

	var envList []string
	for k, v := range opts.Env {
		envList = append(envList, k+"="+v)
	}

	containerCfg := &container.Config{
		Image: image,
		Cmd:   cmd,
		Env:   envList,
	}
	if opts.Stdin != "" {
		containerCfg.OpenStdin = true
		containerCfg.StdinOnce = true
	}

	resp, err := cli.ContainerCreate(ctx, containerCfg, nil, nil, nil, "")
	if err != nil {
		return nil, fmt.Errorf("container create error: %w", err)
	}

	containerID := resp.ID
	defer cli.ContainerRemove(context.Background(), containerID, container.RemoveOptions{Force: true})

	if opts.Stdin != "" {
		attachResp, err := cli.ContainerAttach(ctx, containerID, container.AttachOptions{
			Stream: true,
			Stdin:  true,
		})
		if err != nil {
			return nil, fmt.Errorf("container attach error: %w", err)
		}
		go func() {
			defer attachResp.Conn.Close()
			io.WriteString(attachResp.Conn, opts.Stdin)
		}()
	}

	start := time.Now()
	if err := cli.ContainerStart(ctx, containerID, container.StartOptions{}); err != nil {
		return nil, fmt.Errorf("container start error: %w", err)
	}

	statusCh, errCh := cli.ContainerWait(ctx, containerID, container.WaitConditionNotRunning)
	var exitCode int
	select {
	case waitResp := <-statusCh:
		exitCode = int(waitResp.StatusCode)
	case err := <-errCh:
		return nil, fmt.Errorf("container wait error: %w", err)
	}

	durationMs := time.Since(start).Milliseconds()

	logs, err := cli.ContainerLogs(ctx, containerID, container.LogsOptions{
		ShowStdout: true,
		ShowStderr: true,
	})
	if err != nil {
		return nil, fmt.Errorf("container logs error: %w", err)
	}
	defer logs.Close()

	var stdout, stderr bytes.Buffer
	if err := demuxLogs(logs, &stdout, &stderr); err != nil {
		return nil, fmt.Errorf("log demux error: %w", err)
	}

	result := &ExecuteResult{
		Output:     stdout.String(),
		Error:      stderr.String(),
		ExitCode:   exitCode,
		DurationMs: durationMs,
	}

	_ = u.repo.CreateLog(&model.ExecutionLog{
		FunctionID: id,
		Output:     result.Output,
		Error:      result.Error,
		ExitCode:   exitCode,
		DurationMs: durationMs,
	})

	// 進化論：最初の呼び出しから10秒後に審判。その間3回以下なら消滅
	u.recordAndScheduleEvolve(id)

	return result, nil
}

// Docker multiplexed stream header: 8 bytes per frame (1 stream type + 3 padding + 4 size)
func demuxLogs(r io.Reader, stdout, stderr *bytes.Buffer) error {
	hdr := make([]byte, 8)
	for {
		_, err := io.ReadFull(r, hdr)
		if err == io.EOF || err == io.ErrUnexpectedEOF {
			return nil
		}
		if err != nil {
			return err
		}
		size := int(hdr[4])<<24 | int(hdr[5])<<16 | int(hdr[6])<<8 | int(hdr[7])
		if size == 0 {
			continue
		}
		buf := make([]byte, size)
		if _, err := io.ReadFull(r, buf); err != nil {
			return err
		}
		switch hdr[0] {
		case 1:
			stdout.Write(buf)
		case 2:
			stderr.Write(buf)
		}
	}
}
