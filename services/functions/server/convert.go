package server

import (
	pb "github.com/KinuGra/giraffe-2604/gen/functions"
	"github.com/KinuGra/giraffe-2604/services/functions/model"
)

func modelToProto(f *model.Function) *pb.FunctionInfo {
	return &pb.FunctionInfo{
		Id:         f.ID,
		Name:       f.Name,
		Runtime:    f.Runtime,
		Code:       f.Code,
		TimeoutSec: int32(f.TimeoutSec),
		CreatedAt:  f.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		Status:     f.Status,
	}
}

func logToProto(l *model.ExecutionLog) *pb.ExecutionLogInfo {
	return &pb.ExecutionLogInfo{
		Id:         l.ID,
		FunctionId: l.FunctionID,
		Output:     l.Output,
		Error:      l.Error,
		ExitCode:   int32(l.ExitCode),
		DurationMs: l.DurationMs,
		CreatedAt:  l.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
}
