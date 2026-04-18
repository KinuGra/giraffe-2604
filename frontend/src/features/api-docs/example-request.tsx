"use client";

import { CodeBlock } from "@/components/code-block";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";

const examples: Record<string, string> = {
  js: `import { createClient } from '@giraffe/client';

const giraffe = createClient(
  'https://kf82hs9.giraffe.app',
  'your-anon-key'
);

const { data, error } = await giraffe
  .from('profiles')
  .select('id, username, email, role')
  .order('created_at', { ascending: false })
  .limit(10);

console.log(data);`,

  python: `from giraffe import create_client

giraffe = create_client(
    "https://kf82hs9.giraffe.app",
    "your-anon-key"
)

response = (
    giraffe.table("profiles")
    .select("id, username, email, role")
    .order("created_at", desc=True)
    .limit(10)
    .execute()
)

print(response.data)`,

  curl: `curl -X GET \\
  'https://kf82hs9.giraffe.app/rest/v1/profiles?select=id,username,email,role&order=created_at.desc&limit=10' \\
  -H 'apikey: your-anon-key' \\
  -H 'Authorization: Bearer your-anon-key' \\
  -H 'Content-Type: application/json'`,
};

const tabs = [
  { key: "js", label: "JavaScript" },
  { key: "python", label: "Python" },
  { key: "curl", label: "cURL" },
] as const;

export function ExampleRequest() {
  const [lang, setLang] = useState<string>("js");

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Example request</CardTitle>
          <div className="flex items-center rounded-md border bg-muted/50 p-0.5">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setLang(tab.key)}
                className={`px-2 py-0.5 text-[11px] font-medium rounded-sm transition-colors ${
                  lang === tab.key
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <CodeBlock code={examples[lang]} />
      </CardContent>
    </Card>
  );
}
