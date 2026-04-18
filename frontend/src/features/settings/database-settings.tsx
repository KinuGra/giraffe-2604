import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { project } from "@/lib/mock-data";

export function DatabaseSettings() {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Database</h2>
        <p className="text-sm text-muted-foreground">Postgres接続設定</p>
      </div>

      <Card>
        <CardContent className="py-4 space-y-0">
          <div className="grid grid-cols-[1fr_300px] items-center py-3">
            <span className="text-sm font-medium">Connection string</span>
            <Input
              readOnly
              value={project.connectionString}
              className="font-mono text-xs"
            />
          </div>
          <Separator />
          <div className="grid grid-cols-[1fr_300px] items-center py-3">
            <span className="text-sm font-medium">Connection pooling</span>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="grid grid-cols-[1fr_300px] items-center py-3">
            <span className="text-sm font-medium">SSL enforcement</span>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
