package main

import (
	"context"
	"encoding/json"
	"fmt"
	"regexp"
	"strings"
	"time"

	"gorm.io/gorm"

	pb "github.com/KinuGra/giraffe-2604/services/database/proto/database"
)

var identRegex = regexp.MustCompile(`^[a-zA-Z_][a-zA-Z0-9_]*$`)

type Server struct {
	pb.UnimplementedDatabaseServiceServer
	db *gorm.DB
}

func NewServer(db *gorm.DB) *Server {
	return &Server{db: db}
}

func quoteIdent(name string) (string, error) {
	if !identRegex.MatchString(name) {
		return "", fmt.Errorf("invalid identifier: %s", name)
	}
	return `"` + name + `"`, nil
}

func (s *Server) ListTables(ctx context.Context, req *pb.ListTablesRequest) (*pb.ListTablesResponse, error) {
	schema := req.Schema
	if schema == "" {
		schema = "public"
	}

	type tableRow struct {
		TableName string
		RowCount  int64
		RLS       bool
	}

	var rows []tableRow
	err := s.db.WithContext(ctx).Raw(`
		SELECT
			t.tablename AS table_name,
			COALESCE(c.reltuples, 0)::bigint AS row_count,
			t.rowsecurity AS rls
		FROM pg_tables t
		LEFT JOIN pg_class c ON c.relname = t.tablename
		LEFT JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = t.schemaname
		WHERE t.schemaname = ?
		ORDER BY t.tablename
	`, schema).Scan(&rows).Error
	if err != nil {
		return nil, fmt.Errorf("failed to list tables: %w", err)
	}

	tables := make([]*pb.TableInfo, 0, len(rows))
	for _, r := range rows {
		tables = append(tables, &pb.TableInfo{
			Name:     r.TableName,
			Schema:   schema,
			Rls:      r.RLS,
			RowCount: r.RowCount,
		})
	}

	return &pb.ListTablesResponse{Tables: tables}, nil
}

func (s *Server) CreateTable(ctx context.Context, req *pb.CreateTableRequest) (*pb.CreateTableResponse, error) {
	schema := req.Schema
	if schema == "" {
		schema = "public"
	}

	quotedSchema, err := quoteIdent(schema)
	if err != nil {
		return nil, err
	}
	quotedTable, err := quoteIdent(req.Name)
	if err != nil {
		return nil, err
	}

	var colDefs []string
	var constraints []string

	for _, col := range req.Columns {
		quotedCol, err := quoteIdent(col.Name)
		if err != nil {
			return nil, err
		}

		def := quotedCol + " " + col.Type
		if col.DefaultValue != "" {
			def += " DEFAULT " + col.DefaultValue
		}
		if !col.Nullable {
			def += " NOT NULL"
		}
		if col.IsUnique {
			def += " UNIQUE"
		}
		colDefs = append(colDefs, def)

		if col.IsPrimaryKey {
			constraints = append(constraints, fmt.Sprintf("PRIMARY KEY (%s)", quotedCol))
		}
	}

	allDefs := append(colDefs, constraints...)
	sql := fmt.Sprintf("CREATE TABLE %s.%s (\n  %s\n)", quotedSchema, quotedTable, strings.Join(allDefs, ",\n  "))

	if err := s.db.WithContext(ctx).Exec(sql).Error; err != nil {
		return nil, fmt.Errorf("failed to create table: %w", err)
	}

	return &pb.CreateTableResponse{
		Table: &pb.TableInfo{
			Name:     req.Name,
			Schema:   schema,
			Rls:      false,
			RowCount: 0,
		},
	}, nil
}

func (s *Server) DeleteTable(ctx context.Context, req *pb.DeleteTableRequest) (*pb.DeleteTableResponse, error) {
	schema := req.Schema
	if schema == "" {
		schema = "public"
	}

	quotedSchema, err := quoteIdent(schema)
	if err != nil {
		return nil, err
	}
	quotedTable, err := quoteIdent(req.Name)
	if err != nil {
		return nil, err
	}

	sql := fmt.Sprintf("DROP TABLE %s.%s", quotedSchema, quotedTable)
	if err := s.db.WithContext(ctx).Exec(sql).Error; err != nil {
		return nil, fmt.Errorf("failed to delete table: %w", err)
	}

	return &pb.DeleteTableResponse{}, nil
}

