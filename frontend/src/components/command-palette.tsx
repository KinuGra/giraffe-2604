"use client";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { functions, tables } from "@/lib/mock-data";
import { navItems } from "@/lib/navigation";
import { ArrowRight, SquareFunction, Table2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();

  const navigate = (href: string) => {
    router.push(href);
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type to search pages, tables, functions…" />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>

        <CommandGroup heading="Navigation">
          {navItems.map((item) => (
            <CommandItem
              key={item.href}
              onSelect={() => navigate(item.href)}
              className="gap-2.5"
            >
              <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="flex-1">{item.label}</span>
              <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Tables">
          {tables.slice(0, 5).map((t) => (
            <CommandItem
              key={t.name}
              onSelect={() => navigate("/dashboard/editor")}
              className="gap-2.5"
            >
              <Table2 className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="flex-1 font-mono text-[12px]">
                {t.schema}.{t.name}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Functions">
          {functions.slice(0, 5).map((f) => (
            <CommandItem
              key={f.name}
              onSelect={() => navigate("/dashboard/functions")}
              className="gap-2.5"
            >
              <SquareFunction className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="flex-1 font-mono text-[12px]">{f.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
