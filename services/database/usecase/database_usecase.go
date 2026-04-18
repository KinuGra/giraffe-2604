package usecase

import (
	"context"
	"strings"
	"time"

	"github.com/KinuGra/giraffe-2604/services/database/model"
	"github.com/KinuGra/giraffe-2604/services/database/repository"
)

type DatabaseUsecase struct {
	repo *repository.DatabaseRepo
}

func NewDatabaseUsecase(repo *repository.DatabaseRepo) *DatabaseUsecase {
	return &DatabaseUsecase{repo: repo}
}

func defaultSchema(schema string) string {
	if schema == "" {
		return "public"
	}
	return schema
}

func (u *DatabaseUsecase) ListTables(ctx context.Context, schema string) ([]model.TableInfo, error) {
	return u.repo.ListTables(ctx, defaultSchema(schema))
}

func (u *DatabaseUsecase) CreateTable(ctx context.Context, schema, name string, columns []model.ColumnInfo) (*model.TableInfo, error) {
	s := defaultSchema(schema)
	if err := u.repo.CreateTable(ctx, s, name, columns); err != nil {
		return nil, err
	}
	return &model.TableInfo{Name: name, Schema: s, RLS: false, RowCount: 0}, nil
}

func (u *DatabaseUsecase) DeleteTable(ctx context.Context, schema, name string) error {
	return u.repo.DeleteTable(ctx, defaultSchema(schema), name)
}

func (u *DatabaseUsecase) ListColumns(ctx context.Context, schema, table string) ([]model.ColumnInfo, error) {
	return u.repo.ListColumns(ctx, defaultSchema(schema), table)
}

func (u *DatabaseUsecase) AddColumn(ctx context.Context, schema, table string, col model.ColumnInfo) (*model.ColumnInfo, error) {
	if err := u.repo.AddColumn(ctx, defaultSchema(schema), table, col); err != nil {
		return nil, err
	}
	return &col, nil
}

func (u *DatabaseUsecase) UpdateColumn(ctx context.Context, schema, table, columnName, newName, newType, newDefault string, setNullable, nullable bool) (string, error) {
	if err := u.repo.UpdateColumn(ctx, defaultSchema(schema), table, columnName, newName, newType, newDefault, setNullable, nullable); err != nil {
		return "", err
	}
	finalName := columnName
	if newName != "" {
		finalName = newName
	}
	return finalName, nil
}

func (u *DatabaseUsecase) DeleteColumn(ctx context.Context, schema, table, columnName string) error {
	return u.repo.DeleteColumn(ctx, defaultSchema(schema), table, columnName)
}

func (u *DatabaseUsecase) GetRows(ctx context.Context, schema, table string, limit, offset int32, orderBy string) ([][]byte, int64, error) {
	if limit <= 0 {
		limit = 25
	}
	if offset < 0 {
		offset = 0
	}
	return u.repo.GetRows(ctx, defaultSchema(schema), table, limit, offset, orderBy)
}

func (u *DatabaseUsecase) InsertRow(ctx context.Context, schema, table string, values []byte) ([]byte, error) {
	return u.repo.InsertRow(ctx, defaultSchema(schema), table, values)
}

func (u *DatabaseUsecase) UpdateRow(ctx context.Context, schema, table string, pk, values []byte) ([]byte, error) {
	return u.repo.UpdateRow(ctx, defaultSchema(schema), table, pk, values)
}

func (u *DatabaseUsecase) DeleteRow(ctx context.Context, schema, table string, pk []byte) (int64, error) {
	return u.repo.DeleteRow(ctx, defaultSchema(schema), table, pk)
}

func (u *DatabaseUsecase) ExecuteSQL(ctx context.Context, query string) ([][]byte, int64, float64, error) {
	query = strings.TrimSpace(query)
	start := time.Now()
	rows, affected, err := u.repo.ExecuteRawSQL(ctx, query)
	if err != nil {
		return nil, 0, 0, err
	}
	elapsed := time.Since(start).Seconds() * 1000
	return rows, affected, elapsed, nil
}
