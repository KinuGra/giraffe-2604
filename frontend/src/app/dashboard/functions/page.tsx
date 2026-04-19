"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { CodeViewer } from "@/features/functions/code-viewer";
import { FunctionSettings } from "@/features/functions/function-settings";
import { FunctionsList } from "@/features/functions/functions-list";
import { LiveLogs } from "@/features/functions/live-logs";
import {
  type ExecuteResult,
  type FunctionInfo,
  functionsApi,
} from "@/lib/functions-api";
import { cn } from "@/lib/utils";
import {
  Activity,
  AlertTriangle,
  GitBranch,
  MoreHorizontal,
  Play,
  SquareFunction,
  Timer,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export default function FunctionsPage() {
  const [functions, setFunctions] = useState<FunctionInfo[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [activeTab, setActiveTab] = useState("code");
  const [executing, setExecuting] = useState(false);
  const [execResult, setExecResult] = useState<ExecuteResult | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRuntime, setNewRuntime] = useState("python3.12");
  const [newCode, setNewCode] = useState('print("hello world")');
  const [creating, setCreating] = useState(false);

  const fetchList = useCallback(async () => {
    try {
      const list = await functionsApi.list();
      setFunctions(list);
      setSelected((prev) =>
        prev === "" && list.length > 0 ? list[0].id : prev,
      );
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const fn = functions.find((f) => f.id === selected);

  const handleInvoke = async () => {
    if (!fn) return;
    setExecuting(true);
    setExecResult(null);
    setActiveTab("logs");
    try {
      const result = await functionsApi.execute(fn.id);
      setExecResult(result);
    } catch (e) {
      console.error(e);
    } finally {
      setExecuting(false);
    }
  };

  const handleSaveCode = async (code: string) => {
    if (!fn) return;
    const updated = await functionsApi.update(fn.id, { code });
    setFunctions((prev) =>
      prev.map((f) => (f.id === updated.id ? updated : f)),
    );
  };

  const handleDelete = async () => {
    if (!fn) return;
    if (!confirm(`Delete "${fn.name}"?`)) return;
    try {
      await functionsApi.delete(fn.id);
      setSelected("");
      setExecResult(null);
      await fetchList();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const created = await functionsApi.create(newName, newRuntime, newCode);
      setNewOpen(false);
      setNewName("");
      setNewCode('print("hello world")');
      await fetchList();
      setSelected(created.id);
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex h-full">
      <FunctionsList
        functions={functions}
        selected={selected}
        onSelect={(id) => {
          setSelected(id);
          setExecResult(null);
        }}
        onNew={() => setNewOpen(true)}
      />

      <div className="flex-1 overflow-y-auto">
        {!fn ? (
          <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
            {functions.length === 0
              ? "No functions yet — create one to get started"
              : "Select a function"}
          </div>
        ) : (
          <div className="max-w-5xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center size-9 rounded-lg bg-primary/10">
                  <SquareFunction className="size-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-heading font-semibold">
                      {fn.name}
                    </h1>
                    <Badge variant="default">active</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                    <span className="font-mono">{fn.runtime}</span>
                    <span>&middot;</span>
                    <span>
                      Created {new Date(fn.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={handleInvoke}
                  disabled={executing}
                >
                  <Play className="size-3" />
                  {executing ? "Running…" : "Invoke"}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button variant="outline" size="icon-sm">
                        <MoreHorizontal className="size-3.5" />
                      </Button>
                    }
                  />
                  <DropdownMenuContent align="end">
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={handleDelete}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Mini stats */}
            <div className="grid grid-cols-3 gap-3">
              <Card size="sm">
                <CardContent className="py-2">
                  <div className="flex items-center gap-2">
                    <Timer className="size-3.5 text-muted-foreground" />
                    <span className="text-[11px] text-muted-foreground">
                      Timeout
                    </span>
                  </div>
                  <p className="text-lg font-semibold font-mono mt-1">
                    {fn.timeoutSec}s
                  </p>
                </CardContent>
              </Card>
              <Card size="sm">
                <CardContent className="py-2">
                  <div className="flex items-center gap-2">
                    <Activity className="size-3.5 text-muted-foreground" />
                    <span className="text-[11px] text-muted-foreground">
                      Last exit code
                    </span>
                  </div>
                  <p
                    className={cn(
                      "text-lg font-semibold font-mono mt-1",
                      execResult &&
                        execResult.exitCode !== 0 &&
                        "text-destructive",
                    )}
                  >
                    {execResult != null ? execResult.exitCode : "—"}
                  </p>
                </CardContent>
              </Card>
              <Card size="sm">
                <CardContent className="py-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="size-3.5 text-muted-foreground" />
                    <span className="text-[11px] text-muted-foreground">
                      Duration
                    </span>
                  </div>
                  <p className="text-lg font-semibold font-mono mt-1">
                    {execResult != null ? `${execResult.durationMs}ms` : "—"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList variant="line">
                <TabsTrigger value="code">Code</TabsTrigger>
                <TabsTrigger value="logs">Output</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="code">
                <div className="mt-4">
                  <CodeViewer
                    code={fn.code}
                    runtime={fn.runtime}
                    onSave={handleSaveCode}
                  />
                </div>
              </TabsContent>

              <TabsContent value="logs">
                <div className="mt-4">
                  {executing && (
                    <p className="text-sm text-muted-foreground animate-pulse">
                      Executing…
                    </p>
                  )}
                  {execResult && (
                    <div className="space-y-3">
                      {execResult.output && (
                        <Card>
                          <CardHeader className="pb-1">
                            <CardTitle className="text-xs text-brand-400">
                              stdout
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <pre className="text-xs font-mono whitespace-pre-wrap">
                              {execResult.output}
                            </pre>
                          </CardContent>
                        </Card>
                      )}
                      {execResult.error && (
                        <Card>
                          <CardHeader className="pb-1">
                            <CardTitle className="text-xs text-destructive">
                              stderr
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <pre className="text-xs font-mono whitespace-pre-wrap text-destructive">
                              {execResult.error}
                            </pre>
                          </CardContent>
                        </Card>
                      )}
                      {!execResult.output && !execResult.error && (
                        <p className="text-sm text-muted-foreground">
                          No output
                        </p>
                      )}
                    </div>
                  )}
                  {!executing && !execResult && (
                    <p className="text-sm text-muted-foreground">
                      Press Invoke to run the function
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="settings">
                <div className="mt-4 max-w-2xl">
                  <FunctionSettings />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="max-w-lg">
          <DialogTitle>New Function</DialogTitle>
          <div className="space-y-4 mt-2">
            <div className="space-y-1">
              <label htmlFor="fn-name" className="text-xs font-medium">
                Name
              </label>
              <Input
                id="fn-name"
                placeholder="my-function"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="fn-runtime" className="text-xs font-medium">
                Runtime
              </label>
              <Select
                value={newRuntime}
                onValueChange={(v) => v && setNewRuntime(v)}
              >
                <SelectTrigger id="fn-runtime">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="python3.12">Python 3.12</SelectItem>
                  <SelectItem value="node20">Node.js 20</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label htmlFor="fn-code" className="text-xs font-medium">
                Code
              </label>
              <Textarea
                id="fn-code"
                className="font-mono text-xs min-h-[160px]"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setNewOpen(false)}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleCreate} disabled={creating}>
                {creating ? "Creating…" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
