import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { project } from "@/lib/mock-data";

import { ApiKeysCard } from "@/features/home/api-keys-card";
import { QuickLinks } from "@/features/home/quick-links";
import { RecentActivity } from "@/features/home/recent-activity";
import { SdkSnippets } from "@/features/home/sdk-snippets";

export default function DashboardHomePage() {
  return (
    <div className="mx-auto max-w-[1280px] p-6 space-y-5">
      {/* ---- heading ---- */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2.5">
            <h1 className="font-heading text-xl font-semibold tracking-tight">
              {project.name}
            </h1>
            <Badge variant="secondary" className="gap-1.5 text-xs h-5 px-2">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex size-1.5 rounded-full bg-green-400" />
              </span>
              Healthy
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{project.region}</span>
            <Separator orientation="vertical" className="h-3" />
            <span>Postgres {project.pgVersion}</span>
            <Separator orientation="vertical" className="h-3" />
            <span className="font-mono">{project.id}</span>
          </div>
        </div>
      </div>

      {/* ---- API keys + SDK snippets ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <ApiKeysCard />
        </div>
        <div className="lg:col-span-1">
          <SdkSnippets />
        </div>
      </div>

      {/* ---- Activity + Quick links ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <RecentActivity />
        </div>
        <div className="lg:col-span-1">
          <QuickLinks />
        </div>
      </div>
    </div>
  );
}
