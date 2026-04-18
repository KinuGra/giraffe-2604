"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import type { ColumnDef } from "@/lib/database-api";
import { Key, Loader2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

interface RowInspectorProps {
  columns: ColumnDef[];
  rows: Record<string, unknown>[];
  rowIndex: number;
  onClose: () => void;
  onSave: (
    pk: Record<string, unknown>,
    values: Record<string, unknown>,
  ) => Promise<void>;
  onDelete: (pk: Record<string, unknown>) => Promise<void>;
}

export function RowInspector({
  columns,
  rows,
  rowIndex,
  onClose,
  onSave,
  onDelete,
}: RowInspectorProps) {
  const row = rows[rowIndex];
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!row) return;
    const vals: Record<string, string> = {};
    for (const col of columns) {
      const v = row[col.name];
      vals[col.name] = v === null || v === undefined ? "" : String(v);
    }
    setEditValues(vals);
    setConfirmDelete(false);
  }, [row, columns]);

  const hasPk = useMemo(
    () => columns.some((c) => c.isPrimaryKey),
    [columns],
  );

  const getPk = useCallback(() => {
    const pk: Record<string, unknown> = {};
    for (const col of columns) {
      if (col.isPrimaryKey) pk[col.name] = row[col.name];
    }
    return pk;
  }, [columns, row]);

  const hasChanges = useMemo(() => {
    if (!row) return false;
    return columns.some((col) => {
      if (col.isPrimaryKey) return false;
      const original =
        row[col.name] === null || row[col.name] === undefined
          ? ""
          : String(row[col.name]);
      return editValues[col.name] !== original;
    });
  }, [columns, row, editValues]);

  const handleSave = useCallback(async () => {
    if (!row || !hasPk) return;
    setSaving(true);
    try {
      const changedValues: Record<string, unknown> = {};
      for (const col of columns) {
        if (col.isPrimaryKey) continue;
        const original =
          row[col.name] === null || row[col.name] === undefined
            ? ""
            : String(row[col.name]);
        if (editValues[col.name] !== original) {
          const raw = editValues[col.name];
          if (raw === "" && col.nullable) {
            changedValues[col.name] = null;
          } else {
            changedValues[col.name] = raw;
          }
        }
      }
      await onSave(getPk(), changedValues);
    } finally {
      setSaving(false);
    }
  }, [row, hasPk, columns, editValues, onSave, getPk]);

  const handleDelete = useCallback(async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    try {
      await onDelete(getPk());
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }, [confirmDelete, onDelete, getPk]);

  if (!row) return null;

  return (
    <div className="flex w-[340px] shrink-0 flex-col border-l bg-panel">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="min-w-0">
          <h3 className="text-sm font-medium">Edit row</h3>
          <p className="truncate font-mono text-[11px] text-muted-foreground">
            {String(row.id ?? "")}
          </p>
        </div>
        <Button variant="ghost" size="icon-xs" onClick={onClose}>
          <X className="size-3.5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {columns.map((col) => (
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
              readOnly={col.isPrimaryKey}
              value={editValues[col.name] ?? ""}
              placeholder={
                row[col.name] === null || row[col.name] === undefined
                  ? "NULL"
                  : ""
              }
              onChange={(e) =>
                setEditValues((prev) => ({
                  ...prev,
                  [col.name]: e.target.value,
                }))
              }
              className={`h-7 text-xs font-mono ${col.isPrimaryKey ? "read-only:bg-muted/40" : ""}`}
            />
          </div>
        ))}
      </div>

      <Separator />
      <div className="flex items-center justify-between px-4 py-3">
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          disabled={!hasPk || deleting}
          onClick={handleDelete}
        >
          {deleting && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
          {confirmDelete ? "Confirm?" : "Delete"}
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!hasChanges || !hasPk || saving}
            onClick={handleSave}
          >
            {saving && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
