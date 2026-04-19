package server

import (
	"context"

	pb "github.com/KinuGra/giraffe-2604/gen/database"
	"github.com/KinuGra/giraffe-2604/services/database/model"
	"github.com/KinuGra/giraffe-2604/services/database/usecase"
)

type DatabaseServer struct {
	pb.UnimplementedDatabaseServiceServer
	uc *usecase.DatabaseUsecase
}

func NewDatabaseServer(uc *usecase.DatabaseUsecase) *DatabaseServer {
	return &DatabaseServer{uc: uc}
}

func (s *DatabaseServer) ListTables(ctx context.Context, req *pb.ListTablesRequest) (*pb.ListTablesResponse, error) {
	tables, err := s.uc.ListTables(ctx, req.Schema)
	if err != nil {
		return nil, err
	}

	pbTables := make([]*pb.TableInfo, 0, len(tables))
	for i := range tables {
		pbTables = append(pbTables, tableInfoToProto(&tables[i]))
	}
	return &pb.ListTablesResponse{Tables: pbTables}, nil
}

func (s *DatabaseServer) CreateTable(ctx context.Context, req *pb.CreateTableRequest) (*pb.CreateTableResponse, error) {
	columns := make([]model.ColumnInfo, 0, len(req.Columns))
	for _, c := range req.Columns {
		columns = append(columns, protoToColumnInfo(c))
	}

	table, err := s.uc.CreateTable(ctx, req.Schema, req.Name, columns)
	if err != nil {
		return nil, err
	}
	return &pb.CreateTableResponse{Table: tableInfoToProto(table)}, nil
}

func (s *DatabaseServer) DeleteTable(ctx context.Context, req *pb.DeleteTableRequest) (*pb.DeleteTableResponse, error) {
	if err := s.uc.DeleteTable(ctx, req.Schema, req.Name); err != nil {
		return nil, err
	}
	return &pb.DeleteTableResponse{}, nil
}

func (s *DatabaseServer) ListColumns(ctx context.Context, req *pb.ListColumnsRequest) (*pb.ListColumnsResponse, error) {
	columns, err := s.uc.ListColumns(ctx, req.Schema, req.Table)
	if err != nil {
		return nil, err
	}

	pbColumns := make([]*pb.ColumnDef, 0, len(columns))
	for i := range columns {
		pbColumns = append(pbColumns, columnInfoToProto(&columns[i]))
	}
	return &pb.ListColumnsResponse{Columns: pbColumns}, nil
}

func (s *DatabaseServer) AddColumn(ctx context.Context, req *pb.AddColumnRequest) (*pb.AddColumnResponse, error) {
	col := protoToColumnInfo(req.Column)
	result, err := s.uc.AddColumn(ctx, req.Schema, req.Table, col)
	if err != nil {
		return nil, err
	}
	return &pb.AddColumnResponse{Column: columnInfoToProto(result)}, nil
}

func (s *DatabaseServer) UpdateColumn(ctx context.Context, req *pb.UpdateColumnRequest) (*pb.UpdateColumnResponse, error) {
	finalName, err := s.uc.UpdateColumn(ctx, req.Schema, req.Table, req.ColumnName, req.NewName, req.NewType, req.NewDefault, req.SetNullable, req.Nullable)
	if err != nil {
		return nil, err
	}
	return &pb.UpdateColumnResponse{
		Column: &pb.ColumnDef{Name: finalName},
	}, nil
}

func (s *DatabaseServer) DeleteColumn(ctx context.Context, req *pb.DeleteColumnRequest) (*pb.DeleteColumnResponse, error) {
	if err := s.uc.DeleteColumn(ctx, req.Schema, req.Table, req.ColumnName); err != nil {
		return nil, err
	}
	return &pb.DeleteColumnResponse{}, nil
}

func (s *DatabaseServer) GetRows(ctx context.Context, req *pb.GetRowsRequest) (*pb.GetRowsResponse, error) {
	rows, totalCount, err := s.uc.GetRows(ctx, req.Schema, req.Table, req.Limit, req.Offset, req.OrderBy)
	if err != nil {
		return nil, err
	}
	return &pb.GetRowsResponse{Rows: rows, TotalCount: totalCount}, nil
}

func (s *DatabaseServer) InsertRow(ctx context.Context, req *pb.InsertRowRequest) (*pb.InsertRowResponse, error) {
	row, err := s.uc.InsertRow(ctx, req.Schema, req.Table, req.Values)
	if err != nil {
		return nil, err
	}
	return &pb.InsertRowResponse{Row: row}, nil
}

func (s *DatabaseServer) UpdateRow(ctx context.Context, req *pb.UpdateRowRequest) (*pb.UpdateRowResponse, error) {
	row, err := s.uc.UpdateRow(ctx, req.Schema, req.Table, req.Pk, req.Values)
	if err != nil {
		return nil, err
	}
	return &pb.UpdateRowResponse{Row: row}, nil
}

func (s *DatabaseServer) DeleteRow(ctx context.Context, req *pb.DeleteRowRequest) (*pb.DeleteRowResponse, error) {
	affected, err := s.uc.DeleteRow(ctx, req.Schema, req.Table, req.Pk)
	if err != nil {
		return nil, err
	}
	return &pb.DeleteRowResponse{AffectedRows: affected}, nil
}

func (s *DatabaseServer) ExecuteSQL(ctx context.Context, req *pb.ExecuteSQLRequest) (*pb.ExecuteSQLResponse, error) {
	rows, affected, elapsed, err := s.uc.ExecuteSQL(ctx, req.Query)
	if err != nil {
		return nil, err
	}
	return &pb.ExecuteSQLResponse{
		Rows:            rows,
		AffectedRows:    affected,
		ExecutionTimeMs: elapsed,
	}, nil
}
