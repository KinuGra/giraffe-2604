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

const queryParams = [
  {
    name: "select",
    type: "string",
    description:
      "Comma-separated list of columns to return. Supports nested selects with foreign key joins.",
  },
  {
    name: "order",
    type: "string",
    description: "Column to sort by, with optional .asc or .desc suffix.",
  },
  {
    name: "limit",
    type: "int",
    description: "Maximum number of rows to return. Default is 100.",
  },
  {
    name: "offset",
    type: "int",
    description: "Number of rows to skip before returning results.",
  },
  {
    name: "{column}",
    type: "filter",
    description:
      "Filter rows by column value using operators: eq, neq, gt, gte, lt, lte, like, ilike, is, in.",
  },
];

const headers = [
  {
    name: "apikey",
    required: true,
    description:
      "Your project's anon or service_role key for API authentication.",
  },
  {
    name: "Authorization",
    required: true,
    description:
      "Bearer token. Use the anon key for public access or a user JWT for RLS-protected queries.",
  },
  {
    name: "Content-Type",
    required: false,
    description: "Set to application/json for POST/PATCH requests.",
  },
  {
    name: "Prefer",
    required: false,
    description:
      "Set to return=representation to include the created/updated row in the response body.",
  },
];

export function ParamsTable() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Query parameters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Query parameters</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Parameter</TableHead>
                <TableHead className="text-xs">Type</TableHead>
                <TableHead className="text-xs">Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queryParams.map((p) => (
                <TableRow key={p.name}>
                  <TableCell>
                    <code className="text-xs font-mono text-brand-400">
                      {p.name}
                    </code>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground font-mono">
                      {p.type}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {p.description}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Headers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Headers</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Header</TableHead>
                <TableHead className="text-xs">Required</TableHead>
                <TableHead className="text-xs">Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {headers.map((h) => (
                <TableRow key={h.name}>
                  <TableCell>
                    <code className="text-xs font-mono text-brand-400">
                      {h.name}
                    </code>
                  </TableCell>
                  <TableCell>
                    {h.required ? (
                      <Badge
                        variant="default"
                        className="text-[10px] px-1.5 py-0"
                      >
                        required
                      </Badge>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">
                        optional
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {h.description}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
