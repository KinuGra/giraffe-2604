package main

import (
	"log"
	"net"
	"os"

	"google.golang.org/grpc"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	pb "github.com/KinuGra/giraffe-2604/gen/database"
	"github.com/KinuGra/giraffe-2604/services/database/repository"
	"github.com/KinuGra/giraffe-2604/services/database/server"
	"github.com/KinuGra/giraffe-2604/services/database/usecase"
)

func main() {
	dsn := os.Getenv("DATABASE_URL")
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("DB connection failed:", err)
	}

	repo := repository.NewDatabaseRepo(db)
	uc := usecase.NewDatabaseUsecase(repo)
	srv := server.NewDatabaseServer(uc)

	lis, err := net.Listen("tcp", ":50056")
	if err != nil {
		log.Fatal("Failed to listen:", err)
	}

	grpcServer := grpc.NewServer()
	pb.RegisterDatabaseServiceServer(grpcServer, srv)

	log.Println("Database Service listening on :50056")
	if err := grpcServer.Serve(lis); err != nil {
		log.Fatal("Failed to serve:", err)
	}
}
