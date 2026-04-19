# API 仕様書

## 目次

1. [REST API（Gateway）](#1-rest-apigateway)
2. [gRPC API（Functions Service）](#2-grpc-apifunctions-service)
3. [エラーレスポンス](#3-エラーレスポンス)

---

## 1. REST API（Gateway）

**Base URL:** `http://localhost:8080`

CORS はすべてのオリジンに対して許可されている（`Access-Control-Allow-Origin: *`）。

---

### GET /functions

登録されている関数の一覧を取得する。

**リクエスト**

パラメータなし。

**レスポンス** `200 OK`

```json
{
  "functions": [
    {
      "id": "3fc3fc02-d1ac-41af-9b6e-71e1068e3e54",
      "name": "hello",
      "runtime": "python3.12",
      "code": "print('hello world')",
      "created_at": "2026-04-19T07:30:00+09:00",
      "timeout_sec": 30
    }
  ]
}
```

---

### POST /functions

新しい関数を登録する。

**リクエストボディ** `application/json`

| フィールド    | 型     | 必須 | 説明                              |
|-------------|--------|------|-----------------------------------|
| name        | string | ✓    | 関数名（一意推奨）                  |
| runtime     | string | ✓    | `python3.12` または `node20`       |
| code        | string | ✓    | 実行するソースコード全文            |
| timeout_sec | number |      | タイムアウト秒数（省略時: 30 秒）   |

```json
{
  "name": "hello",
  "runtime": "python3.12",
  "code": "print('hello world')",
  "timeout_sec": 30
}
```

**レスポンス** `200 OK`

```json
{
  "id": "3fc3fc02-d1ac-41af-9b6e-71e1068e3e54",
  "name": "hello",
  "runtime": "python3.12",
  "code": "print('hello world')",
  "created_at": "2026-04-19T07:30:00+09:00",
  "timeout_sec": 30
}
```

---

### GET /functions/:id

指定した ID の関数を取得する。

**パスパラメータ**

| パラメータ | 説明 |
|----------|------|
| id       | 関数の UUID |

**レスポンス** `200 OK`

```json
{
  "id": "3fc3fc02-d1ac-41af-9b6e-71e1068e3e54",
  "name": "hello",
  "runtime": "python3.12",
  "code": "print('hello world')",
  "created_at": "2026-04-19T07:30:00+09:00",
  "timeout_sec": 30
}
```

**レスポンス** `404 Not Found`

```json
{ "error": "rpc error: code = NotFound desc = not found: record not found" }
```

---

### PATCH /functions/:id

関数のコード・名前・タイムアウトを部分更新する。

**パスパラメータ**

| パラメータ | 説明 |
|----------|------|
| id       | 関数の UUID |

**リクエストボディ** `application/json`

空文字・0 のフィールドは更新されない（`repository.Update` で無視される）。

| フィールド    | 型     | 説明                 |
|-------------|--------|----------------------|
| name        | string | 新しい関数名          |
| code        | string | 新しいソースコード     |
| timeout_sec | number | 新しいタイムアウト秒数 |

```json
{
  "code": "print('updated!')"
}
```

**レスポンス** `200 OK` — 更新後の `FunctionInfo`

---

### DELETE /functions/:id

関数を削除する。実行ログは残る。

**パスパラメータ**

| パラメータ | 説明 |
|----------|------|
| id       | 関数の UUID |

**レスポンス** `200 OK`

```json
{ "success": true }
```

---

### POST /functions/:id/execute

関数をコンテナで実行する。

**パスパラメータ**

| パラメータ | 説明 |
|----------|------|
| id       | 関数の UUID |

**リクエストボディ** `application/json`（すべて省略可）

| フィールド    | 型                    | 説明                                         |
|-------------|----------------------|----------------------------------------------|
| timeout_sec | number               | タイムアウト秒数（0 の場合は関数の設定値を使用）|
| env         | object (string→string) | コンテナに渡す環境変数                       |
| stdin       | string               | コンテナの標準入力に渡す文字列                |

```json
{
  "timeout_sec": 10,
  "env": { "API_KEY": "secret" },
  "stdin": "input data"
}
```

**レスポンス** `200 OK`

| フィールド   | 型     | 説明                          |
|------------|--------|-------------------------------|
| output     | string | stdout の内容                 |
| error      | string | stderr の内容                 |
| exit_code  | number | プロセス終了コード（0=正常）    |
| duration_ms| number | コンテナ起動〜終了の経過時間(ms)|

```json
{
  "output": "hello world\n",
  "error": "",
  "exit_code": 0,
  "duration_ms": 1234
}
```

**注意事項**

- Gateway 側のタイムアウトは 60 秒固定（`context.WithTimeout` 60s）
- 同時実行は最大 10 件。超過時は `500` エラーになる
- コンテナは実行完了後に自動削除される

---

### GET /functions/:id/logs

関数の実行履歴を取得する（最新順）。

**パスパラメータ**

| パラメータ | 説明 |
|----------|------|
| id       | 関数の UUID |

**レスポンス** `200 OK`

```json
{
  "logs": [
    {
      "id": "a1b2c3d4-...",
      "function_id": "3fc3fc02-...",
      "output": "hello world\n",
      "error": "",
      "exit_code": 0,
      "duration_ms": 1234,
      "created_at": "2026-04-19T07:35:00+09:00"
    }
  ]
}
```

---

### POST /functions/v1/:name

関数を **名前** で検索してそのまま実行する HTTP トリガーエンドポイント。

**パスパラメータ**

| パラメータ | 説明 |
|----------|------|
| name     | 関数名（`functions.name` カラムの値）|

**リクエストヘッダー**

`X-Env-` プレフィックスのヘッダーは環境変数としてコンテナに渡される。

```
X-Env-API_KEY: secret     →  コンテナ内 $API_KEY=secret
X-Env-DEBUG: true         →  コンテナ内 $DEBUG=true
```

**リクエストボディ**

任意のテキスト。コンテナの stdin に渡される。

**レスポンス** `200 OK` — `execute` と同じ形式

**内部処理の順序**

```
1. GetFunctionByName(name)   → function_id を取得
2. ExecuteFunction(function_id, env, stdin=body)
```

---

## 2. gRPC API（Functions Service）

**アドレス:** `functions:50055`（Docker 内）/ `localhost:50055`（ホストから）

**proto パッケージ:** `functions`

**サービス定義:** `proto/functions/functions.proto`

### grpcurl での動作確認

```bash
# 関数を作成
grpcurl -plaintext \
  -import-path ./proto -proto functions/functions.proto \
  -d '{"name":"hello","runtime":"python3.12","code":"print(\"hi\")","timeout_sec":30}' \
  localhost:50055 functions.FunctionsService/CreateFunction

# 一覧取得
grpcurl -plaintext \
  -import-path ./proto -proto functions/functions.proto \
  localhost:50055 functions.FunctionsService/ListFunctions

# 実行
grpcurl -plaintext \
  -import-path ./proto -proto functions/functions.proto \
  -d '{"function_id":"<UUID>","timeout_sec":10}' \
  localhost:50055 functions.FunctionsService/ExecuteFunction

# 実行ログ取得
grpcurl -plaintext \
  -import-path ./proto -proto functions/functions.proto \
  -d '{"function_id":"<UUID>"}' \
  localhost:50055 functions.FunctionsService/ListLogs
```

### RPC 一覧

| RPC 名             | リクエスト型               | レスポンス型              |
|--------------------|---------------------------|--------------------------|
| CreateFunction     | CreateFunctionRequest     | FunctionInfo             |
| ListFunctions      | ListFunctionsRequest      | ListFunctionsResponse    |
| GetFunction        | GetFunctionRequest        | FunctionInfo             |
| GetFunctionByName  | GetFunctionByNameRequest  | FunctionInfo             |
| UpdateFunction     | UpdateFunctionRequest     | FunctionInfo             |
| DeleteFunction     | DeleteFunctionRequest     | DeleteFunctionResponse   |
| ExecuteFunction    | ExecuteFunctionRequest    | ExecuteFunctionResponse  |
| ListLogs           | ListLogsRequest           | ListLogsResponse         |

### メッセージ型定義

#### FunctionInfo

| フィールド   | 型     | 説明                        |
|------------|--------|-----------------------------|
| id         | string | UUID                        |
| name       | string | 関数名                      |
| runtime    | string | ランタイム識別子             |
| code       | string | ソースコード                 |
| created_at | string | RFC3339 形式の作成日時       |
| timeout_sec| int32  | タイムアウト秒数             |

#### ExecuteFunctionRequest

| フィールド   | 型                 | 説明                      |
|------------|-------------------|---------------------------|
| function_id| string            | 実行する関数の UUID        |
| timeout_sec| int32             | 0 の場合は関数の設定値を使用|
| env        | map<string,string>| 環境変数                  |
| stdin      | string            | 標準入力                  |

#### ExecuteFunctionResponse

| フィールド   | 型     | 説明                    |
|------------|--------|-------------------------|
| output     | string | stdout                  |
| error      | string | stderr                  |
| exit_code  | int32  | 終了コード               |
| duration_ms| int64  | 実行時間（ミリ秒）        |

#### ExecutionLogInfo

| フィールド   | 型     | 説明                    |
|------------|--------|-------------------------|
| id         | string | UUID                    |
| function_id| string | 関連する関数の UUID      |
| output     | string | stdout                  |
| error      | string | stderr                  |
| exit_code  | int32  | 終了コード               |
| duration_ms| int64  | 実行時間（ミリ秒）        |
| created_at | string | RFC3339 形式の実行日時   |

---

## 3. エラーレスポンス

### REST エラー形式

```json
{ "error": "<メッセージ>" }
```

| HTTP ステータス | 発生条件 |
|--------------|---------|
| 400          | リクエストボディのパースエラー |
| 404          | 関数が見つからない（GetFunction, GetFunctionByName） |
| 500          | gRPC 呼び出しエラー全般（DB エラー、Docker エラーなど）|

### gRPC エラーコード

| コード          | HTTP 相当 | 発生条件 |
|----------------|----------|---------|
| OK             | 200      | 成功 |
| NotFound       | 404      | GetFunction/GetFunctionByName で対象なし |
| Internal       | 500      | DB エラー・Docker エラー・実行エラー |
| Unimplemented  | 501      | 未実装の RPC |
