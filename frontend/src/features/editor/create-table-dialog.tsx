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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { databaseApi } from "@/lib/database-api";
import { Loader2, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const PG_TYPES = [
  "text",
  "int4",
  "int8",
  "uuid",
  "boolean",
  "timestamptz",
  "float8",
  "jsonb",
];

interface ColumnEntry {
  id: number;
  name: string;
  type: string;
  nullable: boolean;
  isPrimaryKey: boolean;
  defaultValue: string;
}

let nextId = 1;

function makeDefaultIdColumn(): ColumnEntry {
  return {
    id: nextId++,
    name: "id",
    type: "uuid",
    nullable: false,
    isPrimaryKey: true,
    defaultValue: "gen_random_uuid()",
  };
}

interface CreateTableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schema: string;
  onCreate: () => Promise<void>;
}

export function CreateTableDialog({
  open,
  onOpenChange,
  schema,
  onCreate,
}: CreateTableDialogProps) {
  const [tableName, setTableName] = useState("");
  const [columnEntries, setColumnEntries] = useState<ColumnEntry[]>([
    makeDefaultIdColumn(),
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTableName("");
      setColumnEntries([makeDefaultIdColumn()]);
      setError(null);
    }
  }, [open]);

  const addColumn = useCallback(() => {
    setColumnEntries((prev) => [
      ...prev,
      {
        id: nextId++,
        name: "",
        type: "text",
        nullable: true,
        isPrimaryKey: false,
        defaultValue: "",
      },
    ]);
  }, []);

  const removeColumn = useCallback((id: number) => {
    setColumnEntries((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const updateColumn = useCallback(
    (id: number, field: keyof ColumnEntry, value: string | boolean) => {
      setColumnEntries((prev) =>
        prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
      );
    },
    [],
  );

  const handleSubmit = useCallback(async () => {
    if (!tableName.trim()) {
      setError("Table name is required");
      return;
    }
    if (columnEntries.length === 0) {
      setError("At least one column is required");
      return;
    }
    for (const col of columnEntries) {
      if (!col.name.trim()) {
        setError("All columns must have a name");
        return;
      }
    }

    setSaving(true);
    setError(null);
    try {
      const columns = columnEntries.map((c) => ({
        name: c.name,
        type: c.type,
        default_value: c.defaultValue || undefined,
        nullable: c.nullable,
        is_primary_key: c.isPrimaryKey,
      }));
      await databaseApi.createTable(schema, tableName.trim(), columns);
      await onCreate();
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create table");
    } finally {
      setSaving(false);
    }
  }, [tableName, columnEntries, schema, onCreate, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create table</DialogTitle>
          <DialogDescription>
            Define the table name and columns.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <label
              htmlFor="create-table-name"
              className="text-xs font-medium text-foreground"
            >
              Table name
            </label>
            <Input
              id="create-table-name"
              placeholder="e.g. posts"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              className="h-7 text-xs font-mono"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground">
                Columns
              </span>
              <Button
                variant="outline"
                size="xs"
                onClick={addColumn}
                type="button"
              >
                Add column
              </Button>
            </div>

            {columnEntries.map((col) => (
              <div
                key={col.id}
                className="flex items-center gap-2 rounded-md border p-2"
              >
                <Input
                  placeholder="name"
                  value={col.name}
                  onChange={(e) => updateColumn(col.id, "name", e.target.value)}
                  className="h-7 w-28 text-xs font-mono"
                />
                <Select
                  value={col.type}
                  onValueChange={(v) => {
                    if (v) updateColumn(col.id, "type", v);
                  }}
                >
                  <SelectTrigger size="sm" className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PG_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="default"
                  value={col.defaultValue}
                  onChange={(e) =>
                    updateColumn(col.id, "defaultValue", e.target.value)
                  }
                  className="h-7 w-36 text-xs font-mono"
                />
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Switch
                    size="sm"
                    checked={col.nullable}
                    onCheckedChange={(v) => updateColumn(col.id, "nullable", v)}
                  />
                  Null
                </span>
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Switch
                    size="sm"
                    checked={col.isPrimaryKey}
                    onCheckedChange={(v) =>
                      updateColumn(col.id, "isPrimaryKey", v)
                    }
                  />
                  PK
                </span>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => removeColumn(col.id)}
                  type="button"
                >
                  <Trash2 className="size-3 text-muted-foreground" />
                </Button>
              </div>
            ))}
          </div>
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
            Create table
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
