import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { profilesColumns } from "@/lib/mock-data";

export function DefinitionTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Columns</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Default</TableHead>
              <TableHead>Nullable</TableHead>
              <TableHead>Flags</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profilesColumns.map((col) => (
              <TableRow key={col.name}>
                <TableCell className="font-mono text-foreground">
                  {col.name}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-mono font-normal">
                    {col.type}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-muted-foreground">
                  {col.default ?? <span className="italic">none</span>}
                </TableCell>
                <TableCell>
                  {col.nullable ? (
                    <span className="text-muted-foreground">YES</span>
                  ) : (
                    <span className="text-foreground">NO</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {col.isPrimaryKey && (
                      <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/20">
                        PK
                      </Badge>
                    )}
                    {col.isUnique && !col.isPrimaryKey && (
                      <Badge className="bg-sky-500/15 text-sky-400 border-sky-500/20">
                        UNIQUE
                      </Badge>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
