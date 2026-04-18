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
	}
}
