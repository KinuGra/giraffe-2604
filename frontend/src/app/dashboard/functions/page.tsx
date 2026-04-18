"use client";

import { useState } from "react";
import {
  SquareFunction,
  Play,
  History,
  MoreHorizontal,
  Lock,
  Eye,
  EyeOff,
  Plus,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  Timer,
  GitBranch,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { FunctionsList } from "@/features/functions/functions-list";
import { CodeViewer } from "@/features/functions/code-viewer";
import { LiveLogs } from "@/features/functions/live-logs";
import { FunctionSettings } from "@/features/functions/function-settings";
import { functions } from "@/lib/mock-data";

const statusVariant: Record<string, "default" | "destructive" | "secondary"> = {
  active: "default",
  error: "destructive",
  paused: "secondary",
};

const secrets = [
  { key: "GIRAFFE_URL", value: "https://kf82hs9.giraffe.app" },
  { key: "GIRAFFE_SERVICE_KEY", value: "eyJhbGciOiJIUzI1NiIs..." },
  { key: "STRIPE_SECRET_KEY", value: "sk_live_51N2x3Y4Z..." },
  { key: "RESEND_API_KEY", value: "re_9k8j7hG6fE5d..." },
];

const miniStats = [
  { label: "Invocations", icon: Activity, key: "invocations" as const },
  { label: "Errors", icon: AlertTriangle, key: "errors" as const },
  { label: "p95 Latency", icon: Timer, key: "p95" as const },
  { label: "Version", icon: GitBranch, key: "version" as const },
];

export default function FunctionsPage() {
  const [selected, setSelected] = useState("send-invoice");
  const [activeTab, setActiveTab] = useState("code");

  const fn = functions.find((f) => f.name === selected) ?? functions[0];

  return (
    <div className="flex h-full">
      {/* Left panel */}
      <FunctionsList selected={selected} onSelect={setSelected} />

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-6 space-y-6">
          {/* Function header */}
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
                  <Badge variant={statusVariant[fn.status]}>
                    {fn.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                  <span className="font-mono">{fn.runtime}</span>
                  <span>&middot;</span>
                  <span>Deployed {fn.lastDeploy}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" className="gap-1.5">
                <Play className="size-3" />
                Invoke
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5">
                <History className="size-3" />
                History
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
                  <DropdownMenuItem>Rename</DropdownMenuItem>
                  <DropdownMenuItem>Restart</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive">
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Mini stats */}
          <div className="grid grid-cols-4 gap-3">
            {miniStats.map((stat) => {
              const Icon = stat.icon;
              let value: string;
              let sub: string;
              if (stat.key === "invocations") {
                value = fn.invocations.toLocaleString();
                sub = "total";
              } else if (stat.key === "errors") {
                value = String(fn.errors);
                sub = fn.errors === 0 ? "none" : `${((fn.errors / fn.invocations) * 100).toFixed(2)}% rate`;
              } else if (stat.key === "p95") {
                value = fn.p95;
                sub = "latency";
              } else {
                value = fn.version;
                sub = `deployed ${fn.lastDeploy}`;
              }

              return (
                <Card key={stat.key} size="sm">
                  <CardContent className="py-2">
                    <div className="flex items-center gap-2">
                      <Icon className="size-3.5 text-muted-foreground" />
                      <span className="text-[11px] text-muted-foreground">
                        {stat.label}
                      </span>
                    </div>
                    <p className="text-lg font-semibold font-mono mt-1">
                      {value}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{sub}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList variant="line">
              <TabsTrigger value="code">Code</TabsTrigger>
              <TabsTrigger value="logs">Logs</TabsTrigger>
              <TabsTrigger value="invocations">Invocations</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="code">
              <div className="flex gap-4 mt-4">
                <div className="flex-1 min-w-0">
                  <CodeViewer />
                </div>
                {/* Secrets sidebar */}
                <div className="w-[240px] shrink-0">
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <Lock className="size-3.5 text-muted-foreground" />
                        <CardTitle className="text-xs">Secrets</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {secrets.map((s) => (
                        <SecretRow key={s.key} name={s.key} value={s.value} />
                      ))}
                      <Button
                        variant="outline"
                        size="xs"
                        className="w-full gap-1 mt-2 text-[11px]"
                      >
                        <Plus className="size-3" />
                        Add secret
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="logs">
              <div className="mt-4">
                <LiveLogs fnName={fn.name} />
              </div>
            </TabsContent>

            <TabsContent value="invocations">
              <div className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">
                      Invocations (24h)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Simple bar chart */}
                    <div className="flex items-end gap-1 h-[160px]">
                      {Array.from({ length: 24 }, (_, i) => {
                        const height =
                          Math.sin(i * 0.5 + 1) * 0.4 +
                          Math.cos(i * 0.3 + 2) * 0.3 +
                          0.5;
                        return (
                          <div
                            key={i}
                            className="flex-1 bg-primary/20 hover:bg-primary/40 rounded-t transition-colors"
                            style={{
                              height: `${Math.max(8, height * 100)}%`,
                            }}
                          />
                        );
                      })}
                    </div>
                    <div className="flex justify-between mt-2 text-[10px] text-muted-foreground font-mono">
                      <span>00:00</span>
                      <span>06:00</span>
                      <span>12:00</span>
                      <span>18:00</span>
                      <span>now</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="settings">
              <div className="mt-4 max-w-2xl">
                <FunctionSettings />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function SecretRow({ name, value }: { name: string; value: string }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="flex items-center justify-between gap-2 rounded-md border bg-panel-2 px-2 py-1.5">
      <div className="min-w-0">
        <p className="text-[11px] font-mono font-medium truncate">{name}</p>
        <p className="text-[10px] font-mono text-muted-foreground truncate">
          {visible ? value : "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"}
        </p>
      </div>
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        className="text-muted-foreground hover:text-foreground shrink-0"
      >
        {visible ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
      </button>
    </div>
  );
}
