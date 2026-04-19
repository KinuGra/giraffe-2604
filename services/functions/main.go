package main

import (
	"log"
	"net"
	"os"

	"google.golang.org/grpc"
	"google.golang.org/grpc/health"
	"google.golang.org/grpc/health/grpc_health_v1"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	pb "github.com/KinuGra/giraffe-2604/gen/functions"
	"github.com/KinuGra/giraffe-2604/services/functions/model"
	"github.com/KinuGra/giraffe-2604/services/functions/repository"
	"github.com/KinuGra/giraffe-2604/services/functions/server"
	"github.com/KinuGra/giraffe-2604/services/functions/usecase"
)

func main() {
	dsn := os.Getenv("DATABASE_URL")
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("DB connection failed:", err)
	}

	if err := db.AutoMigrate(&model.Function{}, &model.ExecutionLog{}); err != nil {
		log.Fatal("AutoMigrate failed:", err)
	}

	repo := repository.NewFunctionRepo(db)
	uc := usecase.NewFunctionUsecase(repo)
	srv := server.NewFunctionsServer(uc)

	lis, err := net.Listen("tcp", ":50055")
	if err != nil {
		log.Fatal("Failed to listen:", err)
	}

	grpcServer := grpc.NewServer()
	pb.RegisterFunctionsServiceServer(grpcServer, srv)

	healthSrv := health.NewServer()
	grpc_health_v1.RegisterHealthServer(grpcServer, healthSrv)

	log.Println("Functions Service listening on :50055")
	grpcServer.Serve(lis)
}
