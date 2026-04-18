"use client";

import { useState } from "react";
import { Eye, EyeOff, Info, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { CopyButton } from "@/components/copy-button";
import { project } from "@/lib/mock-data";

export function ApiSettings() {
  const [showServiceRole, setShowServiceRole] = useState(false);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">API</h2>
        <p className="text-sm text-muted-foreground">Project URLとAPIキーの管理</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Project keys</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Project URL */}
          <div className="space-y-1.5">
            <span className="text-sm font-medium">Project URL</span>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded border bg-muted px-3 py-2 text-xs font-mono truncate">
                {project.url}
              </code>
              <CopyButton value={project.url} />
            </div>
          </div>

          {/* anon public */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">anon public</span>
              <Badge variant="outline" className="gap-1 text-xs">
                <Info className="h-3 w-3" />
                public
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded border bg-muted px-3 py-2 text-xs font-mono truncate">
                {project.anonKey}
              </code>
              <CopyButton value={project.anonKey} />
            </div>
          </div>

          {/* service_role */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">service_role</span>
              <Badge variant="outline" className="gap-1 text-xs text-yellow-500 border-yellow-500/30">
                <AlertTriangle className="h-3 w-3" />
                secret
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded border bg-muted px-3 py-2 text-xs font-mono truncate">
                {showServiceRole ? project.serviceRoleKey : "••••••••••••••••••••••••••••••••"}
              </code>
              <button
                onClick={() => setShowServiceRole(!showServiceRole)}
                className="inline-flex items-center justify-center h-6 w-6 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                {showServiceRole ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
              </button>
              <CopyButton value={project.serviceRoleKey} />
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t pt-4 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            キーをローテーションすると既存のクライアントが無効になります
          </p>
          <Button variant="outline" size="sm">
            Rotate keys
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">CORS</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            className="font-mono text-xs"
            rows={4}
            defaultValue={"https://example.com\nhttps://app.example.com"}
          />
        </CardContent>
      </Card>
    </section>
  );
}
