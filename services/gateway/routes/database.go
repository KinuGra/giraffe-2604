package routes

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	pb "github.com/KinuGra/giraffe-2604/gen/database"
)

func RegisterDatabaseRoutes(r *gin.Engine, client pb.DatabaseServiceClient) {
	g := r.Group("/database/v1")
	{
		g.GET("/tables", listTables(client))
		g.POST("/tables", createTable(client))
		g.DELETE("/tables/:name", deleteTable(client))

		g.GET("/tables/:name/columns", listColumns(client))
		g.POST("/tables/:name/columns", addColumn(client))
		g.PATCH("/tables/:name/columns/:column", updateColumn(client))
		g.DELETE("/tables/:name/columns/:column", deleteColumn(client))

		g.GET("/tables/:name/rows", getRows(client))
		g.POST("/tables/:name/rows", insertRow(client))
		g.PUT("/tables/:name/rows", updateRow(client))
		g.DELETE("/tables/:name/rows", deleteRow(client))
		g.POST("/sql", executeSQL(client))
	}
}

func listTables(client pb.DatabaseServiceClient) gin.HandlerFunc {
	return func(c *gin.Context) {
		schema := c.DefaultQuery("schema", "public")
		resp, err := client.ListTables(c.Request.Context(), &pb.ListTablesRequest{
			Schema: schema,
		})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		tables := make([]gin.H, 0, len(resp.Tables))
		for _, t := range resp.Tables {
			tables = append(tables, gin.H{
				"name":     t.Name,
				"schema":   t.Schema,
				"rls":      t.Rls,
				"rowCount": t.RowCount,
			})
		}
		c.JSON(http.StatusOK, tables)
	}
}

func createTable(client pb.DatabaseServiceClient) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			Schema  string `json:"schema"`
			Name    string `json:"name"`
			Columns []struct {
				Name         string `json:"name"`
				Type         string `json:"type"`
				DefaultValue string `json:"default_value"`
				Nullable     bool   `json:"nullable"`
				IsPrimaryKey bool   `json:"is_primary_key"`
				IsUnique     bool   `json:"is_unique"`
			} `json:"columns"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		cols := make([]*pb.ColumnDef, 0, len(req.Columns))
		for _, col := range req.Columns {
			cols = append(cols, &pb.ColumnDef{
				Name:         col.Name,
				Type:         col.Type,
				DefaultValue: col.DefaultValue,
				Nullable:     col.Nullable,
				IsPrimaryKey: col.IsPrimaryKey,
				IsUnique:     col.IsUnique,
			})
		}

		resp, err := client.CreateTable(c.Request.Context(), &pb.CreateTableRequest{
			Schema:  req.Schema,
			Name:    req.Name,
			Columns: cols,
		})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusCreated, gin.H{
			"name":     resp.Table.Name,
			"schema":   resp.Table.Schema,
			"rls":      resp.Table.Rls,
			"rowCount": resp.Table.RowCount,
		})
	}
}

func deleteTable(client pb.DatabaseServiceClient) gin.HandlerFunc {
	return func(c *gin.Context) {
		schema := c.DefaultQuery("schema", "public")
		name := c.Param("name")

		_, err := client.DeleteTable(c.Request.Context(), &pb.DeleteTableRequest{
			Schema: schema,
			Name:   name,
		})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.Status(http.StatusNoContent)
	}
}

func listColumns(client pb.DatabaseServiceClient) gin.HandlerFunc {
	return func(c *gin.Context) {
		schema := c.DefaultQuery("schema", "public")
		table := c.Param("name")

		resp, err := client.ListColumns(c.Request.Context(), &pb.ListColumnsRequest{
			Schema: schema,
			Table:  table,
		})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		columns := make([]gin.H, 0, len(resp.Columns))
		for _, col := range resp.Columns {
			columns = append(columns, gin.H{
				"name":         col.Name,
				"type":         col.Type,
				"default":      col.DefaultValue,
				"nullable":     col.Nullable,
				"isPrimaryKey": col.IsPrimaryKey,
				"isUnique":     col.IsUnique,
			})
		}
		c.JSON(http.StatusOK, columns)
	}
}

func addColumn(client pb.DatabaseServiceClient) gin.HandlerFunc {
	return func(c *gin.Context) {
		schema := c.DefaultQuery("schema", "public")
		table := c.Param("name")

		var req struct {
			Column struct {
				Name         string `json:"name"`
				Type         string `json:"type"`
				DefaultValue string `json:"default_value"`
				Nullable     bool   `json:"nullable"`
				IsPrimaryKey bool   `json:"is_primary_key"`
				IsUnique     bool   `json:"is_unique"`
			} `json:"column"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		resp, err := client.AddColumn(c.Request.Context(), &pb.AddColumnRequest{
			Schema: schema,
			Table:  table,
			Column: &pb.ColumnDef{
				Name:         req.Column.Name,
				Type:         req.Column.Type,
				DefaultValue: req.Column.DefaultValue,
				Nullable:     req.Column.Nullable,
				IsPrimaryKey: req.Column.IsPrimaryKey,
				IsUnique:     req.Column.IsUnique,
			},
		})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusCreated, gin.H{
			"name":         resp.Column.Name,
			"type":         resp.Column.Type,
			"default":      resp.Column.DefaultValue,
			"nullable":     resp.Column.Nullable,
			"isPrimaryKey": resp.Column.IsPrimaryKey,
			"isUnique":     resp.Column.IsUnique,
		})
	}
}

