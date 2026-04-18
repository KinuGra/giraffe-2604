import { Pause, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";

export function DangerZone() {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Danger zone</h2>
        <p className="text-sm text-muted-foreground">元に戻せない操作</p>
      </div>

      <Card className="border-destructive/40">
        <CardContent className="py-4 space-y-0">
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium">Pause project</p>
              <p className="text-xs text-muted-foreground">
                プロジェクトを一時停止します。再開するまでアクセスできなくなります。
              </p>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Pause className="h-3.5 w-3.5" />
              Pause
            </Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-destructive">Delete project</p>
              <p className="text-xs text-muted-foreground">
                プロジェクトと全データを完全に削除します。この操作は元に戻せません。
              </p>
            </div>
            <Button variant="destructive" size="sm" className="gap-1.5">
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
