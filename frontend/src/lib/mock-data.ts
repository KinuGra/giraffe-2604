// ---------------------------------------------------------------------------
// Mock data for the Table Editor (BaaS dashboard)
// ---------------------------------------------------------------------------

export interface SchemaInfo {
  name: string;
}

export interface TableInfo {
  name: string;
  schema: string;
  rls: boolean;
  rowCount: number;
}

export interface ColumnDef {
  name: string;
  type: string;
  default: string | null;
  nullable: boolean;
  isPrimaryKey: boolean;
  isUnique: boolean;
}

export const schemas: SchemaInfo[] = [
  { name: "public" },
  { name: "auth" },
  { name: "storage" },
  { name: "extensions" },
];

export const tables: TableInfo[] = [
  { name: "profiles", schema: "public", rls: true, rowCount: 2340 },
  { name: "posts", schema: "public", rls: true, rowCount: 18700 },
  { name: "comments", schema: "public", rls: false, rowCount: 45200 },
  { name: "categories", schema: "public", rls: false, rowCount: 12 },
  { name: "tags", schema: "public", rls: false, rowCount: 87 },
  { name: "post_tags", schema: "public", rls: false, rowCount: 3200 },
  { name: "likes", schema: "public", rls: true, rowCount: 98400 },
  { name: "follows", schema: "public", rls: true, rowCount: 5600 },
  { name: "notifications", schema: "public", rls: true, rowCount: 23100 },
  { name: "media", schema: "public", rls: true, rowCount: 7800 },
];

export const profilesColumns: ColumnDef[] = [
  {
    name: "id",
    type: "uuid",
    default: "gen_random_uuid()",
    nullable: false,
    isPrimaryKey: true,
    isUnique: true,
  },
  {
    name: "email",
    type: "text",
    default: null,
    nullable: false,
    isPrimaryKey: false,
    isUnique: true,
  },
  {
    name: "display_name",
    type: "text",
    default: null,
    nullable: true,
    isPrimaryKey: false,
    isUnique: false,
  },
  {
    name: "avatar_url",
    type: "text",
    default: null,
    nullable: true,
    isPrimaryKey: false,
    isUnique: false,
  },
  {
    name: "bio",
    type: "text",
    default: null,
    nullable: true,
    isPrimaryKey: false,
    isUnique: false,
  },
  {
    name: "role",
    type: "text",
    default: "'member'",
    nullable: false,
    isPrimaryKey: false,
    isUnique: false,
  },
  {
    name: "is_active",
    type: "boolean",
    default: "true",
    nullable: false,
    isPrimaryKey: false,
    isUnique: false,
  },
  {
    name: "created_at",
    type: "timestamptz",
    default: "now()",
    nullable: false,
    isPrimaryKey: false,
    isUnique: false,
  },
];

