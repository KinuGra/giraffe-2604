"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateTableDialog } from "@/features/editor/create-table-dialog";
import { DataBrowser } from "@/features/editor/data-browser";
import { DefinitionTab } from "@/features/editor/definition-tab";
import { InsertRowDialog } from "@/features/editor/insert-row-dialog";
import { RowInspector } from "@/features/editor/row-inspector";
import { SqlTab } from "@/features/editor/sql-tab";
import { TableList } from "@/features/editor/table-list";
import type { ColumnDef, TableInfo } from "@/lib/database-api";
import { databaseApi } from "@/lib/database-api";
import { Plus, RefreshCw, Shield, Table2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

function formatRowCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return String(count);
}

export default function EditorPage() {
  const [schema, setSchema] = useState("public");
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState("");
  const [columns, setColumns] = useState<ColumnDef[]>([]);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [totalRowCount, setTotalRowCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [filter, setFilter] = useState("");
  const [view, setView] = useState<"data" | "definition" | "sql">("data");
  const [insertDialogOpen, setInsertDialogOpen] = useState(false);
  const [createTableOpen, setCreateTableOpen] = useState(false);

  const fetchTables = useCallback(async (s: string) => {
    try {
      const list = await databaseApi.listTables(s);
      setTables(list);
      return list;
    } catch (e) {
      console.error(e);
      setTables([]);
      return [];
    }
  }, []);

  const fetchTableData = useCallback(
    async (table: string, s: string, limit: number, offset: number) => {
      if (!table) return;
      try {
        const [cols, rowsResp] = await Promise.all([
          databaseApi.listColumns(table, s),
          databaseApi.getRows(table, s, limit, offset),
        ]);
        setColumns(cols);
        setRows(rowsResp.rows ?? []);
        setTotalRowCount(rowsResp.totalCount);
      } catch (e) {
        console.error(e);
        setColumns([]);
        setRows([]);
        setTotalRowCount(0);
      }
    },
    [],
  );

  useEffect(() => {
    fetchTables(schema).then((list) => {
      if (list.length > 0) {
        setSelectedTable(list[0].name);
      } else {
        setSelectedTable("");
        setColumns([]);
        setRows([]);
        setTotalRowCount(0);
      }
    });
  }, [schema, fetchTables]);

  useEffect(() => {
    if (!selectedTable) return;
    setPage(0);
    fetchTableData(selectedTable, schema, rowsPerPage, 0);
  }, [selectedTable, schema, fetchTableData, rowsPerPage]);

  useEffect(() => {
    if (!selectedTable || page === 0) return;
    const offset = page * rowsPerPage;
    databaseApi
      .getRows(selectedTable, schema, rowsPerPage, offset)
      .then((resp) => {
        setRows(resp.rows ?? []);
        setTotalRowCount(resp.totalCount);
      })
      .catch(console.error);
  }, [page, selectedTable, schema, rowsPerPage]);

  const tableInfo = tables.find((t) => t.name === selectedTable);

  const handleRefresh = useCallback(() => {
    fetchTables(schema);
    if (selectedTable) {
      fetchTableData(selectedTable, schema, rowsPerPage, page * rowsPerPage);
    }
  }, [schema, selectedTable, rowsPerPage, page, fetchTables, fetchTableData]);

  const handleInsertRow = useCallback(
    async (values: Record<string, unknown>) => {
      try {
        await databaseApi.insertRow(selectedTable, values, schema);
        await fetchTableData(
          selectedTable,
          schema,
          rowsPerPage,
          page * rowsPerPage,
        );
        await fetchTables(schema);
        toast.success("Row inserted");
      } catch (e) {
        toast.error("Failed to insert row");
        throw e;
      }
    },
    [selectedTable, schema, rowsPerPage, page, fetchTableData, fetchTables],
  );

  const handleUpdateRow = useCallback(
    async (pk: Record<string, unknown>, values: Record<string, unknown>) => {
      try {
        await databaseApi.updateRow(selectedTable, pk, values, schema);
        await fetchTableData(
          selectedTable,
          schema,
          rowsPerPage,
          page * rowsPerPage,
        );
        toast.success("Row updated");
      } catch (e) {
        toast.error("Failed to update row");
        throw e;
      }
    },
    [selectedTable, schema, rowsPerPage, page, fetchTableData],
  );

  const handleDeleteRow = useCallback(
    async (pk: Record<string, unknown>) => {
      try {
        await databaseApi.deleteRow(selectedTable, pk, schema);
        setSelectedRow(null);
        await fetchTableData(
          selectedTable,
          schema,
          rowsPerPage,
          page * rowsPerPage,
        );
        await fetchTables(schema);
        toast.success("Row deleted");
      } catch (e) {
        toast.error("Failed to delete row");
        throw e;
      }
    },
    [selectedTable, schema, rowsPerPage, page, fetchTableData, fetchTables],
  );

  const handleDeleteTable = useCallback(
    async (name: string) => {
      if (!window.confirm(`Delete table "${name}"? This cannot be undone.`))
        return;
      try {
        await databaseApi.deleteTable(name, schema);
        const list = await fetchTables(schema);
        if (list.length > 0) setSelectedTable(list[0].name);
        else {
          setSelectedTable("");
          setColumns([]);
          setRows([]);
          setTotalRowCount(0);
        }
        toast.success(`Table "${name}" deleted`);
      } catch (e) {
        toast.error("Failed to delete table");
      }
    },
    [schema, fetchTables],
  );

  return (
    <div className="flex h-screen overflow-hidden">
      <TableList
        tables={tables}
        selectedTable={selectedTable}
        onSelectTable={(name) => {
          setSelectedTable(name);
          setSelectedRow(null);
          setFilter("");
        }}
        onSchemaChange={setSchema}
        onCreateTable={() => setCreateTableOpen(true)}
        onDeleteTable={handleDeleteTable}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center gap-3 border-b px-4 py-2.5">
          <Table2 className="size-4 text-muted-foreground" />
          <h1 className="text-sm font-semibold">
            {selectedTable || "No table selected"}
          </h1>
          {selectedTable && (
            <Badge variant="secondary" className="text-[10px]">
              {schema}
            </Badge>
          )}
          {tableInfo?.rls && (
            <Badge className="gap-1 bg-brand-500/15 text-brand-400 border-brand-500/20 text-[10px]">
              <Shield className="size-3" />
              RLS
            </Badge>
          )}
          {tableInfo && (
            <span className="text-xs tabular-nums text-muted-foreground">
              {formatRowCount(tableInfo.rowCount)} rows
            </span>
          )}

          <div className="ml-auto flex items-center gap-1">
            <Button variant="ghost" size="icon-xs" onClick={handleRefresh}>
              <RefreshCw className="size-3.5" />
            </Button>
            <Separator orientation="vertical" className="mx-1 h-4" />
            <Button
              size="xs"
              className="gap-1"
              disabled={!selectedTable}
              onClick={() => setInsertDialogOpen(true)}
            >
              <Plus className="size-3" />
              Insert
            </Button>
          </div>
        </div>

        <Tabs
          value={view}
          onValueChange={(v) => setView(v as typeof view)}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="border-b px-4">
            <TabsList variant="line">
              <TabsTrigger value="data">Data</TabsTrigger>
              <TabsTrigger value="definition">Definition</TabsTrigger>
              <TabsTrigger value="sql">SQL</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="data" className="flex flex-1 overflow-hidden">
            <DataBrowser
              columns={columns}
              rows={rows}
              totalCount={totalRowCount}
              page={page}
              rowsPerPage={rowsPerPage}
              onPageChange={setPage}
              onRowsPerPageChange={setRowsPerPage}
              selectedRow={selectedRow}
              onSelectRow={setSelectedRow}
              filter={filter}
              onFilterChange={setFilter}
            />
            {selectedRow !== null && (
              <RowInspector
                columns={columns}
                rows={rows}
                rowIndex={selectedRow}
                onClose={() => setSelectedRow(null)}
                onSave={handleUpdateRow}
                onDelete={handleDeleteRow}
              />
            )}
          </TabsContent>

          <TabsContent value="definition" className="overflow-y-auto p-4">
            <DefinitionTab
              columns={columns}
              tableName={selectedTable}
              schema={schema}
              onColumnsChange={() =>
                fetchTableData(
                  selectedTable,
                  schema,
                  rowsPerPage,
                  page * rowsPerPage,
                )
              }
            />
          </TabsContent>

          <TabsContent value="sql" className="overflow-y-auto p-4">
            <SqlTab />
          </TabsContent>
        </Tabs>
      </div>

      <InsertRowDialog
        columns={columns}
        open={insertDialogOpen}
        onOpenChange={setInsertDialogOpen}
        onInsert={handleInsertRow}
      />

      <CreateTableDialog
        open={createTableOpen}
        onOpenChange={setCreateTableOpen}
        schema={schema}
        onCreate={async () => {
          const list = await fetchTables(schema);
          if (list.length > 0) setSelectedTable(list[list.length - 1].name);
        }}
      />
    </div>
  );
}
