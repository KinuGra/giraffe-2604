import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Copy } from "lucide-react";

const methodBg: Record<string, string> = {
  GET: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  POST: "bg-brand-500/15 text-brand-400 border-brand-500/20",
  PATCH: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  DELETE: "bg-destructive/15 text-destructive border-destructive/20",
};

interface RestReferenceProps {
  route: { method: string; path: string; desc: string; description?: string };
}

export function RestReference({ route }: RestReferenceProps) {
  return (
    <div className="space-y-4">
      {/* Method + path bar */}
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-bold font-mono uppercase",
            methodBg[route.method] ?? "bg-muted text-foreground",
          )}
        >
          {route.method}
        </span>
        <code className="text-[14px] font-mono text-foreground">
          {route.path}
        </code>
        <Button
          variant="ghost"
          size="icon-xs"
          className="text-muted-foreground"
        >
          <Copy className="size-3" />
        </Button>
      </div>

      {/* Title */}
      <h1 className="font-heading text-xl font-semibold">{route.desc}</h1>

      {/* Description */}
      {route.description && (
        <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
          {route.description}
        </p>
      )}
    </div>
  );
}
