"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AddColumnDialog } from "@/features/editor/add-column-dialog";
import { EditColumnDialog } from "@/features/editor/edit-column-dialog";
import type { ColumnDef } from "@/lib/database-api";
import { databaseApi } from "@/lib/database-api";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

interface DefinitionTabProps {
  columns: ColumnDef[];
  tableName: string;
  schema: string;
  onColumnsChange: () => void;
}

export function DefinitionTab({
  columns,
  tableName,
  schema,
  onColumnsChange,
}: DefinitionTabProps) {
  const [editingColumn, setEditingColumn] = useState<ColumnDef | null>(null);
  const [addColumnOpen, setAddColumnOpen] = useState(false);

  const handleDeleteColumn = useCallback(
    async (col: ColumnDef) => {
      if (
        !window.confirm(`Delete column "${col.name}"? This cannot be undone.`)
      )
        return;
      try {
        await databaseApi.deleteColumn(tableName, col.name, schema);
        onColumnsChange();
        toast.success("Column deleted");
      } catch (e) {
        console.error(e);
        toast.error("Failed to delete column");
      }
    },
    [tableName, schema, onColumnsChange],
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Columns</CardTitle>
            <Button
              variant="outline"
              size="xs"
              className="gap-1"
              onClick={() => setAddColumnOpen(true)}
            >
              <Plus className="size-3" />
              Add column
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Default</TableHead>
                <TableHead>Nullable</TableHead>
                <TableHead>Flags</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {columns.map((col) => (
                <TableRow key={col.name}>
                  <TableCell className="font-mono text-foreground">
                    {col.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono font-normal">
                      {col.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground">
                    {col.default ?? <span className="italic">none</span>}
                  </TableCell>
                  <TableCell>
                    {col.nullable ? (
                      <span className="text-muted-foreground">YES</span>
                    ) : (
                      <span className="text-foreground">NO</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {col.isPrimaryKey && (
                        <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/20">
                          PK
                        </Badge>
                      )}
                      {col.isUnique && !col.isPrimaryKey && (
                        <Badge className="bg-sky-500/15 text-sky-400 border-sky-500/20">
                          UNIQUE
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => setEditingColumn(col)}
                      >
                        <Pencil className="size-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        disabled={col.isPrimaryKey}
                        onClick={() => handleDeleteColumn(col)}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <EditColumnDialog
        open={editingColumn != null}
        onOpenChange={(open) => {
          if (!open) setEditingColumn(null);
        }}
        column={editingColumn}
        tableName={tableName}
        schema={schema}
        onSave={async () => {
          onColumnsChange();
        }}
      />

      <AddColumnDialog
        open={addColumnOpen}
        onOpenChange={setAddColumnOpen}
        tableName={tableName}
        schema={schema}
        onSave={async () => {
          onColumnsChange();
        }}
      />
    </>
  );
}
