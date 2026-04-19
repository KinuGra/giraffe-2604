"use client";

import { LogoMark } from "@/components/logo-mark";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { project } from "@/lib/mock-data";
import { comingSoonItems, navItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { LogOut, MoreHorizontal, Settings, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Sidebar({ onLogout }: { onLogout?: () => void }) {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col w-60 shrink-0 bg-card border-r border-border">
      {/* Org/Project switcher */}
      <div className="px-2.5 pt-2.5 pb-2 border-b border-border">
        <div className="flex items-center gap-2 w-full h-9 px-2">
          <LogoMark size={22} />
          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center gap-1 text-[12.5px] font-semibold truncate">
              {project.name}
              <Badge
                variant="outline"
                className="ml-1 h-[17px] text-[9.5px] px-1 font-mono"
              >
                PRO
              </Badge>
            </div>
            <div className="text-[10.5px] text-muted-foreground truncate">
              {project.org}
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        {navItems.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-2.5 w-full h-8 px-2 rounded-md text-[12.5px] transition-colors",
                active
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary",
              )}
            >
              <item.icon
                className="h-3.5 w-3.5"
                strokeWidth={active ? 2.1 : 1.75}
              />
              <span className="flex-1 text-left">{item.label}</span>
              {active && <div className="w-1 h-1 rounded-full bg-primary" />}
            </Link>
          );
        })}

        {comingSoonItems.length > 0 && (
          <>
            <div className="pt-4 pb-1.5 px-2 text-[10px]font-semibold">
              Coming soon
            </div>
            {comingSoonItems.map((item) => (
              <>
                <div
                  key={item.label}
                  className="flex items-center gap-2.5 w-full h-8 px-2 rounded-md text-[12.5px] text-muted-foreground/60 cursor-not-allowed"
                >
                  <item.icon className="h-3.5 w-3.5" />
                  <span className="flex-1 text-left">{item.label}</span>
                  <Badge variant="outline" className="h-4 text-[9px] font-mono">
                    soon
                  </Badge>
                </div>
              </>
            ))}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-2 space-y-1">
        <div className="pt-1">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 w-full h-9 px-1.5 rounded-md hover:bg-secondary transition-colors cursor-pointer">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-[10px] bg-primary/20 text-primary">
                  RH
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-left">
                <div className="text-[12px] font-medium truncate">
                  Ren Hattori
                </div>
                <div className="text-[10.5px] text-muted-foreground truncate">
                  ren@acorn.dev
                </div>
              </div>
              <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuItem>
                <Users className="h-3.5 w-3.5" /> Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="h-3.5 w-3.5" /> Preferences
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onLogout}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </aside>
  );
}
