"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { profilesColumns, profilesRows } from "@/lib/mock-data";
import { Key, X } from "lucide-react";

interface RowInspectorProps {
  rowIndex: number;
  onClose: () => void;
}

export function RowInspector({ rowIndex, onClose }: RowInspectorProps) {
  const row = profilesRows[rowIndex];
  if (!row) return null;

  return (
    <div className="flex w-[340px] shrink-0 flex-col border-l bg-panel">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="min-w-0">
          <h3 className="text-sm font-medium">Edit row</h3>
          <p className="truncate font-mono text-[11px] text-muted-foreground">
            {String(row.id)}
          </p>
        </div>
        <Button variant="ghost" size="icon-xs" onClick={onClose}>
          <X className="size-3.5" />
        </Button>
      </div>

      {/* Fields */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {profilesColumns.map((col) => {
          const value = row[col.name];
          return (
            <div key={col.name} className="space-y-1">
              <label
                htmlFor={`field-${col.name}`}
                className="flex items-center gap-1.5 text-xs"
              >
                <span className="font-mono text-foreground">{col.name}</span>
                <span className="text-[10px] text-muted-foreground">
                  {col.type}
                </span>
                {col.isPrimaryKey && <Key className="size-3 text-amber-400" />}
              </label>
              <Input
                id={`field-${col.name}`}
                readOnly
                value={
                  value === null || value === undefined ? "" : String(value)
                }
                placeholder={value === null ? "NULL" : ""}
                className="h-7 text-xs font-mono read-only:bg-muted/40"
              />
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <Separator />
      <div className="flex items-center justify-between px-4 py-3">
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
        >
          Delete
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm">Save</Button>
        </div>
      </div>
    </div>
  );
}