export const profilesRows: Record<string, unknown>[] = [
  {
    id: "a1b2c3d4-0001-4000-8000-000000000001",
    email: "alice@example.com",
    display_name: "Alice Johnson",
    avatar_url: "https://i.pravatar.cc/150?u=alice",
    bio: "Full-stack developer",
    role: "owner",
    is_active: true,
    created_at: "2024-11-02T08:12:34Z",
  },
  {
    id: "a1b2c3d4-0002-4000-8000-000000000002",
    email: "bob@example.com",
    display_name: "Bob Smith",
    avatar_url: "https://i.pravatar.cc/150?u=bob",
    bio: "DevOps engineer",
    role: "admin",
    is_active: true,
    created_at: "2024-11-05T14:23:11Z",
  },
  {
    id: "a1b2c3d4-0003-4000-8000-000000000003",
    email: "carol@example.com",
    display_name: "Carol Williams",
    avatar_url: null,
    bio: null,
    role: "member",
    is_active: true,
    created_at: "2024-11-10T09:45:00Z",
  },
  {
    id: "a1b2c3d4-0004-4000-8000-000000000004",
    email: "dave@example.com",
    display_name: "Dave Brown",
    avatar_url: "https://i.pravatar.cc/150?u=dave",
    bio: "Product manager",
    role: "admin",
    is_active: false,
    created_at: "2024-11-12T17:30:22Z",
  },
  {
    id: "a1b2c3d4-0005-4000-8000-000000000005",
    email: "eve@example.com",
    display_name: "Eve Davis",
    avatar_url: "https://i.pravatar.cc/150?u=eve",
    bio: null,
    role: "member",
    is_active: true,
    created_at: "2024-11-15T11:05:48Z",
  },
  {
    id: "a1b2c3d4-0006-4000-8000-000000000006",
    email: "frank@example.com",
    display_name: null,
    avatar_url: null,
    bio: null,
    role: "member",
    is_active: true,
    created_at: "2024-12-01T06:18:33Z",
  },
  {
    id: "a1b2c3d4-0007-4000-8000-000000000007",
    email: "grace@example.com",
    display_name: "Grace Lee",
    avatar_url: "https://i.pravatar.cc/150?u=grace",
    bio: "UX designer",
    role: "member",
    is_active: true,
    created_at: "2024-12-03T13:42:19Z",
  },
  {
    id: "a1b2c3d4-0008-4000-8000-000000000008",
    email: "henry@example.com",
    display_name: "Henry Wilson",
    avatar_url: null,
    bio: "Backend engineer",
    role: "admin",
    is_active: true,
    created_at: "2024-12-07T20:09:55Z",
  },
  {
    id: "a1b2c3d4-0009-4000-8000-000000000009",
    email: "iris@example.com",
    display_name: "Iris Chen",
    avatar_url: "https://i.pravatar.cc/150?u=iris",
    bio: null,
    role: "member",
    is_active: false,
    created_at: "2024-12-10T08:33:41Z",
  },
  {
    id: "a1b2c3d4-0010-4000-8000-000000000010",
    email: "jack@example.com",
    display_name: "Jack Taylor",
    avatar_url: "https://i.pravatar.cc/150?u=jack",
    bio: "Data analyst",
    role: "member",
    is_active: true,
    created_at: "2024-12-14T15:21:07Z",
  },
  {
    id: "a1b2c3d4-0011-4000-8000-000000000011",
    email: "karen@example.com",
    display_name: "Karen Martinez",
    avatar_url: null,
    bio: null,
    role: "member",
    is_active: true,
    created_at: "2024-12-18T10:55:29Z",
  },
  {
    id: "a1b2c3d4-0012-4000-8000-000000000012",
    email: "leo@example.com",
    display_name: "Leo Garcia",
    avatar_url: "https://i.pravatar.cc/150?u=leo",
    bio: "Mobile dev",
    role: "member",
    is_active: true,
    created_at: "2024-12-22T07:44:16Z",
  },
];

// ---------------------------------------------------------------------------
// Project / Orgs / Projects
// ---------------------------------------------------------------------------

export const project = {
  name: "acorn-prod",
  id: "prj_kf82hs9",
  org: "Keyaki Studio",
  region: "ap-northeast-1 (Tokyo)",
  plan: "Pro",
  pgVersion: "15.6",
  status: "healthy" as const,
  url: "https://kf82hs9.giraffe.app",
  anonKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsInJlZiI6ImtmODJoczkiLCJpYXQiOjE3MDg0Mjg4MDB9.Xq3YQn8gZ4L7mDcVkP2wJhR6sT1eB5nK9xA",
  serviceRoleKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwicmVmIjoia2Y4MmhzOSJ9.f9KdL2mN8pQvR4sT6uW1yZ3bA5cE7gH9iJ1kL",
  connectionString:
    "postgresql://postgres:[YOUR-PASSWORD]@db.kf82hs9.giraffe.app:5432/postgres",
};

export const orgs = [
  { id: "o1", name: "Keyaki Studio", plan: "Pro" },
  { id: "o2", name: "Personal", plan: "Free" },
];

export const projects = [
  {
    id: "prj_kf82hs9",
    name: "acorn-prod",
    region: "Tokyo",
    status: "healthy" as const,
  },
  {
    id: "prj_a7b2ksd",
    name: "acorn-staging",
    region: "Tokyo",
    status: "healthy" as const,
  },
  {
    id: "prj_92mndsa",
    name: "kokoro-api",
    region: "Singapore",
    status: "paused" as const,
  },
];

// ---------------------------------------------------------------------------
// Metrics
// ---------------------------------------------------------------------------

