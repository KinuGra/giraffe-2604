"use client";

import { CodeBlock } from "@/components/code-block";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EndpointList } from "@/features/api-docs/endpoint-list";
import { ExampleRequest } from "@/features/api-docs/example-request";
import { ParamsTable } from "@/features/api-docs/params-table";
import { RestReference } from "@/features/api-docs/rest-reference";
import { apiRoutes } from "@/lib/mock-data";
import { useState } from "react";

const sampleResponse = `{
  "data": [
    {
      "id": "9f2e…a31c",
      "username": "hinata",
      "email": "hinata@acorn.dev",
      "full_name": "Hinata Mori",
      "avatar_url": "https://cdn/u/1.png",
      "role": "admin",
      "is_verified": true,
      "created_at": "2025-11-14T08:22:01+09:00"
    },
    {
      "id": "2c1d…b482",
      "username": "sora_k",
      "email": "sora.k@acorn.dev",
      "full_name": "Sora Kurosawa",
      "avatar_url": "https://cdn/u/2.png",
      "role": "member",
      "is_verified": true,
      "created_at": "2025-12-02T14:08:55+09:00"
    }
  ],
  "count": 12,
  "status": 200
}`;

// Descriptions for the routes (Japanese)
const routeDescriptions: Record<number, string> = {
  0: "profiles テーブルからレコードの一覧を取得します。デフォルトでは最新 100 件が返されます。select / order / limit / offset のクエリパラメータで結果を絞り込めます。",
  1: "profiles テーブルに新しいレコードを挿入します。リクエストボディに JSON オブジェクトを渡してください。Prefer: return=representation ヘッダを付与すると、挿入されたレコードがレスポンスに含まれます。",
  2: "指定されたフィルタ条件に一致する profiles レコードを部分更新します。リクエストボディには更新したいフィールドのみを含めてください。",
  3: "指定されたフィルタ条件に一致する profiles レコードを削除します。成功時は 204 No Content を返します。",
  4: "posts テーブルからレコードの一覧を取得します。RLS ポリシーにより、認証ユーザーに紐づくレコードのみが返されます。",
  5: "search() ストアドプロシージャを実行します。全文検索やカスタムロジックを含む高度なクエリに使用してください。",
  6: "ユーザーの認証情報（email + password）を検証し、アクセストークンとリフレッシュトークンを返します。",
  7: "新しいユーザーアカウントを作成します。email と password は必須フィールドです。",
  8: "send-invoice Edge Function を呼び出します。invoiceId と email をリクエストボディに含めてください。",
};

export default function ApiDocsPage() {
  const [selectedIdx, setSelectedIdx] = useState(0);

  const route = apiRoutes[selectedIdx];
  const enrichedRoute = {
    ...route,
    description: routeDescriptions[selectedIdx] ?? "",
  };

  return (
    <div className="flex h-full">
      {/* Left panel */}
      <EndpointList selected={selectedIdx} onSelect={setSelectedIdx} />

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          <RestReference route={enrichedRoute} />
          <ExampleRequest />
          <ParamsTable />

          {/* Response card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Response</CardTitle>
            </CardHeader>
            <CardContent>
              <CodeBlock code={sampleResponse} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
