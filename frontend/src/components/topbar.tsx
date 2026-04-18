"use client";

import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

const routeLabels: Record<string, string[]> = {
  "/dashboard/home": ["Project", "Home"],
  "/dashboard/editor": ["Database", "Table Editor"],
  "/dashboard/functions": ["Edge Functions"],
  "/dashboard/api": ["API Docs", "REST"],
  "/dashboard/settings": ["Settings", "General"],
};

export function TopBar() {
  const pathname = usePathname();
  const crumbs = routeLabels[pathname] ?? ["Project"];

  return (
    <header className="h-12 shrink-0 border-b border-border bg-background/80 backdrop-blur flex items-center px-4 gap-3 sticky top-0 z-30">
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
    </header>
  );
}