func (s *Server) ListColumns(ctx context.Context, req *pb.ListColumnsRequest) (*pb.ListColumnsResponse, error) {
	schema := req.Schema
	if schema == "" {
		schema = "public"
	}

	type colRow struct {
		ColumnName   string
		UdtName      string
		ColumnDefault *string
		IsNullable   string
		IsPrimaryKey bool
		IsUnique     bool
	}

	var rows []colRow
	err := s.db.WithContext(ctx).Raw(`
		SELECT
			c.column_name,
			c.udt_name,
			c.column_default,
			c.is_nullable,
			COALESCE((
				SELECT true FROM information_schema.table_constraints tc
				JOIN information_schema.key_column_usage kcu
					ON tc.constraint_name = kcu.constraint_name
					AND tc.table_schema = kcu.table_schema
				WHERE tc.constraint_type = 'PRIMARY KEY'
					AND tc.table_schema = c.table_schema
					AND tc.table_name = c.table_name
					AND kcu.column_name = c.column_name
				LIMIT 1
			), false) AS is_primary_key,
			COALESCE((
				SELECT true FROM information_schema.table_constraints tc
				JOIN information_schema.key_column_usage kcu
					ON tc.constraint_name = kcu.constraint_name
					AND tc.table_schema = kcu.table_schema
				WHERE tc.constraint_type = 'UNIQUE'
					AND tc.table_schema = c.table_schema
					AND tc.table_name = c.table_name
					AND kcu.column_name = c.column_name
				LIMIT 1
			), false) AS is_unique
		FROM information_schema.columns c
		WHERE c.table_schema = ? AND c.table_name = ?
		ORDER BY c.ordinal_position
	`, schema, req.Table).Scan(&rows).Error
	if err != nil {
		return nil, fmt.Errorf("failed to list columns: %w", err)
	}

	columns := make([]*pb.ColumnDef, 0, len(rows))
	for _, r := range rows {
		defaultVal := ""
		if r.ColumnDefault != nil {
			defaultVal = *r.ColumnDefault
		}
		columns = append(columns, &pb.ColumnDef{
			Name:         r.ColumnName,
			Type:         r.UdtName,
			DefaultValue: defaultVal,
			Nullable:     r.IsNullable == "YES",
			IsPrimaryKey: r.IsPrimaryKey,
			IsUnique:     r.IsUnique,
		})
	}

	return &pb.ListColumnsResponse{Columns: columns}, nil
}

func (s *Server) AddColumn(ctx context.Context, req *pb.AddColumnRequest) (*pb.AddColumnResponse, error) {
	schema := req.Schema
	if schema == "" {
		schema = "public"
	}

	quotedSchema, err := quoteIdent(schema)
	if err != nil {
		return nil, err
	}
	quotedTable, err := quoteIdent(req.Table)
	if err != nil {
		return nil, err
	}
	quotedCol, err := quoteIdent(req.Column.Name)
	if err != nil {
		return nil, err
	}

	sql := fmt.Sprintf("ALTER TABLE %s.%s ADD COLUMN %s %s", quotedSchema, quotedTable, quotedCol, req.Column.Type)
	if req.Column.DefaultValue != "" {
		sql += " DEFAULT " + req.Column.DefaultValue
	}
	if !req.Column.Nullable {
		sql += " NOT NULL"
	}
	if req.Column.IsUnique {
		sql += " UNIQUE"
	}

	if err := s.db.WithContext(ctx).Exec(sql).Error; err != nil {
		return nil, fmt.Errorf("failed to add column: %w", err)
	}

	return &pb.AddColumnResponse{Column: req.Column}, nil
}

