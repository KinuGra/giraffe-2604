package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"

	pb "github.com/KinuGra/giraffe-2604/gen/database"
	"github.com/KinuGra/giraffe-2604/services/gateway/routes"
)

func main() {
	r := gin.Default()

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	dbAddr := os.Getenv("DATABASE_GRPC_ADDR")
	if dbAddr != "" {
		conn, err := grpc.NewClient(dbAddr, grpc.WithTransportCredentials(insecure.NewCredentials()))
		if err != nil {
			log.Printf("WARNING: Cannot connect to database service: %v", err)
		} else {
			dbClient := pb.NewDatabaseServiceClient(conn)
			routes.RegisterDatabaseRoutes(r, dbClient)
			log.Printf("Database routes registered (connecting to %s)", dbAddr)
		}
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Gateway listening on :%s", port)
	r.Run(":" + port)
}
