package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()

	// ヘルスチェック
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// TODO: 各自が routes/ から追加
	// routes.RegisterAuthRoutes(r)
	// routes.RegisterFunctionsRoutes(r)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Gateway listening on :%s", port)
	r.Run(":" + port)
}
