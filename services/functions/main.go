package main

import (
	"log"
	"net"
	"os"

	"google.golang.org/grpc"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	// DB接続 + AutoMigrate
	dsn := os.Getenv("DATABASE_URL")
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("DB connection failed:", err)
	}
	_ = db // TODO: AutoMigrate & DI

	// gRPC サーバー起動
	lis, err := net.Listen("tcp", ":50055")
	if err != nil {
		log.Fatal("Failed to listen:", err)
	}

	grpcServer := grpc.NewServer()
	// TODO: pb.RegisterFunctionsServiceServer(grpcServer, srv)

	log.Println("Functions Service listening on :50055")
	grpcServer.Serve(lis)
}

