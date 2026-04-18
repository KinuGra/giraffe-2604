import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { recentActivity } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { CircleCheck, CircleX } from "lucide-react";

const sourceBadgeVariant: Record<string, string> = {
  edge: "text-blue-400 bg-blue-400/10",
  db: "text-green-400 bg-green-400/10",
  auth: "text-violet-400 bg-violet-400/10",
  storage: "text-secondary-foreground bg-secondary",
};

export function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent activity</CardTitle>
          <a
            href="/dashboard/logs"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            View logs &rarr;
          </a>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[90px]">Time</TableHead>
              <TableHead>Event</TableHead>
              <TableHead className="w-[80px]">Source</TableHead>
              <TableHead className="w-[70px] text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentActivity.map((row) => (
              <TableRow key={`${row.time}-${row.event}`}>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {row.time}
                </TableCell>
                <TableCell className="text-xs">{row.event}</TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-[10px] h-4 px-1.5",
                      sourceBadgeVariant[row.source],
                    )}
                  >
                    {row.source}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {row.status === "success" ? (
                    <CircleCheck className="inline-block size-3.5 text-green-400" />
                  ) : (
                    <CircleX className="inline-block size-3.5 text-red-400" />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
