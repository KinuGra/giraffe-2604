# コードを登録・実行できる Web サービス — 完全実装ガイド

このガイドを読めば、今回実装したシステムを 0 から 1 人で作れるようになる。
技術の「なぜ」から「どう書くか」まで一気通貫で解説する。

---

## 目次

### 第 1 章 — 全体像
1. [何を作ったか](#1-何を作ったか)
2. [使用技術マップ](#2-使用技術マップ)
3. [リクエストの一生](#3-リクエストの一生)

### 第 2 章 — Protocol Buffers と gRPC
4. [なぜ gRPC を使うのか](#4-なぜ-grpc-を使うのか)
5. [Protocol Buffers の書き方](#5-protocol-buffers-の書き方)
6. [protoc でコードを生成する](#6-protoc-でコードを生成する)
7. [生成コードの読み方](#7-生成コードの読み方)

### 第 3 章 — バックエンド（Functions サービス）
8. [レイヤードアーキテクチャとは](#8-レイヤードアーキテクチャとは)
9. [model 層 — GORM でテーブル定義](#9-model-層--gorm-でテーブル定義)
10. [repository 層 — DB の CRUD](#10-repository-層--db-の-crud)
11. [usecase 層 — ビジネスロジック](#11-usecase-層--ビジネスロジック)
12. [Docker SDK でコードを実行する](#12-docker-sdk-でコードを実行する)
13. [server 層 — gRPC ハンドラ](#13-server-層--grpc-ハンドラ)
14. [main.go — DI とサーバー起動](#14-maingo--di-とサーバー起動)

### 第 4 章 — Gateway（REST → gRPC ブリッジ）
15. [なぜ Gateway が必要か](#15-なぜ-gateway-が必要か)
16. [Gin で REST API を作る](#16-gin-で-rest-api-を作る)
17. [gRPC クライアントを使う](#17-grpc-クライアントを使う)
18. [CORS とは何か](#18-cors-とは何か)

### 第 5 章 — フロントエンド（Next.js + TypeScript）
19. [Next.js App Router の基本](#19-nextjs-app-router-の基本)
20. [TypeScript の型設計](#20-typescript-の型設計)
21. [fetch で API を叩く](#21-fetch-で-api-を叩く)
22. [React の状態管理](#22-react-の状態管理)
23. [コンポーネント設計](#23-コンポーネント設計)

### 第 6 章 — インフラ
24. [Dockerfile — マルチステージビルド](#24-dockerfile--マルチステージビルド)
25. [docker-compose で複数サービスを繋ぐ](#25-docker-compose-で複数サービスを繋ぐ)
26. [Go modules と replace ディレクティブ](#26-go-modules-と-replace-ディレクティブ)

### 第 7 章 — 実装チェックリスト
27. [ゼロから実装する手順](#27-ゼロから実装する手順)
28. [よくあるハマりポイント](#28-よくあるハマりポイント)

---

## 第 1 章 — 全体像

## 1. 何を作ったか

「Python や JavaScript のコードを登録して、ブラウザから実行できる Web サービス」。
AWS Lambda の極小版。

### できること
- ブラウザからコードを登録・編集・保存
- ボタン1つでコードを Docker コンテナ上で実行
- stdout / stderr / 実行時間を画面に表示
- 登録したコードの削除

---

## 2. 使用技術マップ

```
┌─────────────────────────────────────────────────────────────────┐
│  Frontend  (Next.js 15 + TypeScript)                            │
│  Port: 3000                                                     │
│  役割: UI の表示・ユーザー操作                                   │
└───────────────────────┬─────────────────────────────────────────┘
                        │ HTTP/JSON  (fetch API)
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│  Gateway  (Go + Gin)                                            │
│  Port: 8080                                                     │
│  役割: REST → gRPC の変換、CORS 対応                            │
└───────────────────────┬─────────────────────────────────────────┘
                        │ gRPC (HTTP/2 + Protocol Buffers)
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│  Functions Service  (Go + gRPC)                                 │
│  Port: 50055                                                    │
│  役割: 関数の CRUD、Docker コンテナでのコード実行               │
└────────────┬───────────────────────┬────────────────────────────┘
             │ SQL (GORM)            │ Docker API (Unix socket)
             ▼                       ▼
      ┌─────────────┐        ┌──────────────────┐
      │ PostgreSQL  │        │  Docker daemon   │
      │ Port: 5432  │        │  (ホスト共有)    │
      └─────────────┘        └──────────────────┘
```

### 技術スタック一覧

| レイヤー | 技術 | 役割 |
|---|---|---|
| Frontend | Next.js 15 (App Router) | React フレームワーク |
| Frontend | TypeScript | 型安全な JavaScript |
| Frontend | shadcn/ui | UI コンポーネント |
| Gateway | Go + Gin | HTTP サーバー |
| Functions | Go | バックエンドロジック |
| Functions | gRPC | サービス間通信 |
| Functions | Protocol Buffers | 通信のデータ形式 |
| Functions | GORM | ORM（SQL を書かずに DB 操作） |
| Functions | Docker SDK for Go | コンテナ操作 |
| DB | PostgreSQL | リレーショナル DB |
| インフラ | Docker / docker-compose | コンテナ実行環境 |

---

## 3. リクエストの一生

「Invoke ボタンを押してから結果が返るまで」を追う。

```
① ブラウザ
   |  クリック → handleInvoke()
   |  fetch("http://localhost:8080/functions/{id}/execute", {method: "POST"})
   ↓

② Gateway (Go/Gin)
   |  POST /functions/:id/execute を受信
   |  pb.ExecuteFunctionRequest{FunctionId: id} を構築
   |  gRPC で Functions サービスに転送
   ↓

③ Functions Service (Go/gRPC)
   |  ExecuteFunction() ハンドラが呼ばれる
   |  usecase.Execute(id) を呼ぶ
   ↓

④ usecase/execute.go
   |  DB から関数情報を取得（code, runtime, timeout）
   |  Docker SDK で python:3.12-alpine イメージを指定
   |  コンテナを作成 → 起動
   |  コンテナの終了を待つ（channel で受信）
   |  stdout/stderr を取得・分離
   |  ExecutionLog を DB に保存
   ↓

⑤ レスポンスを逆順に返す
   Functions → gRPC → Gateway → HTTP/JSON → fetch → React state 更新 → 画面表示
```

---

## 第 2 章 — Protocol Buffers と gRPC

## 4. なぜ gRPC を使うのか

### REST（HTTP + JSON）との比較

```
REST の通信:
POST /functions
Content-Type: application/json
{"name": "hello", "runtime": "python3.12", "code": "print('hi')"}

→ テキストなので人間が読める
→ 型の保証がない（どんな JSON でも送れてしまう）
→ HTTP/1.1（1リクエストずつ）
```

```
gRPC の通信:
バイナリ（人間には読めない）
型は .proto ファイルで厳密に定義
→ 型が違うとコンパイルエラーになる
→ HTTP/2（多重化、高速）
```

**マイクロサービス間の内部通信には gRPC が向いている。**
外部（ブラウザ）向けには REST を使い、Gateway が変換する。

### gRPC の全体像

```
.proto ファイル（人間が書く「契約書」）
       ↓  protoc（コード生成ツール）
Go の struct / interface（触ってはいけない自動生成コード）
       ↓  実装
自分で書くサーバーコード（interface を implements）
```

---

## 5. Protocol Buffers の書き方

`proto/functions/functions.proto` の全体解説:

```proto
syntax = "proto3";
// ↑ proto のバージョン。常に proto3 を使う。

package functions;
// ↑ proto の名前空間。Go のパッケージとは別の概念。

option go_package = "github.com/KinuGra/giraffe-2604/gen/functions";
// ↑ 生成される Go コードの import パスを指定する。
//   これを変えると go import が壊れる。

// ─── サービス定義 ────────────────────────────────────────
// 「このサービスはどんな RPC（メソッド）を持つか」を定義する
service FunctionsService {
  rpc CreateFunction(CreateFunctionRequest) returns (FunctionInfo);
  rpc ListFunctions(ListFunctionsRequest)   returns (ListFunctionsResponse);
  rpc GetFunction(GetFunctionRequest)       returns (FunctionInfo);
  rpc UpdateFunction(UpdateFunctionRequest) returns (FunctionInfo);
  rpc ExecuteFunction(ExecuteFunctionRequest) returns (ExecuteFunctionResponse);
  rpc DeleteFunction(DeleteFunctionRequest) returns (DeleteFunctionResponse);
}

// ─── メッセージ定義 ──────────────────────────────────────
// リクエスト・レスポンスの「型」を定義する

message CreateFunctionRequest {
  string name        = 1;  // = 1 はフィールド番号（バイナリ上の識別子）
  string runtime     = 2;  // 番号は一度決めたら絶対に変えない
  string code        = 3;
  int32  timeout_sec = 4;
}

message FunctionInfo {
  string id          = 1;
  string name        = 2;
  string runtime     = 3;
  string code        = 4;
  string created_at  = 5;
  int32  timeout_sec = 6;
}

message UpdateFunctionRequest {
  string function_id = 1;
  string name        = 2;
  string code        = 3;
  int32  timeout_sec = 4;
}

message ExecuteFunctionRequest {
  string function_id = 1;
  int32  timeout_sec = 2;
}

message ExecuteFunctionResponse {
  string output      = 1;  // stdout
  string error       = 2;  // stderr
  int32  exit_code   = 3;
  int64  duration_ms = 4;
}
```

### proto の型対応表

| proto 型 | Go 型 | 用途 |
|---|---|---|
| `string` | `string` | テキスト |
| `int32` | `int32` | 整数（小） |
| `int64` | `int64` | 整数（大）、ms 単位時間など |
| `bool` | `bool` | フラグ |
| `repeated T` | `[]T` | 配列・リスト |

### フィールド番号の鉄則

- `= 1`, `= 2` はバイナリ上の識別子
- **一度決めたら変更・再利用禁止**（後方互換性が壊れる）
- 1〜15 は 1 バイト（頻繁に使うフィールドに割り当てる）
- 16〜2047 は 2 バイト

---

## 6. protoc でコードを生成する

```bash
protoc \
  --go_out=./gen \           # メッセージの Go コードを gen/ に出力
  --go-grpc_out=./gen \      # gRPC クライアント/サーバーの Go コードを出力
  --go_opt=paths=source_relative \
  --go-grpc_opt=paths=source_relative \
  -I proto \                 # .proto ファイルの検索ルート
  proto/functions/functions.proto
```

実行すると 2 ファイルが生成される:

| ファイル | 内容 |
|---|---|
| `gen/functions/functions.pb.go` | メッセージ型の struct と Getter |
| `gen/functions/functions_grpc.pb.go` | サービスの interface、クライアント実装、サーバー登録関数 |

**これらのファイルは絶対に手編集しない。** proto を変えて再生成する。

---

## 7. 生成コードの読み方

`functions_grpc.pb.go` の重要な部分だけ抜粋:

```go
// ① サーバーが実装すべき interface（protoc が生成）
type FunctionsServiceServer interface {
    CreateFunction(context.Context, *CreateFunctionRequest) (*FunctionInfo, error)
    ListFunctions(context.Context, *ListFunctionsRequest)   (*ListFunctionsResponse, error)
    // ... 全 RPC が並ぶ
    mustEmbedUnimplementedFunctionsServiceServer()
}

// ② デフォルト実装（全メソッドが codes.Unimplemented を返す）
type UnimplementedFunctionsServiceServer struct{}
func (UnimplementedFunctionsServiceServer) CreateFunction(...) { ... }

// ③ サーバーを gRPC サーバーに登録する関数
func RegisterFunctionsServiceServer(s grpc.ServiceRegistrar, srv FunctionsServiceServer)
```

自分のサーバーは `UnimplementedFunctionsServiceServer` を **embed** し、
必要な RPC だけ override する。

```go
// 自分で書くサーバー
type FunctionsServer struct {
    pb.UnimplementedFunctionsServiceServer  // ← embed（残りのメソッドのデフォルト実装）
    uc *usecase.FunctionUsecase
}

// 実装したいメソッドだけ override
func (s *FunctionsServer) CreateFunction(ctx context.Context, req *pb.CreateFunctionRequest) (*pb.FunctionInfo, error) {
    // ...
}
```

---

## 第 3 章 — バックエンド（Functions サービス）

## 8. レイヤードアーキテクチャとは

依存関係を一方向に保つ設計パターン。

```
main.go        （組み立て担当。全層を知る唯一の場所）
  └── server/  （gRPC ハンドラ。proto の型 ↔ model の型 変換）
        └── usecase/  （ビジネスロジック。proto を知らない）
              └── repository/  （DB 操作。usecase を知らない）
                    └── model/  （テーブル定義。他の層に依存しない）
```

### なぜこの順番か

```
悪い例（全部 main.go に書く）:
func main() {
    db := gorm.Open(...)
    grpcServer.CreateFunction = func(req) {
        db.Create(&Function{Name: req.Name, ...})
        return &pb.FunctionInfo{...}
    }
}
→ テストできない。変更が全部に波及する。
```

```
良い例（レイヤーを分ける）:
- model の変更  → model だけ変えればいい
- DB の変更     → repository だけ変えればいい
- ビジネスロジックの変更 → usecase だけ変えればいい
- proto の変更  → server だけ変えればいい
```

**各層は「自分より内側（下位）の関心事」しか知らない。**

---

## 9. model 層 — GORM でテーブル定義

`model/function.go`:

```go
package model

import "time"

type Function struct {
    ID         string    `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
    //                    ↑ PostgreSQL の gen_random_uuid() で UUID 自動生成
    Name       string    `gorm:"not null"`
    Runtime    string    `gorm:"not null"`
    Code       string    `gorm:"type:text;not null"`
    //                    ↑ text = 可変長・長さ制限なし
    TimeoutSec int       `gorm:"default:30;not null"`
    CreatedAt  time.Time  // GORM が INSERT 時に自動セット
    UpdatedAt  time.Time  // GORM が UPDATE 時に自動セット
}

type ExecutionLog struct {
    ID         string    `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
    FunctionID string    `gorm:"type:uuid;not null;index"`
    //                                              ↑ 検索用インデックス
    Output     string    `gorm:"type:text"`
    Error      string    `gorm:"type:text"`
    ExitCode   int
    DurationMs int64
    CreatedAt  time.Time
}
```

### struct タグの読み方

```
`gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
       ─────────  ─────────────────────────  ──────────
        カラム型        DB デフォルト値         主キー指定
```

複数の設定は `;` で区切る。

### AutoMigrate

```go
db.AutoMigrate(&model.Function{}, &model.ExecutionLog{})
```

- struct の定義を見て **テーブルがなければ CREATE TABLE**
- カラムが増えていれば **ALTER TABLE ADD COLUMN**
- カラム削除はしない（安全）
- アプリ起動時に毎回呼んでも問題ない

---

## 10. repository 層 — DB の CRUD

`repository/function_repo.go`:

```go
package repository

import (
    "github.com/KinuGra/giraffe-2604/services/functions/model"
    "gorm.io/gorm"
)

type FunctionRepo struct {
    db *gorm.DB  // GORM のコネクションを保持
}

func NewFunctionRepo(db *gorm.DB) *FunctionRepo {
    return &FunctionRepo{db: db}
}
```

### GORM の基本操作

```go
// CREATE
func (r *FunctionRepo) Create(f *model.Function) error {
    return r.db.Create(f).Error
    //          ↑ INSERT INTO functions ...
    //            UUID は DB が自動生成して f.ID に書き戻す
}

// READ（1件）
func (r *FunctionRepo) FindByID(id string) (*model.Function, error) {
    var f model.Function
    err := r.db.First(&f, "id = ?", id).Error
    //           ↑ SELECT * FROM functions WHERE id = ? LIMIT 1
    return &f, err
}

// READ（全件）
func (r *FunctionRepo) FindAll() ([]model.Function, error) {
    var funcs []model.Function
    err := r.db.Find(&funcs).Error
    //           ↑ SELECT * FROM functions
    return funcs, err
}

// UPDATE（部分更新）
func (r *FunctionRepo) Update(id, name, code string, timeoutSec int) (*model.Function, error) {
    var f model.Function
    r.db.First(&f, "id = ?", id)  // 既存レコードを取得
    if name != "" { f.Name = name }
    if code != "" { f.Code = code }
    if timeoutSec > 0 { f.TimeoutSec = timeoutSec }
    err := r.db.Save(&f).Error   // UPDATE functions SET ... WHERE id = ?
    return &f, err
}

// DELETE
func (r *FunctionRepo) Delete(id string) error {
    return r.db.Delete(&model.Function{}, "id = ?", id).Error
}
```

### SQL インジェクション対策

```go
// ❌ 危険（SQL インジェクション可能）
r.db.Where("id = '" + id + "'")

// ✅ 安全（? プレースホルダーを使う）
r.db.First(&f, "id = ?", id)
```

`?` を使うと GORM（内部は pgx ドライバ）が自動でエスケープする。
**文字列結合で SQL を作ってはいけない。**

---

## 11. usecase 層 — ビジネスロジック

usecase が守るべきルール: **proto の型（`pb.*`）を一切 import しない。**

```go
package usecase

// ビジネスロジックの入出力は Go のプリミティブ型か model の型だけ
func (u *FunctionUsecase) Create(name, runtime, code string, timeoutSec int) (*model.Function, error) {
    if timeoutSec <= 0 {
        timeoutSec = 30  // ← ビジネスルール（デフォルト値）をここで定義
    }
    f := &model.Function{
        Name: name, Runtime: runtime, Code: code, TimeoutSec: timeoutSec,
    }
    return f, u.repo.Create(f)
}

func (u *FunctionUsecase) Update(id, name, code string, timeoutSec int) (*model.Function, error) {
    return u.repo.Update(id, name, code, timeoutSec)
}
```

---

## 12. Docker SDK でコードを実行する

### なぜ Docker を使うか

コードを `os/exec` で直接実行すると、悪意あるコードがサーバーを破壊できる。
Docker コンテナは Linux の namespace・cgroup で隔離されているため安全。

```
悪意あるコード: "import os; os.system('rm -rf /')"
→ コンテナ内で実行 → コンテナが壊れるだけ → ホストは無傷
```

### Docker in Docker vs Socket マウント

```yaml
# docker-compose.yaml
functions:
  volumes:
    - /var/run/docker.sock:/var/run/docker.sock
```

`/var/run/docker.sock` はホストの Docker デーモンへの Unix ソケット。
これをマウントすることで、Functions コンテナからホストの Docker を操作できる。

起動されたコンテナは Functions コンテナの**子ではなく兄弟**として動く:

```
ホスト Docker
├── functions コンテナ（常時起動）
├── postgres コンテナ（常時起動）
└── python:3.12-alpine コンテナ（Execute 時だけ起動・終了）← 兄弟
```

### Execute 関数の詳細

```go
func (u *FunctionUsecase) Execute(id string, timeoutSec int) (*ExecuteResult, error) {
    // 1. DB から関数情報を取得
    f, _ := u.repo.FindByID(id)

    // 2. runtime → Docker イメージの対応表
    runtimeImages := map[string]string{
        "python3.12": "python:3.12-alpine",
        "node20":     "node:20-alpine",
    }
    image := runtimeImages[f.Runtime]

    // 3. タイムアウト付き context
    //    この ctx を使う全操作（Pull/Create/Start/Wait）に自動でタイムアウトが効く
    ctx, cancel := context.WithTimeout(context.Background(), time.Duration(timeout)*time.Second)
    defer cancel()  // 関数を抜けたら必ずキャンセル

    // 4. Docker クライアント作成
    //    client.FromEnv → DOCKER_HOST 環境変数 or /var/run/docker.sock を使う
    cli, _ := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
    defer cli.Close()

    // 5. イメージを pull（なければダウンロード、あればキャッシュを使う）
    rc, _ := cli.ImagePull(ctx, image, dockerimage.PullOptions{})
    io.Copy(io.Discard, rc)  // pull の進捗出力を捨てる
    rc.Close()

    // 6. 実行コマンドを構築
    // python3.12 → ["python3", "-c", "print('hello')"]
    // node20     → ["node",    "-e", "console.log('hi')"]
    cmd := []string{"python3", "-c", f.Code}

    // 7. コンテナを作成（まだ起動しない）
    resp, _ := cli.ContainerCreate(ctx, &container.Config{
        Image: image,
        Cmd:   cmd,
    }, nil, nil, nil, "")
    containerID := resp.ID

    // 8. 関数を抜けるときに必ずコンテナを削除
    defer cli.ContainerRemove(context.Background(), containerID, container.RemoveOptions{Force: true})

    // 9. コンテナを起動
    start := time.Now()
    cli.ContainerStart(ctx, containerID, container.StartOptions{})

    // 10. コンテナの終了を待つ（channel で受け取る）
    statusCh, errCh := cli.ContainerWait(ctx, containerID, container.WaitConditionNotRunning)
    var exitCode int
    select {
    case waitResp := <-statusCh:
        exitCode = int(waitResp.StatusCode)  // 0=正常, 1=エラー
    case err := <-errCh:
        return nil, err  // タイムアウトや Docker エラー
    }
    durationMs := time.Since(start).Milliseconds()

    // 11. ログを取得（stdout と stderr が混在したストリーム）
    logs, _ := cli.ContainerLogs(ctx, containerID, container.LogsOptions{
        ShowStdout: true,
        ShowStderr: true,
    })

    // 12. stdout / stderr に分離（後述）
    var stdout, stderr bytes.Buffer
    demuxLogs(logs, &stdout, &stderr)

    return &ExecuteResult{
        Output: stdout.String(), Error: stderr.String(),
        ExitCode: exitCode, DurationMs: durationMs,
    }, nil
}
```

### Docker multiplexed stream の分離

`ContainerLogs` は stdout と stderr を **1 本のストリームで混在** して返す。
8 バイトのヘッダーで各フレームの種類とサイズが分かる。

```
ヘッダー（8バイト）
┌──┬──────────┬──────────────────┐
│ 0 │  1 2 3   │   4  5  6  7    │
│タイプ│ 予約(0) │ ペイロードサイズ  │
└──┴──────────┴──────────────────┘
type: 1 = stdout, 2 = stderr

ペイロード（可変長）
┌────────────────────┐
│ 実際のログ文字列   │
└────────────────────┘
```

```go
func demuxLogs(r io.Reader, stdout, stderr *bytes.Buffer) error {
    hdr := make([]byte, 8)
    for {
        if _, err := io.ReadFull(r, hdr); err != nil {
            return nil  // EOF
        }
        // ビッグエンディアンで 4 バイト → int に変換
        size := int(hdr[4])<<24 | int(hdr[5])<<16 | int(hdr[6])<<8 | int(hdr[7])
        //           ↑ 最上位バイトを 24 ビット左シフトして OR で結合
        buf := make([]byte, size)
        io.ReadFull(r, buf)
        switch hdr[0] {
        case 1: stdout.Write(buf)
        case 2: stderr.Write(buf)
        }
    }
}
```

---

## 13. server 層 — gRPC ハンドラ

```go
package server

type FunctionsServer struct {
    pb.UnimplementedFunctionsServiceServer  // 未実装メソッドのデフォルト実装
    uc *usecase.FunctionUsecase
}

// proto interface を満たす実装
func (s *FunctionsServer) CreateFunction(ctx context.Context, req *pb.CreateFunctionRequest) (*pb.FunctionInfo, error) {
    // ① proto の型 → プリミティブ型に変換して usecase を呼ぶ
    f, err := s.uc.Create(req.Name, req.Runtime, req.Code, int(req.TimeoutSec))
    if err != nil {
        // ② エラーを gRPC のエラー型に変換
        return nil, status.Errorf(codes.Internal, "create failed: %v", err)
    }
    // ③ model の型 → proto の型に変換して返す
    return modelToProto(f), nil
}
```

### gRPC エラーコード

| コード | HTTP 相当 | 使いどころ |
|---|---|---|
| `codes.OK` | 200 | 成功 |
| `codes.NotFound` | 404 | レコードが存在しない |
| `codes.InvalidArgument` | 400 | リクエストが不正 |
| `codes.Internal` | 500 | サーバー内部エラー |
| `codes.Unimplemented` | 501 | 未実装（デフォルト） |

### convert.go — model ↔ proto 変換

変換ロジックを専用ファイルに分けることで server.go が読みやすくなる。

```go
// server/convert.go
func modelToProto(f *model.Function) *pb.FunctionInfo {
    return &pb.FunctionInfo{
        Id:         f.ID,
        Name:       f.Name,
        Runtime:    f.Runtime,
        Code:       f.Code,
        TimeoutSec: int32(f.TimeoutSec),
        CreatedAt:  f.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
        //                              ↑ Go の時刻フォーマットは「基準時刻」で指定する
        //                                2006=年 01=月 02=日 15=時 04=分 05=秒
    }
}
```

---

## 14. main.go — DI とサーバー起動

```go
func main() {
    // 1. 環境変数から DB 接続文字列を取得
    dsn := os.Getenv("DATABASE_URL")
    // "postgres://dev:dev@postgres:5432/functions_db?sslmode=disable"

    // 2. DB 接続
    db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})

    // 3. テーブル自動作成
    db.AutoMigrate(&model.Function{}, &model.ExecutionLog{})

    // 4. DI（依存性注入）— 下位層から順番に組み立てる
    repo := repository.NewFunctionRepo(db)   // DB を注入
    uc   := usecase.NewFunctionUsecase(repo) // repo を注入
    srv  := server.NewFunctionsServer(uc)    // uc を注入

    // 5. TCP ポートを開く
    lis, _ := net.Listen("tcp", ":50055")

    // 6. gRPC サーバーを作成して実装を登録
    grpcServer := grpc.NewServer()
    pb.RegisterFunctionsServiceServer(grpcServer, srv)

    // 7. ブロッキングで起動
    grpcServer.Serve(lis)
}
```

### DI（Dependency Injection）とは

```go
// DI なし — テストしにくい（DB をモックできない）
type FunctionUsecase struct{}
func (u *FunctionUsecase) Create(...) {
    db := gorm.Open(...)  // 内部で勝手に DB 接続
}

// DI あり — テスト時に fake を注入できる
type FunctionUsecase struct {
    repo *repository.FunctionRepo  // 外から渡してもらう
}
func NewFunctionUsecase(repo *repository.FunctionRepo) *FunctionUsecase {
    return &FunctionUsecase{repo: repo}
}
```

main.go だけが「どの実装を使うか」を知っている。

---

## 第 4 章 — Gateway（REST → gRPC ブリッジ）

## 15. なぜ Gateway が必要か

```
ブラウザ → gRPC は直接できない
  理由: gRPC は HTTP/2 を使うが、ブラウザは HTTP/2 の
        Trailers（gRPC が必要とする HTTP ヘッダーの末尾）を扱えない

解決策: Gateway が HTTP/1.1（REST）を受け取り、gRPC に変換する

ブラウザ ─(REST/JSON)→ Gateway ─(gRPC/Protobuf)→ Functions Service
```

---

## 16. Gin で REST API を作る

Gin は Go の HTTP フレームワーク。Express（Node.js）に似た書き方。

```go
r := gin.Default()

// GET /functions → 関数一覧
r.GET("/functions", func(c *gin.Context) {
    // c.JSON で JSON レスポンスを返す
    c.JSON(http.StatusOK, gin.H{"functions": []...})
})

// POST /functions → 関数作成
r.POST("/functions", func(c *gin.Context) {
    var req SomeStruct
    if err := c.ShouldBindJSON(&req); err != nil {
        // リクエスト JSON のパースに失敗したら 400
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    // ...
})

// パスパラメータ
r.GET("/functions/:id", func(c *gin.Context) {
    id := c.Param("id")  // :id の値を取得
    // ...
})

r.Run(":8080")  // サーバー起動
```

---

## 17. gRPC クライアントを使う

Gateway は Functions サービスの gRPC クライアントとして動く。

```go
// 接続作成
conn, err := grpc.NewClient(
    "functions:50055",  // docker-compose 内のサービス名で解決される
    grpc.WithTransportCredentials(insecure.NewCredentials()),
    // ↑ TLS なし（開発環境）
)
defer conn.Close()

// クライアント作成（生成コードの関数を使う）
client := pb.NewFunctionsServiceClient(conn)

// RPC 呼び出し
resp, err := client.CreateFunction(ctx, &pb.CreateFunctionRequest{
    Name:    "hello",
    Runtime: "python3.12",
    Code:    "print('hi')",
})
// resp は *pb.FunctionInfo
```

### context.WithTimeout で期限を設ける

```go
ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
defer cancel()
// この ctx を gRPC 呼び出しに渡すと、5秒でタイムアウトする
resp, err := client.ListFunctions(ctx, &pb.ListFunctionsRequest{})
```

---

## 18. CORS とは何か

**Cross-Origin Resource Sharing** — 異なるオリジン間のリクエストを制御する仕組み。

```
Frontend: http://localhost:3000
Gateway:  http://localhost:8080

→ オリジン（ホスト + ポート）が違う = クロスオリジン
→ ブラウザはデフォルトでブロックする
→ Gateway 側でヘッダーを返すことで許可できる
```

```go
func cors() gin.HandlerFunc {
    return func(c *gin.Context) {
        c.Header("Access-Control-Allow-Origin", "*")
        //                                      ↑ どのオリジンからでも許可
        c.Header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
        c.Header("Access-Control-Allow-Headers", "Content-Type")

        // プリフライトリクエスト（OPTIONS）への対応
        // ブラウザは本番リクエストの前に OPTIONS で「このリクエストできる？」と聞いてくる
        if c.Request.Method == http.MethodOptions {
            c.AbortWithStatus(http.StatusNoContent)  // 204 で許可を返す
            return
        }
        c.Next()
    }
}

r.Use(cors())  // 全ルートに適用
```

---

## 第 5 章 — フロントエンド（Next.js + TypeScript）

## 19. Next.js App Router の基本

```
frontend/src/
├── app/                    ← URL ルーティング
│   ├── layout.tsx          ← 全ページ共通レイアウト
│   ├── page.tsx            ← / → /dashboard/home にリダイレクト
│   └── dashboard/
│       └── functions/
│           └── page.tsx    ← /dashboard/functions のページ
├── features/               ← ページ固有のコンポーネント
│   └── functions/
│       ├── functions-list.tsx
│       └── code-viewer.tsx
├── components/ui/          ← 汎用 UI コンポーネント（shadcn/ui）
└── lib/
    ├── constants.ts        ← 定数（GATEWAY_URL など）
    └── functions-api.ts    ← API クライアント
```

### "use client" ディレクティブ

```tsx
"use client";  // ← このファイルはブラウザで動く（useState が使える）

// これがないと Server Component = サーバーで HTML を生成
// useState, useEffect, onClick は "use client" のファイルでしか使えない
```

---

## 20. TypeScript の型設計

バックエンドが返す JSON の形を TypeScript の interface で定義する。

```typescript
// lib/functions-api.ts

// Gateway が返す JSON の型
export interface FunctionInfo {
  id: string;
  name: string;
  runtime: string;
  code: string;
  createdAt: string;   // "2026-04-18T08:23:09Z"
  timeoutSec: number;
}

export interface ExecuteResult {
  output: string;
  error: string;
  exitCode: number;
  durationMs: number;
}
```

### なぜ型を定義するか

```typescript
// 型なし
const fn = await fetchFunction(id)
fn.cod  // タイポしてもエラーにならない → 実行時に undefined

// 型あり
const fn: FunctionInfo = await fetchFunction(id)
fn.cod  // コンパイルエラー → "cod" なんてフィールドはないよ
fn.code // OK
```

---

## 21. fetch で API を叩く

```typescript
// lib/functions-api.ts

import { GATEWAY_URL } from "./constants";
// GATEWAY_URL = "http://localhost:8080"

export const functionsApi = {
  // 一覧取得
  list: async (): Promise<FunctionInfo[]> => {
    const res = await fetch(`${GATEWAY_URL}/functions`);
    if (!res.ok) throw new Error("Failed to fetch");
    const data = await res.json();
    return data.functions ?? [];
  },

  // 作成
  create: async (name: string, runtime: string, code: string): Promise<FunctionInfo> => {
    const res = await fetch(`${GATEWAY_URL}/functions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, runtime, code }),
    });
    if (!res.ok) throw new Error("Failed to create");
    return res.json();
  },

  // コード更新
  update: async (id: string, fields: { code?: string }): Promise<FunctionInfo> => {
    const res = await fetch(`${GATEWAY_URL}/functions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: fields.code ?? "" }),
    });
    if (!res.ok) throw new Error("Failed to update");
    return res.json();
  },

  // 実行
  execute: async (id: string): Promise<ExecuteResult> => {
    const res = await fetch(`${GATEWAY_URL}/functions/${id}/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (!res.ok) throw new Error("Failed to execute");
    return res.json();
  },

  // 削除
  delete: async (id: string): Promise<void> => {
    await fetch(`${GATEWAY_URL}/functions/${id}`, { method: "DELETE" });
  },
};
```

---

## 22. React の状態管理

React の基本は「状態（state）が変わると画面が再レンダリングされる」。

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";

export default function FunctionsPage() {
  // useState: 状態の宣言
  // functions = 現在の値, setFunctions = 更新関数
  const [functions, setFunctions] = useState<FunctionInfo[]>([]);
  const [selected, setSelected]   = useState<string>("");
  const [executing, setExecuting] = useState(false);
  const [execResult, setExecResult] = useState<ExecuteResult | null>(null);

  // useCallback: 関数をメモ化（再レンダリングのたびに関数が再生成されるのを防ぐ）
  const fetchList = useCallback(async () => {
    const list = await functionsApi.list();
    setFunctions(list);           // ← 状態を更新 → 再レンダリング
    if (list.length > 0 && !selected) setSelected(list[0].id);
  }, [selected]);

  // useEffect: コンポーネントがマウントされたとき（初回表示時）に実行
  useEffect(() => {
    fetchList();
  }, []);  // [] = 依存配列が空 = 初回だけ実行

  // 実行ハンドラ
  const handleInvoke = async () => {
    setExecuting(true);    // ← ボタンを「Running...」に変える
    setExecResult(null);
    const result = await functionsApi.execute(selected);
    setExecResult(result); // ← 結果を画面に表示
    setExecuting(false);
  };

  return (
    <div>
      {/* functions の状態を使って画面を描画 */}
      {functions.map(fn => (
        <button key={fn.id} onClick={() => setSelected(fn.id)}>
          {fn.name}
        </button>
      ))}
      <button onClick={handleInvoke} disabled={executing}>
        {executing ? "Running..." : "Invoke"}
      </button>
    </div>
  );
}
```

### useState の仕組み

```
初回レンダリング:  functions = []  → リスト空で描画
fetchList() 実行: setFunctions([{id: "abc", name: "hello", ...}])
                    ↓ React が変化を検知
再レンダリング:    functions = [{...}] → リストに1件表示
```

---

## 23. コンポーネント設計

「大きなページ」を「小さなコンポーネント」に分ける。

```
FunctionsPage（page.tsx）
├── FunctionsList（functions-list.tsx）
│     props: functions, selected, onSelect, onNew
│     役割: 左サイドバーのリスト表示
│
└── CodeViewer（code-viewer.tsx）
      props: code, runtime, onSave
      役割: コード編集エリア
```

### props の設計

```tsx
// FunctionsList が必要とする情報を props で受け取る
interface FunctionsListProps {
  functions: FunctionInfo[];       // データ
  selected: string;                // どれが選択中か
  onSelect: (id: string) => void;  // 選択が変わったとき呼ぶコールバック
  onNew: () => void;               // 新規作成ボタンを押したとき
}

// CodeViewer
interface CodeViewerProps {
  code: string;                          // 表示するコード
  runtime?: string;                      // 言語表示用
  onSave?: (code: string) => Promise<void>;  // 保存コールバック
}
```

**データ（state）は親（page.tsx）が持ち、子は props で受け取って表示するだけ。**
これを「単方向データフロー」という。

### CodeViewer の編集状態管理

```tsx
export function CodeViewer({ code, runtime, onSave }: CodeViewerProps) {
  // draft = 現在エディタに入力されている内容
  const [draft, setDraft] = useState(code);
  const dirty = draft !== code;  // 保存前の変更があるか

  // 親から渡される code が変わったら（別の関数を選択したら）draft をリセット
  useEffect(() => {
    setDraft(code);
  }, [code]);

  return (
    <Textarea
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
    />
    {dirty && <Button onClick={() => onSave?.(draft)}>Save</Button>}
  );
}
```

---

## 第 6 章 — インフラ

## 24. Dockerfile — マルチステージビルド

### Functions サービス

```dockerfile
# ── ステージ 1: ビルド ─────────────────────────────────
FROM golang:1.25-alpine AS builder

WORKDIR /build
COPY gen/ ./gen/                  # replace 先のローカルモジュールを先にコピー

WORKDIR /build/services/functions
COPY services/functions/go.mod services/functions/go.sum ./
RUN go mod download               # 依存関係を先にダウンロード（キャッシュ活用）
COPY services/functions/ .
RUN go build -o functions .       # バイナリ生成

# ── ステージ 2: 実行 ─────────────────────────────────
FROM alpine:3.19
WORKDIR /app
COPY --from=builder /build/services/functions/functions .
# ↑ ビルドステージのバイナリだけをコピー
# → ソースコードも Go コンパイラも最終イメージに含まれない
EXPOSE 50055
CMD ["./functions"]
```

### なぜ 2 ステージか

| | ステージ1 | ステージ2 |
|---|---|---|
| ベースイメージ | `golang:1.25-alpine` (~400MB) | `alpine:3.19` (~8MB) |
| 含まれるもの | Go コンパイラ、ソース、バイナリ | バイナリのみ |
| 最終イメージサイズ | 捨てる | **~20MB** |

### Docker キャッシュの活用

```dockerfile
# ❌ 毎回 go mod download が走る（.go ファイル変更でキャッシュ無効）
COPY . .
RUN go mod download && go build

# ✅ go.mod/go.sum が変わらない限り go mod download はキャッシュが効く
COPY go.mod go.sum ./
RUN go mod download   # ← ここまでキャッシュ
COPY . .              # ← .go ファイルが変わってもここから再実行
RUN go build
```

---

## 25. docker-compose で複数サービスを繋ぐ

```yaml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: dev
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U dev"]
      interval: 2s
      retries: 10

  functions:
    build:
      context: .                              # ← ビルドコンテキスト（./ = リポジトリルート）
      dockerfile: services/functions/Dockerfile
    environment:
      DATABASE_URL: postgres://dev:dev@postgres:5432/functions_db?sslmode=disable
      #                               ↑ docker-compose 内ではサービス名で名前解決できる
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock  # Docker ソケットマウント
    depends_on:
      postgres:
        condition: service_healthy             # ← postgres が ready になってから起動

  gateway:
    build:
      context: .
      dockerfile: services/gateway/Dockerfile
    environment:
      FUNCTIONS_GRPC_ADDR: functions:50055    # ← サービス名で Functions に接続
    depends_on: [functions]

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on: [gateway]
```

### サービス名による名前解決

docker-compose 内のサービスは **サービス名がホスト名** になる。

```
gateway から Functions に接続: "functions:50055"
functions から postgres に接続: "postgres:5432"
```

### volumes の使い方

```yaml
volumes:
  - /var/run/docker.sock:/var/run/docker.sock
  # ↑ ホストのパス : コンテナのパス
  # ホストの Docker ソケットをコンテナ内に見せる
```

---

## 26. Go modules と replace ディレクティブ

### マルチモジュール構成

このプロジェクトの Go モジュール構成:

```
giraffe-2604/
├── gen/           → module: github.com/KinuGra/giraffe-2604/gen
├── services/
│   ├── functions/ → module: github.com/KinuGra/giraffe-2604/services/functions
│   └── gateway/   → module: github.com/KinuGra/giraffe-2604/services/gateway
```

`gen/` はリポジトリ内にあるが、まだ公開していないモジュール。

### replace ディレクティブ

```go
// services/functions/go.mod
require (
    github.com/KinuGra/giraffe-2604/gen v0.0.0-00010101000000-000000000000
    // ↑ ダミーバージョン（実際には使われない）
)

replace github.com/KinuGra/giraffe-2604/gen => ../../gen
// ↑ このパスの参照先をローカルディレクトリに向ける
```

### Dockerfile でのコピー順序

replace 先のディレクトリが存在しないと `go mod download` が失敗する。

```dockerfile
WORKDIR /build
COPY gen/ ./gen/          # ← 先に gen/ をコピー（replace 先）

WORKDIR /build/services/functions
COPY services/functions/go.mod services/functions/go.sum ./
RUN go mod download       # ← gen/ がある状態なので成功
```

---

## 第 7 章 — 実装チェックリスト

## 27. ゼロから実装する手順

```
【フェーズ 1: proto 定義】
□ proto/ ディレクトリを作る
□ .proto ファイルに service と全 message を定義
□ protoc でコード生成（gen/ に出力）
□ gen/go.mod を作る

【フェーズ 2: Functions サービス】
□ services/functions/go.mod を作る
  - gen への replace ディレクティブを追加
□ model/function.go — GORM モデル定義
□ repository/function_repo.go — CRUD
□ usecase/execute.go — ビジネスロジック + Docker 実行
□ server/server.go — gRPC ハンドラ
□ server/convert.go — model ↔ proto 変換
□ main.go — DB 接続 + AutoMigrate + DI + gRPC サーバー起動
□ Dockerfile — マルチステージ（root context 対応）
□ go mod tidy && go build ./...

【フェーズ 3: Gateway】
□ services/gateway/go.mod に grpc と gen を追加
  - gen への replace ディレクティブを追加
□ main.go — CORS + gRPC クライアント + REST ルート 5 本
  - GET    /functions
  - POST   /functions
  - GET    /functions/:id
  - PATCH  /functions/:id
  - POST   /functions/:id/execute
  - DELETE /functions/:id
□ Dockerfile — root context 対応
□ go mod tidy && go build ./...

【フェーズ 4: docker-compose】
□ postgres サービス（healthcheck 付き）
□ functions サービス
  - context: . (root)
  - /var/run/docker.sock マウント
  - depends_on: postgres（condition: service_healthy）
□ gateway サービス
  - context: . (root)
  - FUNCTIONS_GRPC_ADDR 環境変数
□ frontend サービス

【フェーズ 5: Frontend】
□ lib/functions-api.ts — FunctionInfo / ExecuteResult 型 + API 関数 5 本
□ features/functions/functions-list.tsx — 実データ対応
□ features/functions/code-viewer.tsx — 編集可能 Textarea
□ app/dashboard/functions/page.tsx
  - useEffect で初回フェッチ
  - 一覧・選択・Invoke・削除・作成ダイアログ

【フェーズ 6: 動作確認】
□ make build && make down && make up
□ grpcurl で CreateFunction / ExecuteFunction を確認
□ curl で Gateway REST エンドポイントを確認
□ ブラウザで http://localhost:3000/dashboard/functions を確認
```

---

## 28. よくあるハマりポイント

### 1. protoc を再生成し忘れる
proto を変えたのに `go build` が通らなくなったら、まず再生成。
`gen/` は git 管理しているため、proto を変えたら必ずセットで再生成してコミットする。

### 2. go mod tidy で gen が消える
コードで `gen` を import する前に `go mod tidy` を実行すると、使われていないとして
require から削除される。先にコードを書いてから `go mod tidy` を実行する。

### 3. Docker ソケットマウントを忘れる
`/var/run/docker.sock` をマウントしないと Execute で
`docker client error: Cannot connect to the Docker daemon` になる。

### 4. コンテナが image not found で失敗する
初回は `docker pull python:3.12-alpine` を自動で行う。
コンテナが Docker Hub にアクセスできるネットワーク設定が必要。

### 5. CORS エラーがブラウザのコンソールに出る
```
Access to fetch at 'http://localhost:8080/...' has been blocked by CORS policy
```
Gateway の CORS ミドルウェアが設定されているか確認。
OPTIONS メソッドへの応答が正しく返っているか確認。

### 6. depends_on だけでは不十分
```yaml
depends_on: [postgres]  # ← postgres コンテナが「起動した」だけ
```
PostgreSQL は起動してから接続を受け付けるまで数秒かかる。
```yaml
depends_on:
  postgres:
    condition: service_healthy  # ← pg_isready が通るまで待つ
```
`healthcheck` と `condition: service_healthy` をセットで使う。

### 7. UUID が空で返る
`gen_random_uuid()` は PostgreSQL の関数。
SQLite やインメモリ DB では動かない。開発では必ず PostgreSQL を使う。

### 8. Go の時刻フォーマット
他の言語と異なり、Go の時刻フォーマットは「パターン文字列」ではなく
**「基準時刻をフォーマットした文字列」** で指定する。

```go
// ❌ 他の言語から来た人がやりがちな間違い
t.Format("YYYY-MM-DD")  // → "YYYY-MM-DD" がそのまま出力される

// ✅ 正しい書き方（2006年1月2日 15時4分5秒 がフォーマット指定子）
t.Format("2006-01-02T15:04:05Z07:00")  // → "2026-04-18T08:23:09Z"
```
