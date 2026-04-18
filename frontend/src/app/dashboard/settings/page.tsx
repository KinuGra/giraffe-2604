"use client";

import { ApiSettings } from "@/features/settings/api-settings";
import { BillingSettings } from "@/features/settings/billing-settings";
import { DangerZone } from "@/features/settings/danger-zone";
import { DatabaseSettings } from "@/features/settings/database-settings";
import { GeneralSettings } from "@/features/settings/general-settings";
import { MembersSettings } from "@/features/settings/members-settings";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  CreditCard,
  Database,
  Key,
  Settings,
  Users,
} from "lucide-react";
import { useState } from "react";

const sections = [
  { id: "general", label: "General", icon: Settings },
  { id: "api", label: "API", icon: Key },
  { id: "database", label: "Database", icon: Database },
  { id: "members", label: "Members", icon: Users },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "danger", label: "Danger zone", icon: AlertTriangle },
] as const;

type SectionId = (typeof sections)[number]["id"];

export default function SettingsPage() {
  const [active, setActive] = useState<SectionId>("general");

  return (
    <div className="flex h-full">
      {/* Left nav */}
      <nav className="w-[220px] border-r bg-card/50 py-3 px-2 space-y-0.5 shrink-0">
        {sections.map((section) => (
          <button
            type="button"
            key={section.id}
            onClick={() => setActive(section.id)}
            className={cn(
              "flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm transition-colors text-left",
              active === section.id
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
            )}
          >
            <section.icon className="h-4 w-4" />
            {section.label}
          </button>
        ))}
      </nav>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-[720px]">
          {active === "general" && <GeneralSettings />}
          {active === "api" && <ApiSettings />}
          {active === "database" && <DatabaseSettings />}
          {active === "members" && <MembersSettings />}
          {active === "billing" && <BillingSettings />}
          {active === "danger" && <DangerZone />}
        </div>
      </div>
    </div>
  );
}
