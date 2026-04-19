"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FunctionInfo } from "@/lib/functions-api";
import { cn } from "@/lib/utils";
import { Plus, Search } from "lucide-react";
import { useState } from "react";

interface FunctionsListProps {
  functions: FunctionInfo[];
  selected: string;
  onSelect: (id: string) => void;
  onNew: () => void;
}

export function FunctionsList({
  functions,
  selected,
  onSelect,
  onNew,
}: FunctionsListProps) {
  const [query, setQuery] = useState("");

  const filtered = functions.filter((fn) =>
    fn.name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="flex w-[280px] flex-col border-r bg-panel">
      <div className="flex items-center justify-between px-3 py-3 border-b">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Server Functions</span>
          <Badge variant="secondary" className="text-[11px] px-1.5">
            {functions.length}
          </Badge>
        </div>
      </div>

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

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <p className="px-3 py-4 text-xs text-muted-foreground text-center">
            No functions yet
          </p>
        )}
        {filtered.map((fn) => {
          const isSelected = fn.id === selected;
          return (
            <button
              key={fn.id}
              type="button"
              onClick={() => onSelect(fn.id)}
              className={cn(
                "flex w-full flex-col gap-0.5 px-3 py-2 text-left transition-colors hover:bg-muted/50",
                isSelected && "bg-primary/10 border-l-2 border-primary",
                !isSelected && "border-l-2 border-transparent",
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                {fn.status === "deactivated" ? (
                  <span className="text-xs shrink-0 leading-none">💀</span>
                ) : (
                  <span className="size-2 rounded-full shrink-0 bg-brand-400" />
                )}
                <span
                  className={cn(
                    "text-sm font-semibold truncate",
                    isSelected && "text-primary",
                    fn.status === "deactivated" &&
                      "line-through text-muted-foreground",
                  )}
                >
                  {fn.name}
                </span>
              </div>
              <div className="flex items-center gap-3 pl-4 text-[11px] text-muted-foreground">
                <span className="font-mono">{fn.runtime}</span>
                <span>{new Date(fn.createdAt).toLocaleDateString()}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="border-t p-3">
        <Button
          variant="outline"
          className="w-full gap-1.5 text-xs h-7"
          onClick={onNew}
        >
          <Plus className="size-3" />
          New function
        </Button>
      </div>
    </div>
  );
}
