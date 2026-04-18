import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export function FunctionSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Function settings</CardTitle>
        <CardDescription>
          Configure runtime behavior for this Edge Function.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Function name */}
        <div className="grid grid-cols-[1fr_1fr] gap-8 items-start">
          <div>
            <p className="text-sm font-medium">Function name</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Unique identifier used in the invoke URL.
            </p>
          </div>
          <Input defaultValue="send-invoice" className="h-8 text-sm" />
        </div>

        {/* JWT verification */}
        <div className="grid grid-cols-[1fr_1fr] gap-8 items-start">
          <div>
            <p className="text-sm font-medium">JWT verification</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Require a valid JWT in the Authorization header.
            </p>
          </div>
          <div className="flex justify-end">
            <Switch defaultChecked />
          </div>
        </div>

        {/* Timeout */}
        <div className="grid grid-cols-[1fr_1fr] gap-8 items-start">
          <div>
            <p className="text-sm font-medium">Timeout</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Maximum execution time before the function is terminated.
            </p>
          </div>
          <Input defaultValue="30s" className="h-8 text-sm" />
        </div>

        {/* Memory */}
        <div className="grid grid-cols-[1fr_1fr] gap-8 items-start">
          <div>
            <p className="text-sm font-medium">Memory</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Allocated memory for the function runtime.
            </p>
          </div>
          <Select defaultValue="256">
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="128">128 MB</SelectItem>
              <SelectItem value="256">256 MB</SelectItem>
              <SelectItem value="512">512 MB</SelectItem>
              <SelectItem value="1024">1024 MB</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
      <CardFooter className="gap-2 justify-end">
        <Button variant="outline" size="sm">
          Cancel
        </Button>
        <Button size="sm">Save</Button>
      </CardFooter>
    </Card>
  );
}
