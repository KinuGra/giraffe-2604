import { CodeBlock } from "@/components/code-block";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const tsCode = `import { createClient } from '@giraffe/client'

const g = createClient(
  process.env.GIRAFFE_URL!,
  process.env.GIRAFFE_ANON_KEY!
)

const { data } = await g
  .from('profiles')
  .select('*')
  .limit(10)`;

const pyCode = `from giraffe import create_client

g = create_client(
    os.environ["GIRAFFE_URL"],
    os.environ["GIRAFFE_ANON_KEY"],
)

rows = g.table("profiles").select("*").limit(10).execute()`;

const curlCode = `curl 'https://kf82hs9.giraffe.app/rest/v1/profiles?select=*&limit=10' \\
  -H "apikey: $GIRAFFE_ANON_KEY" \\
  -H "Authorization: Bearer $GIRAFFE_ANON_KEY"`;

export function SdkSnippets() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Getting started</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="typescript">
          <TabsList>
            <TabsTrigger value="typescript">TypeScript</TabsTrigger>
            <TabsTrigger value="python">Python</TabsTrigger>
            <TabsTrigger value="curl">cURL</TabsTrigger>
          </TabsList>
          <TabsContent value="typescript">
            <CodeBlock code={tsCode} />
          </TabsContent>
          <TabsContent value="python">
            <CodeBlock code={pyCode} />
          </TabsContent>
          <TabsContent value="curl">
            <CodeBlock code={curlCode} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
