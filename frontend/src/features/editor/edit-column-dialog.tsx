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
import { Loader2 } from "lucide-react";
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

interface EditColumnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  column: {
    name: string;
    type: string;
    default: string | null;
    nullable: boolean;
    isPrimaryKey: boolean;
    isUnique: boolean;
  } | null;
  tableName: string;
  schema: string;
  onSave: () => Promise<void>;
}

export function EditColumnDialog({
  open,
  onOpenChange,
  column,
  tableName,
  schema,
  onSave,
}: EditColumnDialogProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState("text");
  const [defaultValue, setDefaultValue] = useState("");
  const [nullable, setNullable] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && column) {
      setName(column.name);
      setType(column.type);
      setDefaultValue(column.default ?? "");
      setNullable(column.nullable);
      setError(null);
    }
  }, [open, column]);

  const handleSubmit = useCallback(async () => {
    if (!column) return;
    if (!name.trim()) {
      setError("Column name is required");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await databaseApi.updateColumn(tableName, column.name, schema, {
        new_name: name.trim() !== column.name ? name.trim() : undefined,
        new_type: type !== column.type ? type : undefined,
        new_default:
          defaultValue !== (column.default ?? "") ? defaultValue : undefined,
        set_nullable: true,
        nullable,
      });
      await onSave();
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update column");
    } finally {
      setSaving(false);
    }
  }, [
    column,
    name,
    type,
    defaultValue,
    nullable,
    tableName,
    schema,
    onSave,
    onOpenChange,
  ]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit column</DialogTitle>
          <DialogDescription>
            Modify the column definition for{" "}
            <span className="font-mono">{column?.name}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <label
              htmlFor="edit-col-name"
              className="text-xs font-medium text-foreground"
            >
              Name
            </label>
            <Input
              id="edit-col-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-7 text-xs font-mono"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="edit-col-type"
              className="text-xs font-medium text-foreground"
            >
              Type
            </label>
            <Select
              value={type}
              onValueChange={(v) => {
                if (v) setType(v);
              }}
            >
              <SelectTrigger size="sm" className="w-full">
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
          </div>

          <div className="space-y-1">
            <label
              htmlFor="edit-col-default"
              className="text-xs font-medium text-foreground"
            >
              Default value
            </label>
            <Input
              id="edit-col-default"
              value={defaultValue}
              onChange={(e) => setDefaultValue(e.target.value)}
              placeholder="none"
              className="h-7 text-xs font-mono"
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch
              size="sm"
              checked={nullable}
              onCheckedChange={setNullable}
            />
            <span className="text-xs text-foreground">Nullable</span>
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
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
