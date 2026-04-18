package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"regexp"
	"strings"

	"github.com/KinuGra/giraffe-2604/services/database/model"
	"gorm.io/gorm"
)

var identRegex = regexp.MustCompile(`^[a-zA-Z_][a-zA-Z0-9_]*$`)

type DatabaseRepo struct {
	db *gorm.DB
}

func NewDatabaseRepo(db *gorm.DB) *DatabaseRepo {
	return &DatabaseRepo{db: db}
}

func QuoteIdent(name string) (string, error) {
	if !identRegex.MatchString(name) {
		return "", fmt.Errorf("invalid identifier: %s", name)
	}
	return `"` + name + `"`, nil
}

func (r *DatabaseRepo) ListTables(ctx context.Context, schema string) ([]model.TableInfo, error) {
	type tableRow struct {
		TableName string
		RowCount  int64
		RLS       bool
	}

	var rows []tableRow
	err := r.db.WithContext(ctx).Raw(`
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

	tables := make([]model.TableInfo, 0, len(rows))
	for _, row := range rows {
		tables = append(tables, model.TableInfo{
			Name:     row.TableName,
			Schema:   schema,
			RLS:      row.RLS,
			RowCount: row.RowCount,
		})
	}
	return tables, nil
}

func (r *DatabaseRepo) CreateTable(ctx context.Context, schema, name string, columns []model.ColumnInfo) error {
	quotedSchema, err := QuoteIdent(schema)
	if err != nil {
		return err
	}
	quotedTable, err := QuoteIdent(name)
	if err != nil {
		return err
	}

	var colDefs []string
	var constraints []string

	for _, col := range columns {
		quotedCol, err := QuoteIdent(col.Name)
		if err != nil {
			return err
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

	if err := r.db.WithContext(ctx).Exec(sql).Error; err != nil {
		return fmt.Errorf("failed to create table: %w", err)
	}
	return nil
}

func (r *DatabaseRepo) DeleteTable(ctx context.Context, schema, name string) error {
	quotedSchema, err := QuoteIdent(schema)
	if err != nil {
		return err
	}
	quotedTable, err := QuoteIdent(name)
	if err != nil {
		return err
	}

	sql := fmt.Sprintf("DROP TABLE %s.%s", quotedSchema, quotedTable)
	if err := r.db.WithContext(ctx).Exec(sql).Error; err != nil {
		return fmt.Errorf("failed to delete table: %w", err)
	}
	return nil
}

func (r *DatabaseRepo) ListColumns(ctx context.Context, schema, table string) ([]model.ColumnInfo, error) {
	type colRow struct {
		ColumnName    string
		UdtName       string
		ColumnDefault *string
		IsNullable    string
		IsPrimaryKey  bool
		IsUnique      bool
	}

	var rows []colRow
	err := r.db.WithContext(ctx).Raw(`
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
	`, schema, table).Scan(&rows).Error
	if err != nil {
		return nil, fmt.Errorf("failed to list columns: %w", err)
	}

	columns := make([]model.ColumnInfo, 0, len(rows))
	for _, row := range rows {
		defaultVal := ""
		if row.ColumnDefault != nil {
			defaultVal = *row.ColumnDefault
		}
		columns = append(columns, model.ColumnInfo{
			Name:         row.ColumnName,
			Type:         row.UdtName,
			DefaultValue: defaultVal,
			Nullable:     row.IsNullable == "YES",
			IsPrimaryKey: row.IsPrimaryKey,
			IsUnique:     row.IsUnique,
		})
	}
	return columns, nil
}

func (r *DatabaseRepo) AddColumn(ctx context.Context, schema, table string, col model.ColumnInfo) error {
	quotedSchema, err := QuoteIdent(schema)
	if err != nil {
		return err
	}
	quotedTable, err := QuoteIdent(table)
	if err != nil {
		return err
	}
	quotedCol, err := QuoteIdent(col.Name)
	if err != nil {
		return err
	}

	sql := fmt.Sprintf("ALTER TABLE %s.%s ADD COLUMN %s %s", quotedSchema, quotedTable, quotedCol, col.Type)
	if col.DefaultValue != "" {
		sql += " DEFAULT " + col.DefaultValue
	}
	if !col.Nullable {
		sql += " NOT NULL"
	}
	if col.IsUnique {
		sql += " UNIQUE"
	}

	if err := r.db.WithContext(ctx).Exec(sql).Error; err != nil {
		return fmt.Errorf("failed to add column: %w", err)
	}
	return nil
}

func (r *DatabaseRepo) UpdateColumn(ctx context.Context, schema, table, columnName, newName, newType, newDefault string, setNullable, nullable bool) error {
	quotedSchema, err := QuoteIdent(schema)
	if err != nil {
		return err
	}
	quotedTable, err := QuoteIdent(table)
	if err != nil {
		return err
	}
	quotedCol, err := QuoteIdent(columnName)
	if err != nil {
		return err
	}

	tableRef := fmt.Sprintf("%s.%s", quotedSchema, quotedTable)

	if newType != "" {
		sql := fmt.Sprintf("ALTER TABLE %s ALTER COLUMN %s TYPE %s", tableRef, quotedCol, newType)
		if err := r.db.WithContext(ctx).Exec(sql).Error; err != nil {
			return fmt.Errorf("failed to change column type: %w", err)
		}
	}

	if newDefault != "" {
		var sql string
		if newDefault == "__DROP__" {
			sql = fmt.Sprintf("ALTER TABLE %s ALTER COLUMN %s DROP DEFAULT", tableRef, quotedCol)
		} else {
			sql = fmt.Sprintf("ALTER TABLE %s ALTER COLUMN %s SET DEFAULT %s", tableRef, quotedCol, newDefault)
		}
		if err := r.db.WithContext(ctx).Exec(sql).Error; err != nil {
			return fmt.Errorf("failed to change column default: %w", err)
		}
	}

	if setNullable {
		var sql string
		if nullable {
			sql = fmt.Sprintf("ALTER TABLE %s ALTER COLUMN %s DROP NOT NULL", tableRef, quotedCol)
		} else {
			sql = fmt.Sprintf("ALTER TABLE %s ALTER COLUMN %s SET NOT NULL", tableRef, quotedCol)
		}
		if err := r.db.WithContext(ctx).Exec(sql).Error; err != nil {
			return fmt.Errorf("failed to change column nullable: %w", err)
		}
	}

	if newName != "" && newName != columnName {
		quotedNewCol, err := QuoteIdent(newName)
		if err != nil {
			return err
		}
		sql := fmt.Sprintf("ALTER TABLE %s RENAME COLUMN %s TO %s", tableRef, quotedCol, quotedNewCol)
		if err := r.db.WithContext(ctx).Exec(sql).Error; err != nil {
			return fmt.Errorf("failed to rename column: %w", err)
		}
	}

	return nil
}

func (r *DatabaseRepo) DeleteColumn(ctx context.Context, schema, table, columnName string) error {
	quotedSchema, err := QuoteIdent(schema)
	if err != nil {
		return err
	}
	quotedTable, err := QuoteIdent(table)
	if err != nil {
		return err
	}
	quotedCol, err := QuoteIdent(columnName)
	if err != nil {
		return err
	}

	sql := fmt.Sprintf("ALTER TABLE %s.%s DROP COLUMN %s", quotedSchema, quotedTable, quotedCol)
	if err := r.db.WithContext(ctx).Exec(sql).Error; err != nil {
		return fmt.Errorf("failed to delete column: %w", err)
	}
	return nil
}

func (r *DatabaseRepo) GetRows(ctx context.Context, schema, table string, limit, offset int32, orderBy string) ([][]byte, int64, error) {
	quotedSchema, err := QuoteIdent(schema)
	if err != nil {
		return nil, 0, err
	}
	quotedTable, err := QuoteIdent(table)
	if err != nil {
		return nil, 0, err
	}

	tableRef := fmt.Sprintf("%s.%s", quotedSchema, quotedTable)

	var totalCount int64
	if err := r.db.WithContext(ctx).Raw(fmt.Sprintf("SELECT COUNT(*) FROM %s", tableRef)).Scan(&totalCount).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count rows: %w", err)
	}

	query := fmt.Sprintf("SELECT * FROM %s", tableRef)
	if orderBy != "" {
		query += " ORDER BY " + orderBy
	}
	query += fmt.Sprintf(" LIMIT %d OFFSET %d", limit, offset)

	sqlDB, err := r.db.DB()
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get sql.DB: %w", err)
	}

	rows, err := sqlDB.QueryContext(ctx, query)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get rows: %w", err)
	}
	defer rows.Close()

	jsonRows, err := scanRowsToJSON(rows)
	if err != nil {
		return nil, 0, err
	}

	return jsonRows, totalCount, nil
}

func (r *DatabaseRepo) ExecuteRawSQL(ctx context.Context, query string) ([][]byte, int64, error) {
	sqlDB, err := r.db.DB()
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get sql.DB: %w", err)
	}

	upper := strings.ToUpper(strings.TrimSpace(query))

	if strings.HasPrefix(upper, "SELECT") || strings.HasPrefix(upper, "WITH") {
		rows, err := sqlDB.QueryContext(ctx, query)
		if err != nil {
			return nil, 0, fmt.Errorf("query failed: %w", err)
		}
		defer rows.Close()

		jsonRows, err := scanRowsToJSON(rows)
		if err != nil {
			return nil, 0, err
		}

		return jsonRows, int64(len(jsonRows)), nil
	}

	result, err := sqlDB.ExecContext(ctx, query)
	if err != nil {
		return nil, 0, fmt.Errorf("exec failed: %w", err)
	}

	affected, _ := result.RowsAffected()
	return nil, affected, nil
}

func scanRowsToJSON(rows interface {
	Columns() ([]string, error)
	Next() bool
	Scan(dest ...interface{}) error
}) ([][]byte, error) {
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

	return jsonRows, nil
}
