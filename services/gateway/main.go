package main

import (
	"context"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"

	pb "github.com/KinuGra/giraffe-2604/gen/functions"
)

func cors() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type")
		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	}
}

func main() {
	addr := os.Getenv("FUNCTIONS_GRPC_ADDR")
	if addr == "" {
		addr = "localhost:50055"
	}

	conn, err := grpc.NewClient(addr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Fatal("gRPC connect failed:", err)
	}
	defer conn.Close()

	fn := pb.NewFunctionsServiceClient(conn)

	r := gin.Default()
	r.Use(cors())

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	r.GET("/functions", func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
		defer cancel()
		resp, err := fn.ListFunctions(ctx, &pb.ListFunctionsRequest{})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, resp)
	})

	r.POST("/functions", func(c *gin.Context) {
		var req pb.CreateFunctionRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
		defer cancel()
		resp, err := fn.CreateFunction(ctx, &req)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, resp)
	})

	r.GET("/functions/:id", func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
		defer cancel()
		resp, err := fn.GetFunction(ctx, &pb.GetFunctionRequest{FunctionId: c.Param("id")})
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, resp)
	})

	r.POST("/functions/:id/execute", func(c *gin.Context) {
		var body struct {
			TimeoutSec int32             `json:"timeout_sec"`
			Env        map[string]string `json:"env"`
			Stdin      string            `json:"stdin"`
		}
		_ = c.ShouldBindJSON(&body)
		ctx, cancel := context.WithTimeout(c.Request.Context(), 60*time.Second)
		defer cancel()
		resp, err := fn.ExecuteFunction(ctx, &pb.ExecuteFunctionRequest{
			FunctionId: c.Param("id"),
			TimeoutSec: body.TimeoutSec,
			Env:        body.Env,
			Stdin:      body.Stdin,
		})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, resp)
	})

	r.GET("/functions/:id/logs", func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
		defer cancel()
		resp, err := fn.ListLogs(ctx, &pb.ListLogsRequest{FunctionId: c.Param("id")})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, resp)
	})

	// HTTP trigger: POST /functions/v1/:name
	// Executes a function by name; body is passed as stdin
	r.POST("/functions/v1/:name", func(c *gin.Context) {
		bodyBytes, _ := io.ReadAll(c.Request.Body)
		var env map[string]string
		// Allow env vars via X-Env-* headers
		env = make(map[string]string)
		for k, v := range c.Request.Header {
			if len(k) > 6 && k[:6] == "X-Env-" {
				env[k[6:]] = v[0]
			}
		}
		fnResp, err := fn.GetFunctionByName(c.Request.Context(), &pb.GetFunctionByNameRequest{Name: c.Param("name")})
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "function not found"})
			return
		}
		ctx, cancel := context.WithTimeout(c.Request.Context(), 60*time.Second)
		defer cancel()
		resp, err := fn.ExecuteFunction(ctx, &pb.ExecuteFunctionRequest{
			FunctionId: fnResp.Id,
			Env:        env,
			Stdin:      string(bodyBytes),
		})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, resp)
	})

	r.PATCH("/functions/:id", func(c *gin.Context) {
		var req pb.UpdateFunctionRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		req.FunctionId = c.Param("id")
		ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
		defer cancel()
		resp, err := fn.UpdateFunction(ctx, &req)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, resp)
	})

	r.DELETE("/functions/:id", func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
		defer cancel()
		resp, err := fn.DeleteFunction(ctx, &pb.DeleteFunctionRequest{FunctionId: c.Param("id")})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, resp)
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("Gateway listening on :%s", port)
	r.Run(":" + port)
}