func (s *Server) UpdateColumn(ctx context.Context, req *pb.UpdateColumnRequest) (*pb.UpdateColumnResponse, error) {
	schema := req.Schema
	if schema == "" {
		schema = "public"
	}

	quotedSchema, err := quoteIdent(schema)
	if err != nil {
		return nil, err
	}
	quotedTable, err := quoteIdent(req.Table)
	if err != nil {
		return nil, err
	}
	quotedCol, err := quoteIdent(req.ColumnName)
	if err != nil {
		return nil, err
	}

	tableRef := fmt.Sprintf("%s.%s", quotedSchema, quotedTable)

	if req.NewType != "" {
		sql := fmt.Sprintf("ALTER TABLE %s ALTER COLUMN %s TYPE %s", tableRef, quotedCol, req.NewType)
		if err := s.db.WithContext(ctx).Exec(sql).Error; err != nil {
			return nil, fmt.Errorf("failed to change column type: %w", err)
		}
	}

	if req.NewDefault != "" {
		var sql string
		if req.NewDefault == "__DROP__" {
			sql = fmt.Sprintf("ALTER TABLE %s ALTER COLUMN %s DROP DEFAULT", tableRef, quotedCol)
		} else {
			sql = fmt.Sprintf("ALTER TABLE %s ALTER COLUMN %s SET DEFAULT %s", tableRef, quotedCol, req.NewDefault)
		}
		if err := s.db.WithContext(ctx).Exec(sql).Error; err != nil {
			return nil, fmt.Errorf("failed to change column default: %w", err)
		}
	}

	if req.SetNullable {
		var sql string
		if req.Nullable {
			sql = fmt.Sprintf("ALTER TABLE %s ALTER COLUMN %s DROP NOT NULL", tableRef, quotedCol)
		} else {
			sql = fmt.Sprintf("ALTER TABLE %s ALTER COLUMN %s SET NOT NULL", tableRef, quotedCol)
		}
		if err := s.db.WithContext(ctx).Exec(sql).Error; err != nil {
			return nil, fmt.Errorf("failed to change column nullable: %w", err)
		}
	}

	if req.NewName != "" && req.NewName != req.ColumnName {
		quotedNewCol, err := quoteIdent(req.NewName)
		if err != nil {
			return nil, err
		}
		sql := fmt.Sprintf("ALTER TABLE %s RENAME COLUMN %s TO %s", tableRef, quotedCol, quotedNewCol)
		if err := s.db.WithContext(ctx).Exec(sql).Error; err != nil {
			return nil, fmt.Errorf("failed to rename column: %w", err)
		}
	}

	colName := req.ColumnName
	if req.NewName != "" {
		colName = req.NewName
	}

	return &pb.UpdateColumnResponse{
		Column: &pb.ColumnDef{
			Name: colName,
		},
	}, nil
}

func (s *Server) DeleteColumn(ctx context.Context, req *pb.DeleteColumnRequest) (*pb.DeleteColumnResponse, error) {
	schema := req.Schema
	if schema == "" {
		schema = "public"
	}

	quotedSchema, err := quoteIdent(schema)
	if err != nil {
		return nil, err
	}
	quotedTable, err := quoteIdent(req.Table)
	if err != nil {
		return nil, err
	}
	quotedCol, err := quoteIdent(req.ColumnName)
	if err != nil {
		return nil, err
	}

	sql := fmt.Sprintf("ALTER TABLE %s.%s DROP COLUMN %s", quotedSchema, quotedTable, quotedCol)
	if err := s.db.WithContext(ctx).Exec(sql).Error; err != nil {
		return nil, fmt.Errorf("failed to delete column: %w", err)
	}

	return &pb.DeleteColumnResponse{}, nil
}

