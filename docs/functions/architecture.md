# アーキテクチャ解説

## 目次

1. [システム全体像](#1-システム全体像)
2. [レイヤードアーキテクチャ](#2-レイヤードアーキテクチャ)
3. [通信フロー](#3-通信フロー)
4. [関数作成フロー](#4-関数作成フロー)
5. [関数実行フロー](#5-関数実行フロー)
6. [Docker コンテナ実行の仕組み](#6-docker-コンテナ実行の仕組み)
7. [並行実行制御](#7-並行実行制御)
8. [起動シーケンスと DI](#8-起動シーケンスと-di)
9. [Docker Compose 構成](#9-docker-compose-構成)

---

## 1. システム全体像

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser (Next.js / localhost:3000)                             │
│  frontend/src/app/dashboard/functions/page.tsx                  │
│  frontend/src/lib/functions-api.ts                              │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP/REST (JSON)
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  API Gateway  services/gateway/main.go  :8080                   │
│  (Gin フレームワーク + gRPC クライアント)                        │
└────────────────────────┬────────────────────────────────────────┘
                         │ gRPC (Protobuf / HTTP2)
                         │ functions:50055
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  Functions Service  services/functions/  :50055                 │
│                                                                 │
│  server/ ──► usecase/ ──► repository/ ──► PostgreSQL :5432     │
│                  │                                              │
│                  └──► Docker API (/var/run/docker.sock)         │
│                               │                                 │
│              ┌────────────────▼──────────────┐                 │
│              │  python:3.12-alpine (兄弟コンテナ) │             │
│              │  node:20-alpine     (兄弟コンテナ) │             │
│              └───────────────────────────────┘                 │
└─────────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  PostgreSQL  postgres:16  :5432                                 │
│  functions_db.functions        (関数定義)                       │
│  functions_db.execution_logs   (実行ログ)                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. レイヤードアーキテクチャ

依存は **内側への一方向のみ**。外側の層が内側を知るが、内側は外側を知らない。

```
main.go
  └── server/              proto の型 ↔ model の型 変換担当
        └── usecase/        ビジネスロジック（proto の型を一切知らない）
              └── repository/  DB 操作のみ（usecase を知らない）
                    └── model/   テーブル定義のみ（他層に依存しない）
```

### ディレクトリと責務

| ディレクトリ | ファイル | 責務 |
|------------|---------|------|
| `model/`   | function.go | GORM 構造体。テーブル定義のみ |
| `repository/` | function_repo.go | DB CRUD。`model` にのみ依存 |
| `usecase/` | execute.go | ビジネスロジック + Docker 実行。`repository` に依存 |
| `server/`  | server.go, convert.go | gRPC ハンドラ。`usecase` に依存。proto ↔ model 変換 |
| `main.go`  | — | DI・起動。全層を知る唯一の場所 |

### 変更の影響範囲

| 変更の種類 | 影響を受ける層 |
|-----------|-------------|
| proto フィールドを追加 | server 層のみ（convert.go を修正） |
| DB カラムを追加 | model + repository のみ |
| ビジネスロジックを変更 | usecase のみ |
| Docker 実行方法を変更 | usecase のみ |
| 別 DB に乗り換え | repository のみ |

### 型変換の流れ

```
gRPC リクエスト (pb.*)
        │  server.go: req.Name, req.Runtime など Go プリミティブ値に分解
        ▼
usecase 関数の引数 (string, int, ...)
        │  usecase: &model.Function{...} を組み立て
        ▼
model.Function (GORM モデル)
        │  repository: db.Create(f) など
        ▼
PostgreSQL

──── 戻り値は逆順 ────

model.Function
        │  convert.go: modelToProto(f)
        ▼
pb.FunctionInfo → gRPC レスポンス → Gateway → JSON → Frontend
```

---

## 3. 通信フロー

### フロントエンド → Gateway（HTTP/REST）

```
// functions-api.ts
fetch("http://localhost:8080/functions", {
  method: "POST",
  body: JSON.stringify({ name, runtime, code, timeout_sec })
})
```

レスポンスは snake_case（`created_at`, `exit_code`）で返るため、`mapFn()` / `mapResult()` / `mapLog()` で camelCase に変換してから React state に格納する。

### Gateway → Functions Service（gRPC）

- Gateway 起動時に **1 本の gRPC コネクション** を確立し、全リクエストで使い回す
- トランスポート: HTTP/2 + Protobuf（バイナリシリアライズ）
- 認証: なし（`insecure.NewCredentials()`）
- Docker ネットワーク内でサービス名 `functions` がそのままホスト名として解決される

---

## 4. 関数作成フロー

```
Frontend          Gateway          Functions Service     PostgreSQL
   │                 │                    │                   │
   │ POST /functions │                    │                   │
   │────────────────►│                    │                   │
   │                 │ gRPC               │                   │
   │                 │ CreateFunction     │                   │
   │                 │───────────────────►│                   │
   │                 │                    │ server.go         │
   │                 │                    │ → uc.Create()     │
   │                 │                    │                   │
   │                 │                    │ usecase           │
   │                 │                    │ timeout補完(≤0→30)│
   │                 │                    │ &model.Function{} │
   │                 │                    │                   │
   │                 │                    │ repo.Create(f)    │
   │                 │                    │──────────────────►│
   │                 │                    │ INSERT INTO       │
   │                 │                    │ (UUID はDBが生成)  │
   │                 │                    │◄──────────────────│
   │                 │                    │ f.ID が埋まる     │
   │                 │                    │                   │
   │                 │ pb.FunctionInfo    │                   │
   │                 │◄───────────────────│                   │
   │ 200 {id,...}    │                    │                   │
   │◄────────────────│                    │                   │
```

---

## 5. 関数実行フロー

```
Frontend     Gateway       Functions Service        Docker Daemon
   │            │                  │                      │
   │ POST       │                  │                      │
   │ /execute   │                  │                      │
   │───────────►│                  │                      │
   │            │ gRPC             │                      │
   │            │ ExecuteFunction  │                      │
   │            │─────────────────►│                      │
   │            │                  │ セマフォ確認(最大10並行)
   │            │                  │ 1. repo.FindByID()   │
   │            │                  │ 2. runtimeImages[]   │
   │            │                  │ 3. WithTimeout(n秒)  │
   │            │                  │ 4. ImagePull         │
   │            │                  │─────────────────────►│
   │            │                  │◄─────────────────────│
   │            │                  │ 5. ContainerCreate   │
   │            │                  │─────────────────────►│
   │            │                  │◄─────────────────────│
   │            │                  │ 6. ContainerStart    │
   │            │                  │─────────────────────►│
   │            │                  │   コード実行          │
   │            │                  │ 7. ContainerWait     │
   │            │                  │◄─────────────────────│
   │            │                  │   exitCode           │
   │            │                  │ 8. ContainerLogs     │
   │            │                  │◄─────────────────────│
   │            │                  │ 9. demuxLogs()       │
   │            │                  │   stdout/stderr分離  │
   │            │                  │ 10. ContainerRemove  │
   │            │                  │  (defer で必ず削除)  │
   │            │                  │─────────────────────►│
   │            │                  │ 11. repo.CreateLog() │
   │            │                  │  実行結果をDBに保存   │
   │            │ ExecuteResponse  │                      │
   │            │◄─────────────────│                      │
   │ 200        │                  │                      │
   │◄───────────│                  │                      │
```

---

## 6. Docker コンテナ実行の仕組み

### Docker Socket マウント方式

```
Host OS
  /var/run/docker.sock  ← Docker デーモンへの Unix ソケット
         ↑ マウント
  ┌────────────────────────┐
  │  functions コンテナ    │  Docker SDK 経由でデーモンに命令
  └────────────────────────┘
         ↓ 起動（兄弟として）
  ┌────────────────────────┐
  │  python:3.12-alpine    │  ユーザーのコードが実行される
  └────────────────────────┘
```

起動されたコンテナは functions の「子」ではなく、ホスト Docker 管理下の **兄弟コンテナ**。

### 実行コマンドの組み立て

| runtime    | コンテナ内コマンド              |
|------------|-------------------------------|
| python3.12 | `["python3", "-c", "<code>"]` |
| node20     | `["node", "-e", "<code>"]`    |

### stdout / stderr の分離（demux）

`ContainerLogs` は stdout と stderr を 1 本のストリームで返す。各フレームに 8 バイトのヘッダーが付く：

```
byte[0]   : stream type (1=stdout, 2=stderr)
byte[1-3] : padding (0x00)
byte[4-7] : payload size (big-endian uint32)
byte[8..] : payload
```

`demuxLogs()` がヘッダーを読み取り、stdout / stderr の `bytes.Buffer` に振り分ける。

### タイムアウトの伝播

```go
ctx, cancel := context.WithTimeout(context.Background(), time.Duration(timeout)*time.Second)
defer cancel()
```

この `ctx` を `ImagePull` / `ContainerCreate` / `ContainerStart` / `ContainerWait` の全操作に渡すため、タイムアウトは一連の操作全体に効く。

---

## 7. 並行実行制御

`FunctionUsecase` はバッファサイズ 10 のチャネルをセマフォとして保持する。

```go
sem: make(chan struct{}, 10)
```

```
Execute 呼び出し
    │
    ├─ 空きあり(< 10件) → sem に送信してロック取得 → 実行 → defer で解放
    │
    └─ 満杯(= 10件)    → default: 即エラー返却
                         "too many concurrent executions (max 10)"
```

コンテナ起動待ちで goroutine が詰まらないよう、11 件目以降は即座に拒否する。

---

## 8. 起動シーケンスと DI

`main.go` の処理順序：

```
1. DATABASE_URL 環境変数から接続文字列を取得
2. gorm.Open() で PostgreSQL に接続
3. db.AutoMigrate() でテーブルを作成・更新
4. DI（依存性注入）
     repo := repository.NewFunctionRepo(db)
     uc   := usecase.NewFunctionUsecase(repo)  ← sem も初期化
     srv  := server.NewFunctionsServer(uc)
5. net.Listen("tcp", ":50055") でソケットをオープン
6. grpc.NewServer() でサーバー作成
7. pb.RegisterFunctionsServiceServer(grpcServer, srv)
8. grpcServer.Serve(lis) でブロッキング待機
```

各層のコンストラクタが依存オブジェクトを引数で受け取る（DI）ため、main.go だけが「どの実装を使うか」を知っている。

---

## 9. Docker Compose 構成

### サービス構成

| サービス  | イメージ/ビルド | ポート | 役割 |
|---------|--------------|--------|------|
| postgres  | postgres:16  | 5432   | データストア |
| functions | ビルド       | 50055  | gRPC サービス本体 |
| gateway   | ビルド       | 8080   | REST ↔ gRPC ブリッジ |
| frontend  | ビルド       | 3000   | Next.js ダッシュボード |

### 起動順序

```
postgres（healthcheck: pg_isready が成功するまで待機）
    ↓ condition: service_healthy
functions（DATABASE_URL で postgres に接続・AutoMigrate）
    ↓
gateway（FUNCTIONS_GRPC_ADDR=functions:50055）
    ↓
frontend（NEXT_PUBLIC_GATEWAY_URL=http://gateway:8080）
```

### Docker Socket マウント

```yaml
functions:
  volumes:
    - /var/run/docker.sock:/var/run/docker.sock
```

このマウントがないと `usecase.Execute()` の `client.NewClientWithOpts(client.FromEnv)` がソケットを見つけられず、関数実行が全件失敗する。
