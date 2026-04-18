package server

import (
	"context"

	pb "github.com/KinuGra/giraffe-2604/gen/functions"
	"github.com/KinuGra/giraffe-2604/services/functions/usecase"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type FunctionsServer struct {
	pb.UnimplementedFunctionsServiceServer
	uc *usecase.FunctionUsecase
}

func NewFunctionsServer(uc *usecase.FunctionUsecase) *FunctionsServer {
	return &FunctionsServer{uc: uc}
}

func (s *FunctionsServer) CreateFunction(ctx context.Context, req *pb.CreateFunctionRequest) (*pb.FunctionInfo, error) {
	f, err := s.uc.Create(req.Name, req.Runtime, req.Code, int(req.TimeoutSec))
	if err != nil {
		return nil, status.Errorf(codes.Internal, "create failed: %v", err)
	}
	return modelToProto(f), nil
}

func (s *FunctionsServer) ListFunctions(ctx context.Context, req *pb.ListFunctionsRequest) (*pb.ListFunctionsResponse, error) {
	funcs, err := s.uc.List()
	if err != nil {
		return nil, status.Errorf(codes.Internal, "list failed: %v", err)
	}
	infos := make([]*pb.FunctionInfo, len(funcs))
	for i := range funcs {
		infos[i] = modelToProto(&funcs[i])
	}
	return &pb.ListFunctionsResponse{Functions: infos}, nil
}

func (s *FunctionsServer) GetFunction(ctx context.Context, req *pb.GetFunctionRequest) (*pb.FunctionInfo, error) {
	f, err := s.uc.Get(req.FunctionId)
	if err != nil {
		return nil, status.Errorf(codes.NotFound, "not found: %v", err)
	}
	return modelToProto(f), nil
}

func (s *FunctionsServer) ExecuteFunction(ctx context.Context, req *pb.ExecuteFunctionRequest) (*pb.ExecuteFunctionResponse, error) {
	result, err := s.uc.Execute(req.FunctionId, int(req.TimeoutSec))
	if err != nil {
		return nil, status.Errorf(codes.Internal, "execute failed: %v", err)
	}
	return &pb.ExecuteFunctionResponse{
		Output:     result.Output,
		Error:      result.Error,
		ExitCode:   int32(result.ExitCode),
		DurationMs: result.DurationMs,
	}, nil
}

func (s *FunctionsServer) DeleteFunction(ctx context.Context, req *pb.DeleteFunctionRequest) (*pb.DeleteFunctionResponse, error) {
	if err := s.uc.Delete(req.FunctionId); err != nil {
		return nil, status.Errorf(codes.Internal, "delete failed: %v", err)
	}
	return &pb.DeleteFunctionResponse{Success: true}, nil
}
