"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { profilesColumns, profilesRows } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Filter,
  Key,
  ListOrdered,
  Search,
} from "lucide-react";
import { useMemo } from "react";

interface DataBrowserProps {
  selectedRow: number | null;
  onSelectRow: (idx: number | null) => void;
  filter: string;
  onFilterChange: (v: string) => void;
}

function renderCellValue(value: unknown, colName: string) {
  if (value === null || value === undefined) {
    return <span className="italic text-muted-foreground">NULL</span>;
  }

  if (typeof value === "boolean") {
    return (
      <Badge
        variant={value ? "default" : "secondary"}
        className={cn(
          value
            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
            : "",
        )}
      >
        {String(value)}
      </Badge>
    );
  }

  if (colName === "role") {
    const roleColors: Record<string, string> = {
      owner: "bg-amber-500/15 text-amber-400 border-amber-500/20",
      admin: "bg-violet-500/15 text-violet-400 border-violet-500/20",
      member: "",
    };
    return (
      <Badge
        variant={value === "member" ? "secondary" : "outline"}
        className={cn(roleColors[value as string] ?? "")}
      >
        {String(value)}
      </Badge>
    );
  }

  return (
    <span className="truncate max-w-[220px] inline-block align-middle">
      {String(value)}
    </span>
  );
}

export function DataBrowser({
  selectedRow,
  onSelectRow,
  filter,
  onFilterChange,
}: DataBrowserProps) {
  const rows = useMemo(() => {
    if (!filter) return profilesRows;
    const lower = filter.toLowerCase();
    return profilesRows.filter((row) =>
      Object.values(row).some(
        (v) =>
          v !== null &&
          v !== undefined &&
          String(v).toLowerCase().includes(lower),
      ),
    );
  }, [filter]);

  const rowsPerPageOptions = ["25", "50", "100", "500"];

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b px-3 py-1.5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search rows..."
            value={filter}
            onChange={(e) => onFilterChange(e.target.value)}
            className="h-7 w-52 pl-7 text-xs"
          />
        </div>

        <Button
          variant="ghost"
          size="xs"
          className="gap-1 text-xs text-muted-foreground"
        >
          <Filter className="size-3" />
          where
        </Button>
        <Button
          variant="ghost"
          size="xs"
          className="gap-1 text-xs text-muted-foreground"
        >
          <ListOrdered className="size-3" />
          order
        </Button>

        <Separator orientation="vertical" className="mx-1 h-4" />

        <span className="text-xs text-muted-foreground">Rows per page</span>
        <Select defaultValue="25">
          <SelectTrigger size="sm" className="h-6 w-16 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {rowsPerPageOptions.map((v) => (
              <SelectItem key={v} value={v}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-1">
          <span className="text-xs tabular-nums text-muted-foreground">
            1 - {rows.length} of {rows.length}
          </span>
          <Button variant="ghost" size="icon-xs" disabled>
            <ChevronLeft className="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon-xs" disabled>
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Spreadsheet */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-xs">
          <thead className="sticky top-0 z-10 bg-panel-2">
            <tr className="border-b">
              {/* Checkbox column */}
              <th className="sticky left-0 z-20 w-10 bg-panel-2 px-2 py-2 text-center">
                <input
                  type="checkbox"
                  className="size-3.5 rounded border-input accent-primary"
                  readOnly
                />
              </th>
              {profilesColumns.map((col) => (
                <th
                  key={col.name}
                  className="whitespace-nowrap px-3 py-2 text-left font-medium text-muted-foreground"
                >
                  <div className="flex items-center gap-1.5">
                    {col.isPrimaryKey && (
                      <Key className="size-3 text-amber-400" />
                    )}
                    <span className="font-mono text-foreground">
                      {col.name}
                    </span>
                    <Badge
                      variant="outline"
                      className="ml-0.5 h-4 px-1 text-[10px] font-mono font-normal"
                    >
                      {col.type}
                    </Badge>
                    {!col.nullable && (
                      <span className="text-[10px] text-muted-foreground">
                        NOT NULL
                      </span>
                    )}
                    <button
                      type="button"
                      className="ml-auto opacity-0 group-hover/th:opacity-100"
                    >
                      <ChevronsUpDown className="size-3 text-muted-foreground" />
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={String(row.id)}
                onClick={() => onSelectRow(selectedRow === idx ? null : idx)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ")
                    onSelectRow(selectedRow === idx ? null : idx);
                }}
                className={cn(
                  "cursor-pointer border-b border-border/50 transition-colors hover:bg-muted/40",
                  selectedRow === idx && "bg-primary/5",
                )}
              >
                {/* Checkbox */}
                <td className="sticky left-0 z-10 bg-panel px-2 py-1.5 text-center">
                  <input
                    type="checkbox"
                    checked={selectedRow === idx}
                    readOnly
                    className="size-3.5 rounded border-input accent-primary"
                  />
                </td>
                {profilesColumns.map((col) => (
                  <td key={col.name} className="px-3 py-1.5">
                    {renderCellValue(row[col.name], col.name)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer bar */}
      <div className="flex items-center gap-3 border-t bg-panel-2 px-3 py-1.5 text-[11px] text-muted-foreground">
        <span>
          Query ran in <span className="text-brand-400">14ms</span>
        </span>
        <Separator orientation="vertical" className="h-3" />
        <span className="truncate font-mono text-[10px]">
          SELECT * FROM public.profiles ORDER BY created_at DESC LIMIT 25;
        </span>
        <span className="ml-auto shrink-0 tabular-nums">
          {rows.length} rows &middot; {profilesColumns.length} cols
        </span>
      </div>
    </div>
  );
}
