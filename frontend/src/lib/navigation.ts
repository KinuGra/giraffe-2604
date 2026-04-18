import {
  Home,
  Table2,
  SquareFunction,
  BookOpen,
  Settings,
  Database,
  Users,
  HardDrive,
  Activity,
} from "lucide-react";

export const navItems = [
  { label: "Home", href: "/dashboard/home", icon: Home },
  { label: "Table Editor", href: "/dashboard/editor", icon: Table2 },
  { label: "Edge Functions", href: "/dashboard/functions", icon: SquareFunction },
  { label: "API Docs", href: "/dashboard/api", icon: BookOpen },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export const comingSoonItems = [
  { label: "Database", icon: Database },
  { label: "Authentication", icon: Users },
  { label: "Storage", icon: HardDrive },
  { label: "Logs", icon: Activity },
];
