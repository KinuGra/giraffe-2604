"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { ColumnDef } from "@/lib/database-api";
import { Key, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface InsertRowDialogProps {
  columns: ColumnDef[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (values: Record<string, unknown>) => Promise<void>;
}

export function InsertRowDialog({
  columns,
  open,
  onOpenChange,
  onInsert,
}: InsertRowDialogProps) {
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setFormValues({});
      setError(null);
    }
  }, [open]);

  const hasAutoDefault = (col: ColumnDef) =>
    col.isPrimaryKey && col.default != null;

  const handleSubmit = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const values: Record<string, unknown> = {};
      for (const col of columns) {
        if (hasAutoDefault(col)) continue;
        const raw = formValues[col.name];
        if (raw === undefined || raw === "") {
          if (col.nullable || col.default != null) continue;
        }
        if (raw === "") {
          if (col.nullable) {
            values[col.name] = null;
            continue;
          }
        }
        if (col.type === "bool" || col.type === "boolean") {
          values[col.name] = raw === "true";
        } else if (
          col.type === "int4" ||
          col.type === "int8" ||
          col.type === "int2" ||
          col.type === "float4" ||
          col.type === "float8" ||
          col.type === "numeric"
        ) {
          values[col.name] = Number(raw);
        } else {
          values[col.name] = raw;
        }
      }
      await onInsert(values);
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Insert failed");
    } finally {
      setSaving(false);
    }
  }, [columns, formValues, onInsert, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Insert row</DialogTitle>
          <DialogDescription>
            Fill in the fields below. Columns with defaults can be left blank.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {columns.map((col) => {
            const auto = hasAutoDefault(col);
            return (
              <div key={col.name} className="space-y-1">
                <label
                  htmlFor={`insert-${col.name}`}
                  className="flex items-center gap-1.5 text-xs"
                >
                  <span className="font-mono text-foreground">{col.name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {col.type}
                  </span>
                  {col.isPrimaryKey && (
                    <Key className="size-3 text-amber-400" />
                  )}
                  {col.default != null && (
                    <span className="text-[10px] text-muted-foreground">
                      default: {col.default}
                    </span>
                  )}
                </label>
                <Input
                  id={`insert-${col.name}`}
                  disabled={auto}
                  placeholder={
                    auto
                      ? `(auto: ${col.default})`
                      : col.nullable
                        ? "NULL"
                        : ""
                  }
                  value={auto ? "" : (formValues[col.name] ?? "")}
                  onChange={(e) =>
                    setFormValues((prev) => ({
                      ...prev,
                      [col.name]: e.target.value,
                    }))
                  }
                  className="h-7 text-xs font-mono"
                />
              </div>
            );
          })}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
            Insert
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
