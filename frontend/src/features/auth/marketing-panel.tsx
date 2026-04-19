import { LogoMark } from "@/components/logo-mark";
import { Badge } from "@/components/ui/badge";
import { Database, HardDrive, Key, SquareFunction } from "lucide-react";

const features = [
  {
    icon: Database,
    title: "Database",
    description: "Postgres 15",
  },
  {
    icon: SquareFunction,
    title: "Server Functions",
    description: "Deno Runtime",
  },
  {
    icon: Key,
    title: "Auth",
    description: "JWT & OAuth",
  },
  {
    icon: HardDrive,
    title: "Storage",
    description: "S3 Compatible",
  },
] as const;

const footerLinks = [
  { label: "Docs", href: "#" },
  { label: "Status", href: "#" },
  { label: "Changelog", href: "#" },
] as const;

export function MarketingPanel() {
  return (
    <div className="relative flex h-full flex-col justify-between overflow-hidden bg-[oklch(0.13_0.015_75)] px-10 py-8">
      {/* Decorative grid background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Decorative blur circles */}
      <div className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-brand-500/15 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 size-80 rounded-full bg-brand-700/10 blur-[120px]" />

      {/* ── Top: Brand ── */}
      <div className="relative z-10 flex items-center gap-3">
        <LogoMark size={28} />
        <span className="font-heading text-[18px] font-semibold tracking-tight text-white">
          giraffe
        </span>
        <Badge
          variant="outline"
          className="ml-1 border-brand-500/30 text-brand-400 text-[10px]"
        >
          BaaS
        </Badge>
      </div>

      {/* ── Middle: Tagline + features ── */}
      <div className="relative z-10 -mt-4 flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <h1 className="font-heading text-[44px] font-bold leading-[1.15] tracking-tight text-white">
            Postgres と
            <br />
            Server Functions を、
            <br />
            <span className="text-brand-400">一晩で。</span>
          </h1>
          <p className="max-w-[380px] text-[14px] leading-relaxed text-white/50">
            giraffe は、認証・データベース・ストレージ・Server Functions
            をひとつのプラットフォームで提供するオープンソース BaaS です。
          </p>
        </div>

        {/* Feature cards 2x2 */}
        <div className="grid grid-cols-2 gap-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group flex flex-col gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 transition-colors hover:border-brand-500/20 hover:bg-white/[0.05]"
            >
              <div className="flex size-8 items-center justify-center rounded-lg bg-brand-500/10">
                <f.icon className="size-4 text-brand-400" />
              </div>
              <div>
                <p className="text-[13px] font-medium text-white/90">
                  {f.title}
                </p>
                <p className="text-[11px] text-white/40">{f.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom: Footer ── */}
      <div className="relative z-10 flex flex-col gap-3">
        <div className="flex items-center gap-4 text-[11px] text-white/30">
          {footerLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="transition-colors hover:text-white/60"
            >
              {link.label}
            </a>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-white/20">
            &copy; 2026 giraffe, Inc.
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-white/30">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand-400 opacity-40" />
              <span className="relative inline-flex size-2 rounded-full bg-brand-400" />
            </span>
            All systems operational
          </span>
        </div>
      </div>
    </div>
  );
}
