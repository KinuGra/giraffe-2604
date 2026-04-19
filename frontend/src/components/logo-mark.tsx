import { cn } from "@/lib/utils";

export function LogoMark({
  size = 22,
  className,
}: { size?: number; className?: string }) {
  return (
    <div
      className={cn(
        "relative rounded-[6px] grid place-items-center shrink-0 overflow-hidden",
        className,
      )}
      style={{
        width: size,
        height: size,
        background: "linear-gradient(135deg, #FBBF24 0%, #B45309 100%)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.28), 0 1px 2px rgba(0,0,0,0.4)",
      }}
    >
      <svg
        width={size * 0.62}
        height={size * 0.62}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M6 20 V9 a3 3 0 0 1 3-3 h2 l3-3 v6 a3 3 0 0 1-3 3 h-2 v8"
          stroke="#3D1F00"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="14.5" cy="4.5" r="0.9" fill="#3D1F00" />
      </svg>
    </div>
  );
}
