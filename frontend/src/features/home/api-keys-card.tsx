"use client";

import { CopyButton } from "@/components/copy-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { project } from "@/lib/mock-data";
import { Eye, EyeOff, Info, RotateCw } from "lucide-react";
import { useState } from "react";

function KeyRow({
  label,
  value,
  masked,
  badge,
  badgeVariant,
  onToggle,
  showToggle,
}: {
  label: string;
  value: string;
  masked: boolean;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "outline" | "destructive";
  onToggle?: () => void;
  showToggle?: boolean;
}) {
  const display = masked ? value.replace(/./g, "\u2022").slice(0, 48) : value;

  return (
    <div className="flex items-center gap-2 py-2">
      <div className="flex items-center gap-2 w-[110px] shrink-0">
        <span className="text-xs text-muted-foreground">{label}</span>
        {badge && (
          <Badge
            variant={badgeVariant ?? "secondary"}
            className="text-[10px] h-4 px-1.5"
          >
            {badge}
          </Badge>
        )}
      </div>
      <span className="flex-1 truncate font-mono text-xs">{display}</span>
      {showToggle && (
        <button
          type="button"
          onClick={onToggle}
          className="inline-flex items-center justify-center h-6 w-6 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          {masked ? (
            <Eye className="h-3.5 w-3.5" />
          ) : (
            <EyeOff className="h-3.5 w-3.5" />
          )}
        </button>
      )}
      <CopyButton value={value} />
    </div>
  );
}

export function ApiKeysCard() {
  const [showServiceRole, setShowServiceRole] = useState(false);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <CardTitle>Project API</CardTitle>
            <CardDescription>
              クライアントSDKに渡すエンドポイントとキーです
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon-sm">
            <RotateCw className="size-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col divide-y divide-border">
        <KeyRow label="Project URL" value={project.url} masked={false} />
        <KeyRow
          label="anon public"
          value={project.anonKey}
          masked={false}
          badge="public"
          badgeVariant="secondary"
        />
        <KeyRow
          label="service_role"
          value={project.serviceRoleKey}
          masked={!showServiceRole}
          badge="secret"
          badgeVariant="destructive"
          showToggle
          onToggle={() => setShowServiceRole((s) => !s)}
        />
      </CardContent>
      <CardFooter className="gap-2 text-xs text-muted-foreground">
        <Info className="size-3.5 shrink-0" />
        <span>
          service_role キーは絶対にクライアントに公開しないでください。
        </span>
      </CardFooter>
    </Card>
  );
}
