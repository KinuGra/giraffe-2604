"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataBrowser } from "@/features/editor/data-browser";
import { DefinitionTab } from "@/features/editor/definition-tab";
import { RowInspector } from "@/features/editor/row-inspector";
import { SqlTab } from "@/features/editor/sql-tab";
import { TableList } from "@/features/editor/table-list";
import { tables } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import {
  Download,
  Filter,
  Plus,
  RefreshCw,
  Shield,
  Table2,
} from "lucide-react";
import { useState } from "react";

function formatRowCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return String(count);
}

export default function EditorPage() {
  const [selectedTable, setSelectedTable] = useState("profiles");
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [filter, setFilter] = useState("");
  const [view, setView] = useState<"data" | "definition" | "sql">("data");

  const tableInfo = tables.find((t) => t.name === selectedTable);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left panel - Table list */}
      <TableList
        selectedTable={selectedTable}
        onSelectTable={(name) => {
          setSelectedTable(name);
          setSelectedRow(null);
          setFilter("");
        }}
      />

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 border-b px-4 py-2.5">
          <Table2 className="size-4 text-muted-foreground" />
          <h1 className="text-sm font-semibold">{selectedTable}</h1>
          <Badge variant="secondary" className="text-[10px]">
            public
          </Badge>
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
            <Button variant="ghost" size="icon-xs">
              <RefreshCw className="size-3.5" />
            </Button>
            <Button variant="ghost" size="icon-xs">
              <Filter className="size-3.5" />
            </Button>
            <Button variant="ghost" size="icon-xs">
              <Download className="size-3.5" />
            </Button>
            <Separator orientation="vertical" className="mx-1 h-4" />
            <Button size="xs" className="gap-1">
              <Plus className="size-3" />
              Insert
            </Button>
          </div>
        </div>

        {/* Tabs */}
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
              selectedRow={selectedRow}
              onSelectRow={setSelectedRow}
              filter={filter}
              onFilterChange={setFilter}
            />
            {selectedRow !== null && (
              <RowInspector
                rowIndex={selectedRow}
                onClose={() => setSelectedRow(null)}
              />
            )}
          </TabsContent>

          <TabsContent value="definition" className="overflow-y-auto p-4">
            <DefinitionTab />
          </TabsContent>

          <TabsContent value="sql" className="overflow-y-auto p-4">
            <SqlTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
