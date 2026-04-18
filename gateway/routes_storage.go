package main

import (
	"fmt"
	"io"
	"net/http"

	"github.com/KinuGra/giraffe-2604/services/gateway/proto/storage/pb"

	"github.com/gin-gonic/gin"
)

func RegisterStorageRoutes(r *gin.Engine) {
	sg := r.Group("/storage")
	{
		sg.PUT("/upload/:bucket/:key", handleUpload)
		sg.GET("/download/:bucket/:key", handleDownload)
		sg.DELETE("/delete/:bucket/:key", handleDelete)
		sg.GET("/list/:bucket", handleList)
		sg.HEAD("/stat/:bucket/:key", handleStat)
	}
}

func handleUpload(c *gin.Context) {
	bucket := c.Param("bucket")
	key := c.Param("key")

	if bucket == "" || key == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bucket and key are required"})
		return
	}

	content, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "failed to read body"})
		return
	}

	req := &pb.UploadRequest{
		Bucket:  bucket,
		Key:     key,
		Content: content,
	}

	resp, err := storageClient.Upload(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"bucket":  resp.Bucket,
		"key":     resp.Key,
		"etag":    resp.Etag,
		"message": "uploaded successfully",
	})
}

func handleDownload(c *gin.Context) {
	bucket := c.Param("bucket")
	key := c.Param("key")

	req := &pb.DownloadRequest{
		Bucket: bucket,
		Key:    key,
	}

	resp, err := storageClient.Download(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}

	c.Header("Content-Type", "application/octet-stream")
	c.Header("ETag", resp.Etag)
	c.Data(http.StatusOK, "application/octet-stream", resp.Content)
}

func handleDelete(c *gin.Context) {
	bucket := c.Param("bucket")
	key := c.Param("key")

	req := &pb.DeleteRequest{
		Bucket: bucket,
		Key:    key,
	}

	_, err := storageClient.Delete(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

func handleList(c *gin.Context) {
	bucket := c.Param("bucket")

	req := &pb.ListRequest{
		Bucket: bucket,
	}

	resp, err := storageClient.List(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var objects []map[string]interface{}
	for _, obj := range resp.Objects {
		objects = append(objects, map[string]interface{}{
			"key":          obj.Key,
			"size":         obj.Size,
			"lastModified": obj.LastModified,
		})
	}

	c.JSON(http.StatusOK, gin.H{"objects": objects})
}

func handleStat(c *gin.Context) {
	bucket := c.Param("bucket")
	key := c.Param("key")

	req := &pb.StatRequest{
		Bucket: bucket,
		Key:    key,
	}

	resp, err := storageClient.Stat(c.Request.Context(), req)
	if err != nil {
		if grpcErr := err.Error(); grpcErr == "not found" || fmt.Sprintf("%v", err) == "not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Header("ETag", resp.Etag)
	c.Header("Content-Length", fmt.Sprintf("%d", resp.Size))
	c.JSON(http.StatusOK, gin.H{
		"bucket":       resp.Bucket,
		"key":          resp.Key,
		"size":         resp.Size,
		"lastModified": resp.LastModified,
	})
}