export const metrics = {
  requests: {
    label: "API Requests",
    value: "1.24M",
    delta: 12.3,
    spark: [40, 45, 42, 50, 55, 58, 60, 63, 68, 72, 70, 75],
  },
  db: {
    label: "DB Queries",
    value: "842K",
    delta: 8.1,
    spark: [30, 32, 35, 34, 38, 40, 42, 45, 43, 48, 50, 52],
  },
  auth: {
    label: "Auth Users",
    value: "24,891",
    delta: 5.4,
    spark: [200, 210, 220, 225, 230, 240, 248, 255, 260, 270, 275, 280],
  },
  storage: {
    label: "Storage",
    value: "18.4 GB",
    delta: 3.2,
    spark: [10, 11, 11, 12, 12, 13, 14, 14, 15, 16, 17, 18],
  },
  egress: {
    label: "Egress",
    value: "5.7 GB",
    delta: -2.1,
    spark: [8, 7.5, 7, 6.8, 6.5, 6.2, 6, 5.8, 5.5, 5.8, 5.6, 5.7],
  },
  errorRate: {
    label: "Error Rate",
    value: "0.08%",
    delta: -15.2,
    spark: [
      0.2, 0.18, 0.15, 0.14, 0.12, 0.11, 0.1, 0.09, 0.1, 0.08, 0.09, 0.08,
    ],
  },
};

// ---------------------------------------------------------------------------
// Recent activity
// ---------------------------------------------------------------------------

export const recentActivity = [
  {
    time: "12:04:32",
    event: "INSERT into profiles",
    source: "db" as const,
    status: "success" as const,
  },
  {
    time: "12:04:28",
    event: "User signed in (OAuth)",
    source: "auth" as const,
    status: "success" as const,
  },
  {
    time: "12:04:15",
    event: "File uploaded: avatar_3291.png",
    source: "storage" as const,
    status: "success" as const,
  },
  {
    time: "12:03:58",
    event: "Edge function invoked: send-email",
    source: "edge" as const,
    status: "success" as const,
  },
  {
    time: "12:03:41",
    event: "RLS policy denied SELECT on orders",
    source: "db" as const,
    status: "error" as const,
  },
  {
    time: "12:03:22",
    event: "Token refresh",
    source: "auth" as const,
    status: "success" as const,
  },
  {
    time: "12:02:59",
    event: "Edge function invoked: resize-image",
    source: "edge" as const,
    status: "error" as const,
  },
  {
    time: "12:02:44",
    event: "DELETE from sessions",
    source: "db" as const,
    status: "success" as const,
  },
];

// ---------------------------------------------------------------------------
// API routes (used by API docs page)
// ---------------------------------------------------------------------------

export const apiRoutes = [
  {
    method: "GET" as const,
    path: "/rest/v1/profiles",
    desc: "List all profiles",
    tag: "profiles",
  },
  {
    method: "POST" as const,
    path: "/rest/v1/profiles",
    desc: "Create a profile",
    tag: "profiles",
  },
  {
    method: "PATCH" as const,
    path: "/rest/v1/profiles?id=eq.{id}",
    desc: "Update a profile",
    tag: "profiles",
  },
  {
    method: "DELETE" as const,
    path: "/rest/v1/profiles?id=eq.{id}",
    desc: "Delete a profile",
    tag: "profiles",
  },
  {
    method: "GET" as const,
    path: "/rest/v1/posts",
    desc: "List all posts",
    tag: "posts",
  },
  {
    method: "POST" as const,
    path: "/rest/v1/rpc/search",
    desc: "Call stored procedure",
    tag: "rpc",
  },
  {
    method: "POST" as const,
    path: "/auth/v1/token?grant_type=password",
    desc: "Sign in with password",
    tag: "auth",
  },
  {
    method: "POST" as const,
    path: "/auth/v1/signup",
    desc: "Sign up a new user",
    tag: "auth",
  },
  {
    method: "POST" as const,
    path: "/functions/v1/send-invoice",
    desc: "Invoke edge function",
    tag: "functions",
  },
];

// ---------------------------------------------------------------------------
// Team members (used by Settings page)
// ---------------------------------------------------------------------------

export const teamMembers = [
  {
    id: "1",
    email: "alice@example.com",
    name: "Alice Johnson",
    role: "owner" as const,
    joinedAt: "2024-06-15",
  },
  {
    id: "2",
    email: "bob@example.com",
    name: "Bob Smith",
    role: "admin" as const,
    joinedAt: "2024-08-22",
  },
  {
    id: "3",
    email: "carol@example.com",
    name: "Carol Williams",
    role: "member" as const,
    joinedAt: "2024-11-10",
  },
];

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

