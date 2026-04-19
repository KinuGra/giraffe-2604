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
	"strings"

	pb "github.com/KinuGra/giraffe-2604/services/storage/pb"

	"google.golang.org/grpc"
)

func (s *server) validatePath(bucket, key string) (string, error) {
	bucketPath := filepath.Join(s.dataDir, bucket)
	filePath := filepath.Join(bucketPath, key)

	absPath, err := filepath.Abs(filePath)
	if err != nil {
		return "", fmt.Errorf("invalid path")
	}
	absDataDir, err := filepath.Abs(s.dataDir)
	if err != nil {
		return "", fmt.Errorf("invalid path")
	}
	absDataDir = absDataDir + string(filepath.Separator)

	if !strings.HasPrefix(absPath, absDataDir) {
		return "", fmt.Errorf("invalid path")
	}
	return filePath, nil
}

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
	absDataDir, _ := filepath.Abs(dataDir)
	if err := os.MkdirAll(absDataDir, 0755); err != nil {
		log.Printf("WARNING: failed to create data dir: %v", err)
	}
	absDataDir, _ = filepath.Abs(dataDir)
	return &server{dataDir: absDataDir}
}

func (s *server) Upload(ctx context.Context, req *pb.UploadRequest) (*pb.UploadResponse, error) {
	bucket := req.Bucket
	key := req.Key

	if bucket == "" || key == "" {
		return nil, fmt.Errorf("bucket and key are required")
	}

	filePath, err := s.validatePath(bucket, key)
	if err != nil {
		return nil, err
	}

	fileDir := filepath.Dir(filePath)
	if err := os.MkdirAll(fileDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create directory: %w", err)
	}

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

	filePath, err := s.validatePath(bucket, key)
	if err != nil {
		return nil, err
	}

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

	filePath, err := s.validatePath(bucket, key)
	if err != nil {
		return nil, err
	}

	err = os.Remove(filePath)
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

	bucketPath, err := s.validatePath(bucket, "")
	if err != nil {
		if os.IsNotExist(err) {
			return &pb.ListResponse{Objects: nil}, nil
		}
		return nil, err
	}

	var objects []*pb.ObjectSummary
	err = filepath.WalkDir(bucketPath, func(path string, d os.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if d.IsDir() {
			return nil
		}
		relPath, err := filepath.Rel(bucketPath, path)
		if err != nil {
			return nil
		}
		info, err := d.Info()
		if err != nil {
			return nil
		}
		objects = append(objects, &pb.ObjectSummary{
			Key:          relPath,
			Size:         info.Size(),
			LastModified: info.ModTime().Unix(),
		})
		return nil
	})
	if err != nil {
		if os.IsNotExist(err) {
			return &pb.ListResponse{Objects: nil}, nil
		}
		return nil, err
	}

	return &pb.ListResponse{Objects: objects}, nil
}

func (s *server) Stat(ctx context.Context, req *pb.StatRequest) (*pb.StatResponse, error) {
	bucket := req.Bucket
	key := req.Key

	filePath, err := s.validatePath(bucket, key)
	if err != nil {
		return nil, err
	}

	info, err := os.Stat(filePath)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, fmt.Errorf("not found")
		}
		return nil, err
	}

	file, err := os.Open(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to open file")
	}
	defer file.Close()

	data, err := io.ReadAll(file)
	if err != nil {
		return nil, fmt.Errorf("failed to read file")
	}

	hash := md5.Sum(data)
	etag := hex.EncodeToString(hash[:])

	return &pb.StatResponse{
		Bucket:       bucket,
		Key:          key,
		Size:         info.Size(),
		LastModified: info.ModTime().Unix(),
		Etag:         etag,
	}, nil
}
