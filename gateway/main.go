package main

import (
	"log"
	"os"

	"github.com/KinuGra/giraffe-2604/services/gateway/proto/storage/pb"

	"github.com/gin-gonic/gin"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

var storageClient pb.StorageServiceClient

func main() {
	storageAddr := os.Getenv("STORAGE_ADDR")
	if storageAddr == "" {
		storageAddr = "localhost:50054"
	}

	conn, err := grpc.NewClient(storageAddr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Fatalf("failed to connect to storage service: %v", err)
	}
	defer conn.Close()

	storageClient = pb.NewStorageServiceClient(conn)

	r := gin.Default()

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	RegisterStorageRoutes(r)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Gateway listening on :%s", port)
	r.Run(":" + port)
}
