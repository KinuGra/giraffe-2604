"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Bell, Rocket, Search, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";

interface TopBarProps {
  onOpenPalette: () => void;
}

const routeLabels: Record<string, string[]> = {
  "/dashboard/home": ["Project", "Home"],
  "/dashboard/editor": ["Database", "Table Editor", "public.profiles"],
  "/dashboard/functions": ["Edge Functions", "send-invoice"],
  "/dashboard/api": ["API Docs", "REST"],
  "/dashboard/settings": ["Settings", "General"],
};

export function TopBar({ onOpenPalette }: TopBarProps) {
  const pathname = usePathname();
  const crumbs = routeLabels[pathname] ?? ["Project"];

  return (
    <header className="h-12 shrink-0 border-b border-border bg-background/80 backdrop-blur flex items-center px-4 gap-3 sticky top-0 z-30">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-[12.5px] min-w-0">
        {crumbs.map((c, i) => (
          <span key={c} className="flex items-center gap-1.5">
            {i > 0 && (
              <span className="text-muted-foreground/40 text-[10px]">/</span>
            )}
            <span
              className={cn(
                "truncate",
                i === crumbs.length - 1
                  ? "text-foreground font-medium"
                  : "text-muted-foreground",
              )}
            >
              {c}
            </span>
          </span>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Search / CMD+K */}
        <button
          type="button"
          onClick={onOpenPalette}
          className="flex items-center gap-2 h-7 w-[220px] pl-2.5 pr-1.5 rounded-md border border-border bg-card hover:bg-accent text-muted-foreground transition-colors"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="flex-1 text-left text-[12px]">
            Search or jump to…
          </span>
          <kbd className="inline-flex items-center justify-center h-[18px] min-w-[18px] px-1 rounded border border-border bg-panel-hi text-[10.5px] font-mono text-muted-foreground">
            ⌘
          </kbd>
          <kbd className="inline-flex items-center justify-center h-[18px] min-w-[18px] px-1 rounded border border-border bg-panel-hi text-[10.5px] font-mono text-muted-foreground">
            K
          </kbd>
        </button>

        {/* Changelog */}
        <Tooltip>
          <TooltipTrigger className="inline-flex items-center justify-center h-8 w-8 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer">
            <Sparkles className="h-3.5 w-3.5" />
          </TooltipTrigger>
          <TooltipContent>Changelog</TooltipContent>
        </Tooltip>

        {/* Notifications */}
        <Tooltip>
          <TooltipTrigger className="inline-flex items-center justify-center h-8 w-8 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors relative cursor-pointer">
            <Bell className="h-3.5 w-3.5" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-brand-400" />
          </TooltipTrigger>
          <TooltipContent>Notifications</TooltipContent>
        </Tooltip>

        {/* Deploy */}
        <Button size="sm" variant="outline" className="h-7">
          <Rocket className="h-3 w-3" /> Deploy
        </Button>
      </div>
    </header>
  );
}