export const functions = [
  {
    name: "send-invoice",
    status: "active" as const,
    runtime: "Deno",
    lastDeploy: "2h ago",
    invocations: 12340,
    errors: 3,
    p95: "142ms",
    version: "v12",
  },
  {
    name: "send-email",
    status: "active" as const,
    runtime: "Deno",
    lastDeploy: "3h ago",
    invocations: 8921,
    errors: 0,
    p95: "98ms",
    version: "v8",
  },
  {
    name: "resize-image",
    status: "error" as const,
    runtime: "Deno",
    lastDeploy: "1d ago",
    invocations: 3201,
    errors: 14,
    p95: "320ms",
    version: "v5",
  },
  {
    name: "generate-pdf",
    status: "active" as const,
    runtime: "Deno",
    lastDeploy: "5h ago",
    invocations: 720,
    errors: 0,
    p95: "410ms",
    version: "v3",
  },
  {
    name: "webhook-handler",
    status: "active" as const,
    runtime: "Deno",
    lastDeploy: "12h ago",
    invocations: 45100,
    errors: 8,
    p95: "52ms",
    version: "v21",
  },
  {
    name: "cron-cleanup",
    status: "active" as const,
    runtime: "Deno",
    lastDeploy: "2d ago",
    invocations: 6430,
    errors: 0,
    p95: "88ms",
    version: "v4",
  },
  {
    name: "stripe-sync",
    status: "active" as const,
    runtime: "Deno",
    lastDeploy: "6h ago",
    invocations: 18900,
    errors: 2,
    p95: "165ms",
    version: "v9",
  },
];

// ---------------------------------------------------------------------------
// Function code & logs (used by Functions detail page)
// ---------------------------------------------------------------------------

export const functionCode = `import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const { to, subject, body } = await req.json();

  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: \`Bearer \${Deno.env.get("SENDGRID_API_KEY")}\`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: "noreply@giraffe.app" },
      subject,
      content: [{ type: "text/plain", value: body }],
    }),
  });

  return new Response(JSON.stringify({ ok: res.ok }), {
    headers: { "Content-Type": "application/json" },
  });
});`;

export const functionLogs = [
  {
    t: "12:04:31.204",
    level: "info" as const,
    fn: "send-invoice",
    msg: "Function invoked",
    meta: "req_id=a9f2",
  },
  {
    t: "12:04:31.210",
    level: "info" as const,
    fn: "send-invoice",
    msg: "Parsing request body",
  },
  {
    t: "12:04:31.320",
    level: "info" as const,
    fn: "send-invoice",
    msg: "Sending email to alice@example.com",
  },
  {
    t: "12:04:31.890",
    level: "info" as const,
    fn: "send-invoice",
    msg: "SendGrid responded 202",
  },
  {
    t: "12:04:31.892",
    level: "info" as const,
    fn: "send-invoice",
    msg: "Completed in 688ms",
    meta: "status=200",
  },
  {
    t: "12:03:58.100",
    level: "info" as const,
    fn: "send-invoice",
    msg: "Function invoked",
    meta: "req_id=b3c1",
  },
  {
    t: "12:03:58.105",
    level: "info" as const,
    fn: "send-invoice",
    msg: "Parsing request body",
  },
  {
    t: "12:03:58.240",
    level: "warn" as const,
    fn: "send-invoice",
    msg: "Missing 'subject' field, using default",
  },
  {
    t: "12:03:58.780",
    level: "info" as const,
    fn: "send-invoice",
    msg: "SendGrid responded 202",
  },
  {
    t: "12:03:58.782",
    level: "info" as const,
    fn: "send-invoice",
    msg: "Completed in 682ms",
    meta: "status=200",
  },
  {
    t: "12:02:59.010",
    level: "info" as const,
    fn: "resize-image",
    msg: "Function invoked",
    meta: "req_id=d7e4",
  },
  {
    t: "12:02:59.200",
    level: "error" as const,
    fn: "resize-image",
    msg: "TypeError: Cannot read property 'width' of undefined",
  },
  {
    t: "12:02:59.201",
    level: "error" as const,
    fn: "resize-image",
    msg: "Completed with error in 191ms",
    meta: "status=500",
  },
];

// ---------------------------------------------------------------------------
// Billing usage (used by Settings > Billing)
// ---------------------------------------------------------------------------

export const billingUsage = [
  { label: "Database", used: 1.2, total: 8, unit: "GB" },
  { label: "Storage", used: 3.4, total: 100, unit: "GB" },
  { label: "Bandwidth", used: 12, total: 50, unit: "GB" },
  {
    label: "Server Functions",
    used: 450_000,
    total: 2_000_000,
    unit: "invocations",
  },
];
