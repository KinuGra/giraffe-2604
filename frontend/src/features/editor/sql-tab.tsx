"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type SqlResponse, databaseApi } from "@/lib/database-api";
import { Loader2, Play } from "lucide-react";
import { useCallback, useState } from "react";

const sampleQuery = `SELECT
  table_name,
  table_schema
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name
LIMIT 25;`;

export function SqlTab() {
  const [query, setQuery] = useState(sampleQuery);
  const [result, setResult] = useState<SqlResponse | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRun = useCallback(async () => {
    if (!query.trim()) return;
    setRunning(true);
    setError(null);
    try {
      const resp = await databaseApi.executeSQL(query);
      setResult(resp);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Query failed");
      setResult(null);
    } finally {
      setRunning(false);
    }
  }, [query]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleRun();
      }
    },
    [handleRun],
  );

  const resultColumns =
    result?.rows && result.rows.length > 0 ? Object.keys(result.rows[0]) : [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle>SQL Editor</CardTitle>
              <CardDescription>
                Run arbitrary SQL against your database
              </CardDescription>
            </div>
            <Button
              size="sm"
              className="gap-1.5"
              onClick={handleRun}
              disabled={running}
            >
              {running ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Play className="size-3.5" />
              )}
              Run
              <kbd className="ml-1 inline-flex h-5 items-center rounded border border-border bg-muted px-1.5 text-[10px] font-mono font-normal text-muted-foreground">
                Cmd+Enter
              </kbd>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            className="w-full min-h-[160px] rounded-md border bg-muted/40 px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-y"
          />
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive/50">
          <CardContent className="py-3">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader className="py-3">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {result.rows.length > 0 && (
                <span>
                  <span className="text-brand-400">{result.rows.length}</span>{" "}
                  rows
                </span>
              )}
              {result.affectedRows > 0 && (
                <Badge variant="secondary">
                  {result.affectedRows} affected
                </Badge>
              )}
              <span>
                in{" "}
                <span className="text-brand-400">
                  {result.executionTimeMs.toFixed(1)}ms
                </span>
              </span>
            </div>
          </CardHeader>
          {resultColumns.length > 0 && (
            <CardContent className="overflow-auto p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    {resultColumns.map((col) => (
                      <TableHead key={col} className="font-mono text-xs">
                        {col}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.rows.map((row) => (
                    <TableRow key={JSON.stringify(row)}>
                      {resultColumns.map((col) => (
                        <TableCell key={col} className="font-mono text-xs">
                          {row[col] === null ? (
                            <span className="italic text-muted-foreground">
                              NULL
                            </span>
                          ) : (
                            String(row[col])
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}
