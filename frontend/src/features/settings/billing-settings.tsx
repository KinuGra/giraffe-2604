import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { billingUsage } from "@/lib/mock-data";

export function BillingSettings() {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Billing</h2>
        <p className="text-sm text-muted-foreground">プランと使用量</p>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Pro plan</CardTitle>
            <CardDescription>$25 / month · 次回請求 2026-05-14</CardDescription>
          </div>
          <Button variant="outline" size="sm">
            Change plan
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {billingUsage.map((item) => {
            const pct = Math.min((item.used / item.total) * 100, 100);
            const usedLabel =
              item.used >= 1000
                ? `${(item.used / 1_000_000).toFixed(2)}M`
                : String(item.used);
            const totalLabel =
              item.total >= 1000
                ? `${(item.total / 1_000_000).toFixed(1)}M`
                : String(item.total);

            return (
              <div key={item.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{item.label}</span>
                  <span className="text-muted-foreground text-xs">
                    {usedLabel}/{totalLabel} {item.unit}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </section>
  );
}
