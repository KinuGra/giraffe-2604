"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BookOpen,
  ChevronRight,
  SquareFunction,
  Table2,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

interface QuickLink {
  label: string;
  href: string;
  icon: LucideIcon;
  detail: string;
}

const links: QuickLink[] = [
  {
    label: "Browse profiles table",
    href: "/dashboard/editor",
    icon: Table2,
    detail: "8,241 rows",
  },
  {
    label: "Deploy a function",
    href: "/dashboard/functions",
    icon: SquareFunction,
    detail: "7 active",
  },
  {
    label: "View API reference",
    href: "/dashboard/api",
    icon: BookOpen,
    detail: "auto-generated",
  },
  {
    label: "Invite teammates",
    href: "/dashboard/settings",
    icon: Users,
    detail: "3 members",
  },
];

export function QuickLinks() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Jump to</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 rounded-md px-2 py-2 -mx-2 hover:bg-muted/60 transition-colors group"
            >
              <div className="flex items-center justify-center size-8 rounded-md border border-border bg-background">
                <Icon className="size-4 text-muted-foreground" />
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-xs font-medium">{link.label}</span>
                <span className="text-[11px] text-muted-foreground">
                  {link.detail}
                </span>
              </div>
              <ChevronRight className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
