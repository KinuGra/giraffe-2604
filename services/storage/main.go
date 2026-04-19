package main

import (
	"context"
	"crypto/md5"
	"encoding/hex"
	"fmt"
	"io"
	"log"
	"net"
	"os"
	"path/filepath"

	pb "github.com/KinuGra/giraffe-2604/services/storage/pb"

	"google.golang.org/grpc"
)

func main() {
	port := os.Getenv("GRPC_PORT")
	if port == "" {
		port = "50054"
	}

	lis, err := net.Listen("tcp", ":"+port)
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}

	grpcServer := grpc.NewServer()
	pb.RegisterStorageServiceServer(grpcServer, newServer())

	log.Printf("gRPC Storage service listening on :%s", port)
	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
}

type server struct {
	pb.UnimplementedStorageServiceServer
	dataDir string
}

func newServer() *server {
	dataDir := os.Getenv("STORAGE_DATA_DIR")
	if dataDir == "" {
		dataDir = "./data"
	}
	os.MkdirAll(dataDir, 0755)
	return &server{dataDir: dataDir}
}

func (s *server) Upload(ctx context.Context, req *pb.UploadRequest) (*pb.UploadResponse, error) {
	bucket := req.Bucket
	key := req.Key

	if bucket == "" || key == "" {
		return nil, fmt.Errorf("bucket and key are required")
	}

	bucketPath := filepath.Join(s.dataDir, bucket)
	os.MkdirAll(bucketPath, 0755)

	filePath := filepath.Join(bucketPath, key)
	fileDir := filepath.Dir(filePath)
	os.MkdirAll(fileDir, 0755)

	file, err := os.Create(filePath)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	_, err = file.Write(req.Content)
	if err != nil {
		return nil, err
	}

	hash := md5.Sum(req.Content)
	etag := hex.EncodeToString(hash[:])

	return &pb.UploadResponse{
		Bucket: bucket,
		Key:    key,
		Etag:   etag,
	}, nil
}

func (s *server) Download(ctx context.Context, req *pb.DownloadRequest) (*pb.DownloadResponse, error) {
	bucket := req.Bucket
	key := req.Key

	filePath := filepath.Join(s.dataDir, bucket, key)
	data, err := os.ReadFile(filePath)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, fmt.Errorf("not found")
		}
		return nil, err
	}

	info, err := os.Stat(filePath)
	if err != nil {
		return nil, err
	}

	hash := md5.Sum(data)
	etag := hex.EncodeToString(hash[:])

	return &pb.DownloadResponse{
		Content:      data,
		Bucket:       bucket,
		Key:          key,
		Size:         info.Size(),
		Etag:         etag,
		LastModified: info.ModTime().Unix(),
	}, nil
}

func (s *server) Delete(ctx context.Context, req *pb.DeleteRequest) (*pb.DeleteResponse, error) {
	bucket := req.Bucket
	key := req.Key

	filePath := filepath.Join(s.dataDir, bucket, key)
	err := os.Remove(filePath)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, fmt.Errorf("not found")
		}
		return nil, err
	}

	return &pb.DeleteResponse{Success: true}, nil
}

func (s *server) List(ctx context.Context, req *pb.ListRequest) (*pb.ListResponse, error) {
	bucket := req.Bucket

	bucketPath := filepath.Join(s.dataDir, bucket)
	entries, err := os.ReadDir(bucketPath)
	if err != nil {
		if os.IsNotExist(err) {
			return &pb.ListResponse{Objects: nil}, nil
		}
		return nil, err
	}

	var objects []*pb.ObjectSummary
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		info, _ := entry.Info()
		objects = append(objects, &pb.ObjectSummary{
			Key:          info.Name(),
			Size:         info.Size(),
			LastModified: info.ModTime().Unix(),
		})
	}

	return &pb.ListResponse{Objects: objects}, nil
}

func (s *server) Stat(ctx context.Context, req *pb.StatRequest) (*pb.StatResponse, error) {
	bucket := req.Bucket
	key := req.Key

	filePath := filepath.Join(s.dataDir, bucket, key)
	info, err := os.Stat(filePath)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, fmt.Errorf("not found")
		}
		return nil, err
	}

	hash := md5.Sum(nil)
	file, _ := os.Open(filePath)
	if file != nil {
		data, _ := io.ReadAll(file)
		hash = md5.Sum(data)
		file.Close()
	}
	etag := hex.EncodeToString(hash[:])

	return &pb.StatResponse{
		Bucket:       bucket,
		Key:          key,
		Size:         info.Size(),
		LastModified: info.ModTime().Unix(),
		Etag:         etag,
	}, nil
}