func updateColumn(client pb.DatabaseServiceClient) gin.HandlerFunc {
	return func(c *gin.Context) {
		schema := c.DefaultQuery("schema", "public")
		table := c.Param("name")
		column := c.Param("column")

		var req struct {
			NewName     string `json:"new_name"`
			NewType     string `json:"new_type"`
			NewDefault  string `json:"new_default"`
			SetNullable bool   `json:"set_nullable"`
			Nullable    bool   `json:"nullable"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		resp, err := client.UpdateColumn(c.Request.Context(), &pb.UpdateColumnRequest{
			Schema:      schema,
			Table:       table,
			ColumnName:  column,
			NewName:     req.NewName,
			NewType:     req.NewType,
			NewDefault:  req.NewDefault,
			SetNullable: req.SetNullable,
			Nullable:    req.Nullable,
		})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"name": resp.Column.Name,
		})
	}
}

func deleteColumn(client pb.DatabaseServiceClient) gin.HandlerFunc {
	return func(c *gin.Context) {
		schema := c.DefaultQuery("schema", "public")
		table := c.Param("name")
		column := c.Param("column")

		_, err := client.DeleteColumn(c.Request.Context(), &pb.DeleteColumnRequest{
			Schema:     schema,
			Table:      table,
			ColumnName: column,
		})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.Status(http.StatusNoContent)
	}
}

func getRows(client pb.DatabaseServiceClient) gin.HandlerFunc {
	return func(c *gin.Context) {
		schema := c.DefaultQuery("schema", "public")
		table := c.Param("name")
		limit, _ := strconv.Atoi(c.DefaultQuery("limit", "25"))
		offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
		orderBy := c.Query("order_by")

		resp, err := client.GetRows(c.Request.Context(), &pb.GetRowsRequest{
			Schema:  schema,
			Table:   table,
			Limit:   int32(limit),
			Offset:  int32(offset),
			OrderBy: orderBy,
		})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		rows := make([]json.RawMessage, 0, len(resp.Rows))
		for _, r := range resp.Rows {
			rows = append(rows, json.RawMessage(r))
		}

		c.JSON(http.StatusOK, gin.H{
			"rows":       rows,
			"totalCount": resp.TotalCount,
		})
	}
}

func insertRow(client pb.DatabaseServiceClient) gin.HandlerFunc {
	return func(c *gin.Context) {
		schema := c.DefaultQuery("schema", "public")
		table := c.Param("name")

		var body map[string]interface{}
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		values, err := json.Marshal(body)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid JSON"})
			return
		}

		resp, err := client.InsertRow(c.Request.Context(), &pb.InsertRowRequest{
			Schema: schema,
			Table:  table,
			Values: values,
		})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.Data(http.StatusCreated, "application/json", resp.Row)
	}
}

func updateRow(client pb.DatabaseServiceClient) gin.HandlerFunc {
	return func(c *gin.Context) {
		schema := c.DefaultQuery("schema", "public")
		table := c.Param("name")

		var body struct {
			Pk     map[string]interface{} `json:"pk"`
			Values map[string]interface{} `json:"values"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		pk, _ := json.Marshal(body.Pk)
		values, _ := json.Marshal(body.Values)

		resp, err := client.UpdateRow(c.Request.Context(), &pb.UpdateRowRequest{
			Schema: schema,
			Table:  table,
			Pk:     pk,
			Values: values,
		})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.Data(http.StatusOK, "application/json", resp.Row)
	}
}

func deleteRow(client pb.DatabaseServiceClient) gin.HandlerFunc {
	return func(c *gin.Context) {
		schema := c.DefaultQuery("schema", "public")
		table := c.Param("name")

		var body struct {
			Pk map[string]interface{} `json:"pk"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		pk, _ := json.Marshal(body.Pk)

		resp, err := client.DeleteRow(c.Request.Context(), &pb.DeleteRowRequest{
			Schema: schema,
			Table:  table,
			Pk:     pk,
		})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"affectedRows": resp.AffectedRows})
	}
}

func executeSQL(client pb.DatabaseServiceClient) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			Query string `json:"query"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		resp, err := client.ExecuteSQL(c.Request.Context(), &pb.ExecuteSQLRequest{
			Query: req.Query,
		})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		rows := make([]json.RawMessage, 0, len(resp.Rows))
		for _, r := range resp.Rows {
			rows = append(rows, json.RawMessage(r))
		}

		c.JSON(http.StatusOK, gin.H{
			"rows":            rows,
			"affectedRows":    resp.AffectedRows,
			"executionTimeMs": resp.ExecutionTimeMs,
		})
	}
}
