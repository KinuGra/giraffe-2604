"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { schemas, tables } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Lock, Plus, Search, Table2 } from "lucide-react";
import { useMemo, useState } from "react";

function formatRowCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return String(count);
}

interface TableListProps {
  selectedTable: string;
  onSelectTable: (name: string) => void;
}

export function TableList({ selectedTable, onSelectTable }: TableListProps) {
  const [schema, setSchema] = useState("public");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return tables
      .filter((t) => t.schema === schema)
      .filter((t) => t.name.toLowerCase().includes(search.toLowerCase()));
  }, [schema, search]);

  return (
    <div className="flex w-60 shrink-0 flex-col border-r bg-panel">
      {/* Schema selector */}
      <div className="p-2">
        <Select
          value={schema}
          onValueChange={(v) => {
            if (v) setSchema(v);
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Schema" />
          </SelectTrigger>
          <SelectContent>
            {schemas.map((s) => (
              <SelectItem key={s.name} value={s.name}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Search */}
      <div className="relative px-2 pb-2">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search tables..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 h-7 text-xs"
        />
      </div>

      {/* Table list */}
      <div className="flex-1 overflow-y-auto px-1">
        {filtered.map((table) => (
          <button
            key={table.name}
            type="button"
            onClick={() => onSelectTable(table.name)}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-muted/60",
              selectedTable === table.name && "bg-primary/10 text-foreground",
            )}
          >
            <Table2 className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="flex-1 truncate">{table.name}</span>

            {table.rls && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <span className="inline-flex">
                      <Lock className="size-3 text-brand-400" />
                    </span>
                  }
                />
                <TooltipContent side="right">RLS enabled</TooltipContent>
              </Tooltip>
            )}

            <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
              {formatRowCount(table.rowCount)}
            </span>
          </button>
        ))}
      </div>

      {/* New table button */}
      <div className="border-t p-2">
        <Button variant="outline" size="sm" className="w-full gap-1.5">
          <Plus className="size-3.5" />
          New table
        </Button>
      </div>
    </div>
  );
}
