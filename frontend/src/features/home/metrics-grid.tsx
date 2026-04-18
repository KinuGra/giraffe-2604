import { Sparkline } from "@/components/sparkline";
import { Card, CardContent } from "@/components/ui/card";
import { metrics } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Activity, Cloud, Database, HardDrive, Users, Zap } from "lucide-react";

const config = {
  requests: { icon: Zap, color: "text-brand-400", sparkColor: "#34D399" },
  db: { icon: Database, color: "text-brand-400", sparkColor: "#34D399" },
  auth: { icon: Users, color: "text-blue-400", sparkColor: "#60A5FA" },
  storage: { icon: HardDrive, color: "text-violet-400", sparkColor: "#A78BFA" },
  egress: { icon: Cloud, color: "text-amber-400", sparkColor: "#FBBF24" },
  errorRate: {
    icon: Activity,
    color: "text-destructive",
    sparkColor: "#F87171",
  },
} as const;

type MetricKey = keyof typeof config;

export function MetricsGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {(Object.keys(config) as MetricKey[]).map((key) => {
        const metric = metrics[key];
        const cfg = config[key];
        const Icon = cfg.icon;

        // For errorRate, a negative delta is good (inverted)
        const isGood =
          key === "errorRate" ? metric.delta < 0 : metric.delta > 0;

        return (
          <Card key={key} size="sm">
            <CardContent className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                <Icon className={cn("size-3.5", cfg.color)} />
                <span className="text-xs text-muted-foreground">
                  {metric.label}
                </span>
              </div>
              <div className="flex items-end justify-between">
                <div className="flex flex-col gap-1">
                  <span className="text-[19px] font-semibold leading-none tracking-tight">
                    {metric.value}
                  </span>
                  <span
                    className={cn(
                      "text-xs font-medium",
                      isGood ? "text-green-400" : "text-red-400",
                    )}
                  >
                    {metric.delta > 0 ? "+" : ""}
                    {metric.delta}%
                  </span>
                </div>
                <Sparkline
                  data={metric.spark}
                  color={cfg.sparkColor}
                  className="w-16 h-5"
                />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
