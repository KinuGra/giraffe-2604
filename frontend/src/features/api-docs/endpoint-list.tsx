"use client";

import { Input } from "@/components/ui/input";
import { apiRoutes } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { useState } from "react";

const methodColor: Record<string, string> = {
  GET: "text-blue-400",
  POST: "text-brand-400",
  PATCH: "text-amber-400",
  DELETE: "text-destructive",
};

interface EndpointListProps {
  selected: number;
  onSelect: (idx: number) => void;
}

export function EndpointList({ selected, onSelect }: EndpointListProps) {
  const [query, setQuery] = useState("");

  const filtered = apiRoutes
    .map((route, idx) => ({ ...route, idx }))
    .filter(
      (route) =>
        route.path.toLowerCase().includes(query.toLowerCase()) ||
        route.desc.toLowerCase().includes(query.toLowerCase()),
    );

  return (
    <div className="flex w-[300px] flex-col border-r bg-panel">
      {/* Header */}
      <div className="px-3 py-3 border-b">
        <p className="text-sm font-medium">API Reference</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Auto-generated from your schema
        </p>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search endpoints..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-7 pl-7 text-xs"
          />
        </div>
      </div>

      {/* Group label */}
      <div className="px-3 pt-3 pb-1">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Tables
        </span>
      </div>

      {/* Endpoint list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.map((route) => {
          const isSelected = route.idx === selected;
          return (
            <button
              key={route.idx}
              type="button"
              onClick={() => onSelect(route.idx)}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-1.5 text-left transition-colors hover:bg-muted/50",
                isSelected && "bg-primary/10",
              )}
            >
              <span
                className={cn(
                  "text-[11px] font-semibold font-mono uppercase w-[52px] shrink-0",
                  methodColor[route.method],
                )}
              >
                {route.method}
              </span>
              <span className="text-[12px] font-mono text-foreground truncate">
                {route.path}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