func (s *Server) GetRows(ctx context.Context, req *pb.GetRowsRequest) (*pb.GetRowsResponse, error) {
	schema := req.Schema
	if schema == "" {
		schema = "public"
	}

	quotedSchema, err := quoteIdent(schema)
	if err != nil {
		return nil, err
	}
	quotedTable, err := quoteIdent(req.Table)
	if err != nil {
		return nil, err
	}

	tableRef := fmt.Sprintf("%s.%s", quotedSchema, quotedTable)

	var totalCount int64
	if err := s.db.WithContext(ctx).Raw(fmt.Sprintf("SELECT COUNT(*) FROM %s", tableRef)).Scan(&totalCount).Error; err != nil {
		return nil, fmt.Errorf("failed to count rows: %w", err)
	}

	limit := req.Limit
	if limit <= 0 {
		limit = 25
	}
	offset := req.Offset
	if offset < 0 {
		offset = 0
	}

	query := fmt.Sprintf("SELECT * FROM %s", tableRef)
	if req.OrderBy != "" {
		query += " ORDER BY " + req.OrderBy
	}
	query += fmt.Sprintf(" LIMIT %d OFFSET %d", limit, offset)

	sqlDB, err := s.db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get sql.DB: %w", err)
	}

	dbRows, err := sqlDB.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to get rows: %w", err)
	}
	defer dbRows.Close()

	cols, err := dbRows.Columns()
	if err != nil {
		return nil, fmt.Errorf("failed to get columns: %w", err)
	}

	var jsonRows [][]byte
	for dbRows.Next() {
		values := make([]interface{}, len(cols))
		valuePtrs := make([]interface{}, len(cols))
		for i := range values {
			valuePtrs[i] = &values[i]
		}

		if err := dbRows.Scan(valuePtrs...); err != nil {
			return nil, fmt.Errorf("failed to scan row: %w", err)
		}

		rowMap := make(map[string]interface{})
		for i, col := range cols {
			val := values[i]
			if b, ok := val.([]byte); ok {
				rowMap[col] = string(b)
			} else {
				rowMap[col] = val
			}
		}

		jsonData, err := json.Marshal(rowMap)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal row: %w", err)
		}
		jsonRows = append(jsonRows, jsonData)
	}

	return &pb.GetRowsResponse{
		Rows:       jsonRows,
		TotalCount: totalCount,
	}, nil
}

func (s *Server) ExecuteSQL(ctx context.Context, req *pb.ExecuteSQLRequest) (*pb.ExecuteSQLResponse, error) {
	start := time.Now()

	sqlDB, err := s.db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get sql.DB: %w", err)
	}

	query := strings.TrimSpace(req.Query)
	upper := strings.ToUpper(query)

	if strings.HasPrefix(upper, "SELECT") || strings.HasPrefix(upper, "WITH") {
		rows, err := sqlDB.QueryContext(ctx, query)
		if err != nil {
			return nil, fmt.Errorf("query failed: %w", err)
		}
		defer rows.Close()

		cols, err := rows.Columns()
		if err != nil {
			return nil, fmt.Errorf("failed to get columns: %w", err)
		}

		var jsonRows [][]byte
		for rows.Next() {
			values := make([]interface{}, len(cols))
			valuePtrs := make([]interface{}, len(cols))
			for i := range values {
				valuePtrs[i] = &values[i]
			}

			if err := rows.Scan(valuePtrs...); err != nil {
				return nil, fmt.Errorf("failed to scan row: %w", err)
			}

			rowMap := make(map[string]interface{})
			for i, col := range cols {
				val := values[i]
				if b, ok := val.([]byte); ok {
					rowMap[col] = string(b)
				} else {
					rowMap[col] = val
				}
			}

			jsonData, err := json.Marshal(rowMap)
			if err != nil {
				return nil, fmt.Errorf("failed to marshal row: %w", err)
			}
			jsonRows = append(jsonRows, jsonData)
		}

		elapsed := time.Since(start).Seconds() * 1000
		return &pb.ExecuteSQLResponse{
			Rows:            jsonRows,
			AffectedRows:    int64(len(jsonRows)),
			ExecutionTimeMs: elapsed,
		}, nil
	}

	result, err := sqlDB.ExecContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("exec failed: %w", err)
	}

	affected, _ := result.RowsAffected()
	elapsed := time.Since(start).Seconds() * 1000

	return &pb.ExecuteSQLResponse{
		Rows:            nil,
		AffectedRows:    affected,
		ExecutionTimeMs: elapsed,
	}, nil
}
