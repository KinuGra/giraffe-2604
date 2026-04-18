"use client";

import { useState } from "react";
import { Search, RefreshCw, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { functionLogs } from "@/lib/mock-data";

const levelColors: Record<string, string> = {
  info: "text-blue-400",
  warn: "text-amber-400",
  error: "text-destructive",
};

const levelBg: Record<string, string> = {
  error: "bg-destructive/5",
};

interface LiveLogsProps {
  fnName: string;
}

export function LiveLogs({ fnName }: LiveLogsProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "info" | "warn" | "error">("all");
  const [timeRange, setTimeRange] = useState("1h");

  const filtered = functionLogs.filter((log) => {
    if (filter !== "all" && log.level !== filter) return false;
    if (query && !log.msg.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex flex-col rounded-lg border bg-panel overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b px-3 py-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-7 pl-7 text-xs"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex items-center rounded-md border bg-muted/50 p-0.5">
          {(["all", "info", "warn", "error"] as const).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setFilter(level)}
              className={cn(
                "px-2 py-0.5 text-[11px] font-medium rounded-sm transition-colors capitalize",
                filter === level
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {level === "all" ? "All" : level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          ))}
        </div>

        {/* Time range */}
        <Select value={timeRange} onValueChange={(v) => v && setTimeRange(v)}>
          <SelectTrigger size="sm" className="w-[72px] text-xs h-7">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1h">1h</SelectItem>
            <SelectItem value="24h">24h</SelectItem>
            <SelectItem value="7d">7d</SelectItem>
          </SelectContent>
        </Select>

        {/* Live indicator */}
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-brand-400" />
          </span>
          <span className="text-brand-400 font-medium">Live</span>
        </div>

        <Button variant="ghost" size="icon-xs">
          <RefreshCw className="size-3" />
        </Button>
        <Button variant="ghost" size="icon-xs">
          <Download className="size-3" />
        </Button>
      </div>

      {/* Log entries */}
      <div className="flex-1 overflow-y-auto max-h-[480px]">
        {filtered.map((log, i) => (
          <div
            key={i}
            className={cn(
              "flex items-start gap-3 px-3 py-1.5 font-mono text-[11.5px] leading-[1.6] border-b border-border/50 hover:bg-muted/30",
              levelBg[log.level],
            )}
          >
            <span className="text-muted-foreground shrink-0 w-[88px]">
              {log.t}
            </span>
            <span
              className={cn(
                "uppercase font-semibold shrink-0 w-[44px]",
                levelColors[log.level],
              )}
            >
              {log.level}
            </span>
            <span className="text-brand-400 shrink-0">{log.fn}</span>
            <span className="flex-1 min-w-0">{log.msg}</span>
            {log.meta && (
              <span className="text-muted-foreground truncate max-w-[200px] shrink-0">
                {log.meta}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t px-3 py-1.5 text-[11px] text-muted-foreground">
        <span>
          {filtered.length} entries &middot;{" "}
          <span className="text-brand-400">streaming</span>
        </span>
        <span className="font-mono">tail -f edge/{fnName}</span>
      </div>
    </div>
  );
}
