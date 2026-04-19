package usecase

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"time"

	"github.com/KinuGra/giraffe-2604/services/functions/model"
	"github.com/KinuGra/giraffe-2604/services/functions/repository"
	"github.com/docker/docker/api/types/container"
	dockerimage "github.com/docker/docker/api/types/image"
	"github.com/docker/docker/client"
)

type FunctionUsecase struct {
	repo *repository.FunctionRepo
	sem  chan struct{}
}

func NewFunctionUsecase(repo *repository.FunctionRepo) *FunctionUsecase {
	return &FunctionUsecase{repo: repo, sem: make(chan struct{}, 10)}
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
