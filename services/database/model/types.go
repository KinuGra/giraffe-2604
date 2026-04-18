package model

type TableInfo struct {
	Name     string
	Schema   string
	RLS      bool
	RowCount int64
}

type ColumnInfo struct {
	Name         string
	Type         string
	DefaultValue string
	Nullable     bool
	IsPrimaryKey bool
	IsUnique     bool
}
