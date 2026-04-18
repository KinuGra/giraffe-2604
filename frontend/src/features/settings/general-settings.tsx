import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

export function GeneralSettings() {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">General</h2>
        <p className="text-sm text-muted-foreground">プロジェクトの基本設定</p>
      </div>

      <Card>
        <CardContent className="py-4 space-y-0">
          <div className="grid grid-cols-[1fr_300px] items-center py-3">
            <span className="text-sm font-medium">Project name</span>
            <Input defaultValue="acorn-prod" />
          </div>
          <Separator />
          <div className="grid grid-cols-[1fr_300px] items-center py-3">
            <span className="text-sm font-medium">Region</span>
            <Select defaultValue="tokyo">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tokyo">Tokyo</SelectItem>
                <SelectItem value="singapore">Singapore</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="grid grid-cols-[1fr_300px] items-center py-3">
            <span className="text-sm font-medium">Postgres version</span>
            <Badge variant="outline" className="font-mono w-fit">
              15.6
            </Badge>
          </div>
          <Separator />
          <div className="grid grid-cols-[1fr_300px] items-center py-3">
            <span className="text-sm font-medium">Pause on inactivity</span>
            <Switch />
          </div>
        </CardContent>
        <CardFooter className="justify-end gap-2 border-t pt-4">
          <Button variant="outline">Cancel</Button>
          <Button>Save</Button>
        </CardFooter>
      </Card>
    </section>
  );
}
