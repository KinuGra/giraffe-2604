"use client";

import { CopyButton } from "@/components/copy-button";
import { cn } from "@/lib/utils";

function highlight(code: string): string {
  const esc = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return esc
    .replace(/(\/\/[^\n]*)/g, '<span class="text-muted-foreground">$1</span>')
    .replace(
      /('[^']*'|"[^"]*"|`[^`]*`)/g,
      '<span class="text-brand-300">$1</span>',
    )
    .replace(
      /\b(import|from|const|let|var|function|await|async|return|new|if|else|for|in|of|export|default)\b/g,
      '<span class="text-violet-400">$1</span>',
    )
    .replace(
      /\b(true|false|null|undefined)\b/g,
      '<span class="text-amber-400">$1</span>',
    );
}

export function CodeBlock({ code, className }: { code: string; className?: string }) {
  return (
    <div className={cn("relative rounded-md border border-border bg-panel-2 group", className)}>
      <pre className="px-3 py-3 text-[11.5px] font-mono leading-[1.65] overflow-x-auto">
        <code dangerouslySetInnerHTML={{ __html: highlight(code) }} />
      </pre>
      <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <CopyButton value={code} />
      </div>
    </div>
  );
}
