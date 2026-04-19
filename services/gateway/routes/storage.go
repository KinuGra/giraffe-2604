package routes

import (
	"io"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	pb "github.com/KinuGra/giraffe-2604/services/storage/pb"
)

func RegisterStorageRoutes(r *gin.Engine, client pb.StorageServiceClient) {
	g := r.Group("/storage/v1")
	{
		g.POST("/upload", uploadFile(client))
		g.GET("/download/:bucket/*key", downloadFile(client))
		g.DELETE("/objects/:bucket/*key", deleteObject(client))
		g.GET("/objects/:bucket", listObjects(client))
		g.GET("/stat/:bucket/*key", statObject(client))
	}
}

const maxUploadSize = 10 << 20 // 10MB

func uploadFile(client pb.StorageServiceClient) gin.HandlerFunc {
	return func(c *gin.Context) {
		bucket := c.PostForm("bucket")
		key := c.PostForm("key")

		file, _, err := c.Request.FormFile("content")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "file is required"})
			return
		}
		defer file.Close()

		content := make([]byte, maxUploadSize)
		n, err := io.ReadFull(file, content)
		if err == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "file too large (max 10MB)"})
			return
		}
		if err != io.EOF && err != io.ErrUnexpectedEOF {
			c.JSON(http.StatusBadRequest, gin.H{"error": "cannot read file"})
			return
		}
		content = content[:n]

		resp, err := client.Upload(c.Request.Context(), &pb.UploadRequest{
			Bucket:  bucket,
			Key:     key,
			Content: content,
		})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"bucket": resp.Bucket,
			"key":    resp.Key,
			"etag":   resp.Etag,
		})
	}
}

func downloadFile(client pb.StorageServiceClient) gin.HandlerFunc {
	return func(c *gin.Context) {
		bucket := c.Param("bucket")
		key := c.Param("key")

		resp, err := client.Download(c.Request.Context(), &pb.DownloadRequest{
			Bucket: bucket,
			Key:    key,
		})
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}

		c.Header("Content-Type", "application/octet-stream")
		c.Header("X-Bucket", resp.Bucket)
		c.Header("X-Key", resp.Key)
		c.Header("X-Size", strconv.FormatInt(resp.Size, 10))
		c.Header("X-Etag", resp.Etag)
		c.Header("X-Last-Modified", strconv.FormatInt(resp.LastModified, 10))

		c.Data(http.StatusOK, "application/octet-stream", resp.Content)
	}
}

func deleteObject(client pb.StorageServiceClient) gin.HandlerFunc {
	return func(c *gin.Context) {
		bucket := c.Param("bucket")
		key := c.Param("key")

		_, err := client.Delete(c.Request.Context(), &pb.DeleteRequest{
			Bucket: bucket,
			Key:    key,
		})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.Status(http.StatusNoContent)
	}
}

func listObjects(client pb.StorageServiceClient) gin.HandlerFunc {
	return func(c *gin.Context) {
		bucket := c.Param("bucket")

		resp, err := client.List(c.Request.Context(), &pb.ListRequest{
			Bucket: bucket,
		})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		objects := make([]gin.H, 0, len(resp.Objects))
		for _, o := range resp.Objects {
			objects = append(objects, gin.H{
				"key":          o.Key,
				"size":         o.Size,
				"lastModified": o.LastModified,
			})
		}
		c.JSON(http.StatusOK, gin.H{"objects": objects})
	}
}

func statObject(client pb.StorageServiceClient) gin.HandlerFunc {
	return func(c *gin.Context) {
		bucket := c.Param("bucket")
		key := c.Param("key")

		resp, err := client.Stat(c.Request.Context(), &pb.StatRequest{
			Bucket: bucket,
			Key:    key,
		})
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"bucket":       resp.Bucket,
			"key":          resp.Key,
			"size":         resp.Size,
			"lastModified": resp.LastModified,
			"etag":         resp.Etag,
		})
	}
}
