import { CodeBlock } from "@/components/code-block";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Play } from "lucide-react";

const sampleQuery = `SELECT
  p.id,
  p.email,
  p.display_name,
  p.role,
  p.is_active,
  p.created_at
FROM public.profiles p
WHERE p.is_active = true
ORDER BY p.created_at DESC
LIMIT 25;`;

export function SqlTab() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle>SQL Editor</CardTitle>
            <CardDescription>
              Run arbitrary SQL against your database
            </CardDescription>
          </div>
          <Button size="sm" className="gap-1.5">
            <Play className="size-3.5" />
            Run
            <kbd className="ml-1 inline-flex h-5 items-center rounded border border-border bg-muted px-1.5 text-[10px] font-mono font-normal text-muted-foreground">
              Cmd+Enter
            </kbd>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <CodeBlock code={sampleQuery} />
        <p className="text-xs font-mono text-brand-400">2 rows &middot; 8ms</p>
      </CardContent>
    </Card>
  );
}
