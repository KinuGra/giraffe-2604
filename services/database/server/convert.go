package server

import (
	pb "github.com/KinuGra/giraffe-2604/gen/database"
	"github.com/KinuGra/giraffe-2604/services/database/model"
)

func tableInfoToProto(t *model.TableInfo) *pb.TableInfo {
	return &pb.TableInfo{
		Name:     t.Name,
		Schema:   t.Schema,
		Rls:      t.RLS,
		RowCount: t.RowCount,
	}
}

func columnInfoToProto(c *model.ColumnInfo) *pb.ColumnDef {
	return &pb.ColumnDef{
		Name:         c.Name,
		Type:         c.Type,
		DefaultValue: c.DefaultValue,
		Nullable:     c.Nullable,
		IsPrimaryKey: c.IsPrimaryKey,
		IsUnique:     c.IsUnique,
	}
}

func protoToColumnInfo(c *pb.ColumnDef) model.ColumnInfo {
	return model.ColumnInfo{
		Name:         c.Name,
		Type:         c.Type,
		DefaultValue: c.DefaultValue,
		Nullable:     c.Nullable,
		IsPrimaryKey: c.IsPrimaryKey,
		IsUnique:     c.IsUnique,
	}
}
