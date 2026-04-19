import {
  Activity,
  BookOpen,
  Database,
  HardDrive,
  Home,
  Settings,
  SquareFunction,
  Table2,
  Users,
} from "lucide-react";

export const navItems = [
  { label: "Home", href: "/dashboard/home", icon: Home },
  { label: "Table Editor", href: "/dashboard/editor", icon: Table2 },
  {
    label: "Server Functions",
    href: "/dashboard/functions",
    icon: SquareFunction,
  },
  { label: "API Docs", href: "/dashboard/api", icon: BookOpen },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export const comingSoonItems = [
  { label: "Database", icon: Database },
  { label: "Authentication", icon: Users },
  { label: "Storage", icon: HardDrive },
  { label: "Logs", icon: Activity },
];
