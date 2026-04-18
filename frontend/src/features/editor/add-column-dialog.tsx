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

interface AddColumnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableName: string;
  schema: string;
  onSave: () => Promise<void>;
}

export function AddColumnDialog({
  open,
  onOpenChange,
  tableName,
  schema,
  onSave,
}: AddColumnDialogProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState("text");
  const [defaultValue, setDefaultValue] = useState("");
  const [nullable, setNullable] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName("");
      setType("text");
      setDefaultValue("");
      setNullable(true);
      setError(null);
    }
  }, [open]);

  const handleSubmit = useCallback(async () => {
    if (!name.trim()) {
      setError("Column name is required");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await databaseApi.addColumn(tableName, schema, {
        name: name.trim(),
        type,
        default_value: defaultValue || undefined,
        nullable,
      });
      await onSave();
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add column");
    } finally {
      setSaving(false);
    }
  }, [
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
          <DialogTitle>Add column</DialogTitle>
          <DialogDescription>
            Add a new column to <span className="font-mono">{tableName}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <label
              htmlFor="add-col-name"
              className="text-xs font-medium text-foreground"
            >
              Name
            </label>
            <Input
              id="add-col-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. email"
              className="h-7 text-xs font-mono"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="add-col-type"
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
              htmlFor="add-col-default"
              className="text-xs font-medium text-foreground"
            >
              Default value
            </label>
            <Input
              id="add-col-default"
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
            Add column
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
