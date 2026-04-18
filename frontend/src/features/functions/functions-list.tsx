"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { functions } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Plus, Search } from "lucide-react";
import { useState } from "react";

const statusColor: Record<string, string> = {
  active: "bg-brand-400",
  error: "bg-destructive",
  paused: "bg-muted-foreground",
};

interface FunctionsListProps {
  selected: string;
  onSelect: (name: string) => void;
}

export function FunctionsList({ selected, onSelect }: FunctionsListProps) {
  const [query, setQuery] = useState("");

  const filtered = functions.filter((fn) =>
    fn.name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="flex w-[280px] flex-col border-r bg-panel">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Functions</span>
          <Badge variant="secondary" className="text-[11px] px-1.5">
            {functions.length}
          </Badge>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search functions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-7 pl-7 text-xs"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.map((fn) => {
          const isSelected = fn.name === selected;
          return (
            <button
              key={fn.name}
              type="button"
              onClick={() => onSelect(fn.name)}
              className={cn(
                "flex w-full flex-col gap-0.5 px-3 py-2 text-left transition-colors hover:bg-muted/50",
                isSelected && "bg-primary/10 border-l-2 border-primary",
                !isSelected && "border-l-2 border-transparent",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={cn(
                      "size-2 rounded-full shrink-0",
                      statusColor[fn.status],
                    )}
                  />
                  <span
                    className={cn(
                      "text-sm truncate",
                      fn.status === "active" && "font-semibold",
                      isSelected && "text-primary",
                    )}
                  >
                    {fn.name}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-muted-foreground shrink-0">
                  {fn.version}
                </span>
              </div>
              <div className="flex items-center gap-3 pl-4 text-[11px] text-muted-foreground">
                <span>{fn.invocations.toLocaleString()} inv</span>
                <span>{fn.errors} err</span>
                <span>{fn.p95} p95</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom */}
      <div className="border-t p-3">
        <Button variant="outline" className="w-full gap-1.5 text-xs h-7">
          <Plus className="size-3" />
          Deploy new function
        </Button>
      </div>
    </div>
  );
}
