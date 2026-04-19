# Functions サービス実装 講義ノート

このノートを読めば、`services/functions/` の実装を 0 から書き直せるようになることを目標とする。
gRPC・レイヤードアーキテクチャ・GORM・Docker SDK まで一気通貫で解説する。

---

## 目次

1. [全体像 — 何を作ったか](#1-全体像--何を作ったか)
2. [gRPC とは何か](#2-grpc-とは何か)
3. [proto ファイルの書き方](#3-proto-ファイルの書き方)
4. [コード生成 — protoc の仕組み](#4-コード生成--protoc-の仕組み)
5. [生成コードを読む](#5-生成コードを読む)
6. [レイヤードアーキテクチャ](#6-レイヤードアーキテクチャ)
7. [model 層 — GORM モデル定義](#7-model-層--gorm-モデル定義)
8. [repository 層 — DB CRUD](#8-repository-層--db-crud)
9. [usecase 層 — ビジネスロジック](#9-usecase-層--ビジネスロジック)
10. [Docker SDK でコンテナ実行する仕組み](#10-docker-sdk-でコンテナ実行する仕組み)
11. [Docker multiplexed stream の demux](#11-docker-multiplexed-stream-の-demux)
12. [server 層 — gRPC ハンドラ](#12-server-層--grpc-ハンドラ)
13. [main.go — DI とサーバー起動](#13-maingo--di-とサーバー起動)
14. [go.mod の replace ディレクティブ](#14-gomod-の-replace-ディレクティブ)
15. [Dockerfile — マルチステージビルド](#15-dockerfile--マルチステージビルド)
16. [docker-compose.yaml — Docker ソケットマウント](#16-docker-composeyaml--docker-ソケットマウント)
17. [動作確認 — grpcurl の使い方](#17-動作確認--grpcurl-の使い方)
18. [ゼロから実装する手順チェックリスト](#18-ゼロから実装する手順チェックリスト)

---

## 1. 全体像 — 何を作ったか

「ユーザーがコードを登録し、そのコードを Docker コンテナ上で安全に実行できる」サーバーレス関数基盤。
AWS Lambda の極小版をイメージするとわかりやすい。

```
クライアント (grpcurl / Gateway)
        │  gRPC (HTTP/2 + Protobuf)
        ▼
┌─────────────────────────────────────────┐
│  services/functions/                    │
│                                         │
│  main.go ─► server/ ─► usecase/ ─► repository/ ─► PostgreSQL
│                              │
│                              └──► Docker API ─► コンテナ起動
└─────────────────────────────────────────┘
```

### ディレクトリ構成

```
services/functions/
├── main.go          エントリポイント。DB接続・DI・gRPCサーバー起動
├── model/           GORMモデル（テーブル定義）。他層に依存しない
├── repository/      DBのCRUD。model にだけ依存
├── usecase/         ビジネスロジック。repository に依存
└── server/          gRPCハンドラ。usecase に依存。protoの型と変換も担当

proto/functions/     .proto ファイル（契約定義）
gen/functions/       protoc が生成した Go コード（触らない）
```

---

## 2. gRPC とは何か

### REST との比較

| 項目 | REST (JSON/HTTP1.1) | gRPC (Protobuf/HTTP2) |
|---|---|---|
| インターフェース定義 | なし（OpenAPI等は任意） | .proto ファイルが必須 |
| シリアライズ | JSON（テキスト） | Protobuf（バイナリ、高速・小さい） |
| 型安全 | 弱い | 強い（コード生成で保証） |
| ブラウザから直接呼べる | できる | できない（grpc-web が必要） |
| 主な用途 | 外部公開API | マイクロサービス間通信 |

### gRPC の通信の流れ

```
クライアント                              サーバー
    │                                       │
    │  1. pb.CreateFunctionRequest を生成   │
    │  2. Protobuf でシリアライズ           │
    │  3. HTTP/2 で送信 ──────────────────► │
    │                                       │  4. デシリアライズ
    │                                       │  5. ハンドラ呼び出し
    │                                       │  6. pb.FunctionInfo を生成
    │  9. デシリアライズ                    │  7. Protobuf でシリアライズ
    │  ◄────────────────── 8. HTTP/2 で返信 │
```

---

## 3. proto ファイルの書き方

`proto/functions/functions.proto` の全体:

```proto
syntax = "proto3";           // proto のバージョン（常に proto3 を使う）
package functions;           // proto の名前空間（Go のパッケージとは別）
option go_package = "github.com/KinuGra/giraffe-2604/gen/functions";
//                  ↑ 生成される Go コードの import パスを指定

// ── サービス定義（どんな RPC があるか） ─────────────────────────
service FunctionsService {
  rpc CreateFunction(CreateFunctionRequest) returns (FunctionInfo);
  rpc ListFunctions(ListFunctionsRequest)   returns (ListFunctionsResponse);
  rpc GetFunction(GetFunctionRequest)       returns (FunctionInfo);
  rpc ExecuteFunction(ExecuteFunctionRequest) returns (ExecuteFunctionResponse);
  rpc DeleteFunction(DeleteFunctionRequest) returns (DeleteFunctionResponse);
}

// ── メッセージ定義（リクエスト/レスポンスの型） ─────────────────
message CreateFunctionRequest {
  string name        = 1;  // = 1 はフィールド番号（バイナリ識別子）
  string runtime     = 2;  // 番号は一度決めたら変えてはいけない
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
```

### proto の型対応表（よく使うもの）

| proto 型 | Go 型 | 用途 |
|---|---|---|
| `string` | `string` | テキスト |
| `int32` | `int32` | 整数（小） |
| `int64` | `int64` | 整数（大）、ms単位時間など |
| `bool` | `bool` | フラグ |
| `bytes` | `[]byte` | バイナリ |
| `repeated T` | `[]T` | 配列 |
| `message` | `struct` | ネスト構造体 |

### フィールド番号のルール

- 1〜15: 1バイトで表現（頻繁に使うフィールドに割り当てる）
- 16〜2047: 2バイトで表現
- **一度 wire に出たフィールド番号は変更・再利用禁止**（後方互換性が壊れる）

---

## 4. コード生成 — protoc の仕組み

```bash
protoc \
  --go_out=./gen \           # messages の Go コードを gen/ に出力
  --go-grpc_out=./gen \      # gRPC client/server コードを gen/ に出力
  --go_opt=paths=source_relative \      # ファイルの相対パスを維持
  --go-grpc_opt=paths=source_relative \ # 同上
  -I proto \                 # .proto の検索パス（import のルートディレクトリ）
  proto/functions/functions.proto
```

実行すると以下の 2 ファイルが生成される:

| ファイル | 内容 |
|---|---|
| `gen/functions/functions.pb.go` | メッセージ型の Go struct + Getters |
| `gen/functions/functions_grpc.pb.go` | サービスの interface・クライアント実装・サーバー登録関数 |

**このファイルは絶対に手で編集しない。** proto を変えて再生成する。

---

## 5. 生成コードを読む

### functions_grpc.pb.go の重要な部分

```go
// ① サーバーが実装すべき interface
type FunctionsServiceServer interface {
    CreateFunction(context.Context, *CreateFunctionRequest) (*FunctionInfo, error)
    ListFunctions(context.Context, *ListFunctionsRequest)   (*ListFunctionsResponse, error)
    // ... 全 RPC が並ぶ
    mustEmbedUnimplementedFunctionsServiceServer()  // 埋め込みを強制するメソッド
}

// ② 未実装メソッドのデフォルト実装（codes.Unimplemented を返す）
type UnimplementedFunctionsServiceServer struct{}
func (UnimplementedFunctionsServiceServer) CreateFunction(...) { return nil, status.Error(codes.Unimplemented, ...) }

// ③ サーバーを gRPC サーバーに登録する関数
func RegisterFunctionsServiceServer(s grpc.ServiceRegistrar, srv FunctionsServiceServer)
```

自分のサーバー実装は `UnimplementedFunctionsServiceServer` を **embed（埋め込み）** し、
必要な RPC だけ override する。これにより、後で proto に RPC を追加しても
コンパイルエラーにならない（未実装は Unimplemented を返す）。

---

## 6. レイヤードアーキテクチャ

依存関係は **一方向のみ**。上位層は下位層を知るが、下位層は上位層を知らない。

```
main.go
  └── server/        (proto の型 ↔ model の型 の変換を担当)
        └── usecase/ (ビジネスロジック)
              └── repository/ (DB操作)
                    └── model/ (テーブル定義)
```

### なぜこの構造か

- **model** が repository に依存していたら、model を変えると repository も壊れる
- **repository** が usecase に依存していたら、DB の都合でビジネスロジックが変わってしまう
- **usecase** が server（proto の型）に依存していたら、proto を変えるたびにビジネスロジックを書き直す

**各層は「自分より内側（下位）の関心事」しか知らない** というルールを守ることで、
変更の影響範囲が局所化される。

---

## 7. model 層 — GORM モデル定義

`model/function.go`:

```go
package model

import "time"

type Function struct {
    ID         string    `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
    //                    ↑ PostgreSQL の gen_random_uuid() で UUID を自動生成
    Name       string    `gorm:"not null"`
    Runtime    string    `gorm:"not null"`
    Code       string    `gorm:"type:text;not null"`  // text は可変長で長さ制限なし
    TimeoutSec int       `gorm:"default:30;not null"`
    CreatedAt  time.Time  // GORM が自動で INSERT 時刻を埋める
    UpdatedAt  time.Time  // GORM が自動で UPDATE 時刻を埋める
}

type ExecutionLog struct {
    ID         string    `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
    FunctionID string    `gorm:"type:uuid;not null;index"` // index でクエリ高速化
    Output     string    `gorm:"type:text"`
    Error      string    `gorm:"type:text"`
    ExitCode   int
    DurationMs int64
    CreatedAt  time.Time
}
```

### GORM struct タグの読み方

```
`gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
      ──────────  ─────────────────────────  ──────────
       カラム型        DBデフォルト値          主キー指定
```

複数指定は `;` で区切る。

### AutoMigrate とは

`db.AutoMigrate(&Function{}, &ExecutionLog{})` を呼ぶと、
GORM が struct 定義を見て**テーブルが存在しなければ CREATE TABLE、
カラムが増えていれば ALTER TABLE ADD COLUMN** を自動実行する。
カラム削除はしないので本番でも比較的安全。

---

## 8. repository 層 — DB CRUD

`repository/function_repo.go`:

```go
package repository

type FunctionRepo struct {
    db *gorm.DB  // GORM のコネクションを保持
}

func NewFunctionRepo(db *gorm.DB) *FunctionRepo {
    return &FunctionRepo{db: db}
}
```

### GORM の基本操作パターン

```go
// CREATE: struct を渡すと INSERT。ID が UUID なら DB が自動生成して f.ID に書き戻す
func (r *FunctionRepo) Create(f *model.Function) error {
    return r.db.Create(f).Error
}

// READ: First は WHERE + ORDER BY id + LIMIT 1
func (r *FunctionRepo) FindByID(id string) (*model.Function, error) {
    var f model.Function
    if err := r.db.First(&f, "id = ?", id).Error; err != nil {
        return nil, err
    }
    return &f, nil
}

// READ ALL: Find は WHERE なしで全件取得
func (r *FunctionRepo) FindAll() ([]model.Function, error) {
    var funcs []model.Function
    if err := r.db.Find(&funcs).Error; err != nil {
        return nil, err
    }
    return funcs, nil
}

// DELETE: 型のゼロ値を渡して WHERE 句で絞る
func (r *FunctionRepo) Delete(id string) error {
    return r.db.Delete(&model.Function{}, "id = ?", id).Error
}
```

### なぜ `?` プレースホルダーを使うか

`"id = '" + id + "'"` のような文字列結合は **SQL インジェクション** の原因になる。
`"id = ?"` + 引数に分けることで GORM（内部は pgx）がエスケープしてくれる。

---

## 9. usecase 層 — ビジネスロジック

`usecase/execute.go` の非 Docker 部分:

```go
package usecase

type FunctionUsecase struct {
    repo *repository.FunctionRepo
}

func NewFunctionUsecase(repo *repository.FunctionRepo) *FunctionUsecase {
    return &FunctionUsecase{repo: repo}
}

func (u *FunctionUsecase) Create(name, runtime, code string, timeoutSec int) (*model.Function, error) {
    if timeoutSec <= 0 {
        timeoutSec = 30  // デフォルト値をビジネスロジックとして定義
    }
    f := &model.Function{
        Name: name, Runtime: runtime, Code: code, TimeoutSec: timeoutSec,
    }
    if err := u.repo.Create(f); err != nil {
        return nil, err
    }
    return f, nil
}
```

usecase が `proto の型（pb.*）` を一切知らないことに注目。
リクエストの変換は server 層が担い、usecase は Go のプリミティブ型か model 型だけを扱う。

---

## 10. Docker SDK でコンテナ実行する仕組み

### なぜ Docker を使うか

コードを直接 `os/exec` で実行するとサーバーの OS が侵害されるリスクがある。
Docker コンテナは namespace・cgroup で隔離されているため、悪意あるコードでも
ホストへの影響を限定できる。

### Docker in Docker vs Docker socket マウント

| 方式 | 説明 | 採用理由 |
|---|---|---|
| Docker in Docker | コンテナ内で別の dockerd を起動 | 複雑・遅い |
| **Docker socket マウント** | ホストの `/var/run/docker.sock` を共有 | シンプル・速い |

`docker-compose.yaml`:
```yaml
functions:
  volumes:
    - /var/run/docker.sock:/var/run/docker.sock
```

これにより Functions コンテナからホストの Docker デーモンに命令できる。
コンテナは Functions コンテナの**兄弟**として起動される（子ではない）。

### Execute 関数の流れ

```go
func (u *FunctionUsecase) Execute(id string, timeoutSec int) (*ExecuteResult, error) {
    // 1. DB から関数情報を取得
    f, err := u.repo.FindByID(id)

    // 2. runtime に対応するイメージを決定
    image := runtimeImages[f.Runtime]  // "python3.12" → "python:3.12-alpine"

    // 3. タイムアウト付き context
    ctx, cancel := context.WithTimeout(context.Background(), time.Duration(timeout)*time.Second)
    defer cancel()

    // 4. Docker クライアント作成（DOCKER_HOST 環境変数 or /var/run/docker.sock を使う）
    cli, _ := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())

    // 5. イメージが手元になければ自動 pull（出力は破棄）
    rc, _ := cli.ImagePull(ctx, image, dockerimage.PullOptions{})
    io.Copy(io.Discard, rc)
    rc.Close()

    // 6. コンテナ設定
    // python3.12 なら: ["python3", "-c", "print('hello world')"]
    // node20 なら:     ["node", "-e", "console.log('hello')"]
    cmd := []string{"python3", "-c", f.Code}

    // 7. コンテナ作成（まだ起動しない）
    resp, _ := cli.ContainerCreate(ctx, &container.Config{
        Image: image,
        Cmd:   cmd,
    }, nil, nil, nil, "")
    containerID := resp.ID

    // defer で必ずコンテナを削除（Force: true でエラー無視）
    defer cli.ContainerRemove(context.Background(), containerID, container.RemoveOptions{Force: true})

    // 7. コンテナ起動（非同期）
    start := time.Now()
    cli.ContainerStart(ctx, containerID, container.StartOptions{})

    // 8. 終了を待つ（channel で受け取る）
    statusCh, errCh := cli.ContainerWait(ctx, containerID, container.WaitConditionNotRunning)
    select {
    case waitResp := <-statusCh:
        exitCode = int(waitResp.StatusCode)  // 0=正常, 1=エラー
    case err := <-errCh:
        return nil, err
    }
    durationMs := time.Since(start).Milliseconds()

    // 9. ログ取得
    logs, _ := cli.ContainerLogs(ctx, containerID, container.LogsOptions{
        ShowStdout: true,
        ShowStderr: true,
    })

    // 10. stdout/stderr に分離（後述）
    demuxLogs(logs, &stdout, &stderr)
}
```

### context.WithTimeout の働き

```go
ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
defer cancel()
```

- `ctx` が持つタイムアウトは**その context を使う全操作に伝播する**
- `ContainerCreate`・`ContainerStart`・`ContainerWait` すべてに効く
- 30秒経過すると ctx がキャンセルされ、`errCh` にエラーが流れてくる
- `defer cancel()` でタイムアウト前に終了した場合もリソースを解放

---

## 11. Docker multiplexed stream の demux

`ContainerLogs` は stdout と stderr を **1本の stream で混在**して返す。
各フレームに 8 バイトのヘッダーが付いている。

```
ヘッダー（8バイト）              ペイロード（可変長）
┌──┬────────┬────────────────┐  ┌─────────────────────┐
│0 │ 1 2 3  │   4  5  6  7  │  │  実際のログ文字列   │
│タ│（予約）│  ペイロードサイズ  │  │  (size バイト)      │
│イ│  0x00  │  big-endian    │  └─────────────────────┘
│プ│        │  uint32        │
└──┴────────┴────────────────┘

type: 1 = stdout
      2 = stderr
```

```go
func demuxLogs(r io.Reader, stdout, stderr *bytes.Buffer) error {
    hdr := make([]byte, 8)
    for {
        // ヘッダーを 8 バイト読む
        _, err := io.ReadFull(r, hdr)
        if err == io.EOF { return nil }  // ストリーム終端

        // ペイロードサイズをビッグエンディアンで解釈
        size := int(hdr[4])<<24 | int(hdr[5])<<16 | int(hdr[6])<<8 | int(hdr[7])

        buf := make([]byte, size)
        io.ReadFull(r, buf)

        // type で振り分け
        switch hdr[0] {
        case 1: stdout.Write(buf)
        case 2: stderr.Write(buf)
        }
    }
}
```

`<<24`, `<<16`, `<<8` はビットシフト。4 バイトを 1 つの整数に組み立てている:
```
hdr[4] が 0x00, hdr[5] が 0x00, hdr[6] が 0x00, hdr[7] が 0x0C なら
size = 0 | 0 | 0 | 12 = 12 バイト
```

---

## 12. server 層 — gRPC ハンドラ

### server.go

```go
package server

type FunctionsServer struct {
    pb.UnimplementedFunctionsServiceServer  // 未実装メソッドのデフォルト実装を埋め込む
    uc *usecase.FunctionUsecase
}

func NewFunctionsServer(uc *usecase.FunctionUsecase) *FunctionsServer {
    return &FunctionsServer{uc: uc}
}

// proto のインターフェースを満たすメソッドを実装
func (s *FunctionsServer) CreateFunction(ctx context.Context, req *pb.CreateFunctionRequest) (*pb.FunctionInfo, error) {
    // ① proto の型 → Go プリミティブ型に変換して usecase を呼ぶ
    f, err := s.uc.Create(req.Name, req.Runtime, req.Code, int(req.TimeoutSec))
    if err != nil {
        // ② gRPC のエラー型に変換して返す
        return nil, status.Errorf(codes.Internal, "create failed: %v", err)
    }
    // ③ model の型 → proto の型に変換して返す
    return modelToProto(f), nil
}
```

### gRPC エラーコード（よく使うもの）

| コード | HTTP相当 | 意味 |
|---|---|---|
| `codes.OK` | 200 | 成功 |
| `codes.NotFound` | 404 | リソースが存在しない |
| `codes.InvalidArgument` | 400 | リクエストが不正 |
| `codes.Internal` | 500 | サーバー内部エラー |
| `codes.Unimplemented` | 501 | メソッドが未実装 |

### convert.go — model ↔ proto 変換

```go
func modelToProto(f *model.Function) *pb.FunctionInfo {
    return &pb.FunctionInfo{
        Id:         f.ID,
        Name:       f.Name,
        Runtime:    f.Runtime,
        Code:       f.Code,
        TimeoutSec: int32(f.TimeoutSec),  // int → int32 の型変換
        CreatedAt:  f.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),  // RFC3339
        //                              ↑ Go の時刻フォーマットは「基準時刻」で指定する
    }
}
```

Go の時刻フォーマット規則:
- `"2006-01-02T15:04:05Z07:00"` は RFC3339 (ISO8601)
- `2006` = 年, `01` = 月, `02` = 日, `15` = 時, `04` = 分, `05` = 秒
- この特定の日時（2006年1月2日 15時4分5秒）がフォーマット指定子になっている

---

## 13. main.go — DI とサーバー起動

```go
func main() {
    // 1. DB接続
    dsn := os.Getenv("DATABASE_URL")
    //    環境変数から接続文字列を取得（ハードコードしない）
    db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})

    // 2. テーブル自動作成・更新
    db.AutoMigrate(&model.Function{}, &model.ExecutionLog{})

    // 3. DI（依存性注入）: 下位層から順に組み立てる
    repo := repository.NewFunctionRepo(db)
    uc   := usecase.NewFunctionUsecase(repo)
    srv  := server.NewFunctionsServer(uc)
    //  ↑ usecase は repo を注入されて生成
    //  ↑ server は uc を注入されて生成

    // 4. TCP ソケットを開く
    lis, _ := net.Listen("tcp", ":50055")

    // 5. gRPC サーバーを作成して実装を登録
    grpcServer := grpc.NewServer()
    pb.RegisterFunctionsServiceServer(grpcServer, srv)
    //  ↑ 生成コードの RegisterXxxServer を使う

    // 6. ブロッキングで起動
    grpcServer.Serve(lis)
}
```

### DI（Dependency Injection）とは

「外から依存オブジェクトを渡す」パターン。

```go
// DI なし（テストしにくい）
type FunctionUsecase struct{}
func (u *FunctionUsecase) Create(...) {
    db := gorm.Open(...)  // 内部で DB 接続を作る → テストでモックできない
}

// DI あり（テストしやすい）
type FunctionUsecase struct {
    repo *repository.FunctionRepo  // 外から渡してもらう
}
```

main.go だけが「どの実装を使うか」を知っている。
各層は「インターフェース（何ができるか）」だけを知る。

---

## 14. go.mod の replace ディレクティブ

`services/functions/go.mod`:

```go
module github.com/KinuGra/giraffe-2604/services/functions

require (
    github.com/KinuGra/giraffe-2604/gen v0.0.0-00010101000000-000000000000
    // ↑ ダミーバージョン（実際には使われない）
)

replace github.com/KinuGra/giraffe-2604/gen => ../../gen
// ↑ このモジュールの参照先を ../../gen（ローカルディレクトリ）に向ける
```

`gen/` はリポジトリ内にあるがまだ公開していないモジュール。
`replace` を使うことで `go get` なしでローカル参照できる。

### Dockerfile でのコピー順序

```dockerfile
WORKDIR /build
COPY gen/ ./gen/          # ← gen/ を先にコピー（replace 先が存在する必要がある）

WORKDIR /build/services/functions
COPY services/functions/go.mod services/functions/go.sum ./
RUN go mod download       # ← gen/ がコピー済みなので replace が解決できる
COPY services/functions/ .
RUN go build -o functions .
```

`docker build` のコンテキストはリポジトリルート（`context: .`）なので
`gen/` と `services/functions/` の両方をコピーできる。

---

## 15. Dockerfile — マルチステージビルド

```dockerfile
# ── ステージ1: ビルド ──────────────────────────────────────
FROM golang:1.25-alpine AS builder

WORKDIR /build
COPY gen/ ./gen/

WORKDIR /build/services/functions
COPY services/functions/go.mod services/functions/go.sum ./
RUN go mod download           # ← 依存関係を先にダウンロード（キャッシュ活用）
COPY services/functions/ .
RUN go build -o functions .   # ← バイナリを生成

# ── ステージ2: 実行 ────────────────────────────────────────
FROM alpine:3.19
WORKDIR /app
COPY --from=builder /build/services/functions/functions .
#    ↑ ステージ1で作ったバイナリだけをコピー
EXPOSE 50055
CMD ["./functions"]
```

### なぜ 2 ステージか

- ステージ1の `golang:1.25-alpine` は ~300MB
- ステージ2の `alpine:3.19` は ~8MB
- バイナリだけをコピーすることで最終イメージが小さくなる
- ソースコードも最終イメージに含まれない（セキュリティ）

### `go mod download` を先にする理由

```dockerfile
# ❌ 毎回 go mod download が走る（ソースを変えただけでもキャッシュ無効）
COPY . .
RUN go mod download && go build

# ✓ go.mod/go.sum が変わらない限り go mod download のキャッシュが効く
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build
```

Docker のキャッシュはレイヤー単位。`COPY` したファイルが変わったレイヤー以降は
キャッシュが無効になる。go.mod/go.sum は頻繁に変わらないので先に処理する。

---

## 16. docker-compose.yaml — Docker ソケットマウント

```yaml
functions:
  build:
    context: .                              # ← ルートからビルド（gen/ を含む）
    dockerfile: services/functions/Dockerfile
  ports:
    - "50055:50055"
  environment:
    DATABASE_URL: postgres://dev:dev@postgres:5432/functions_db?sslmode=disable
  volumes:
    - /var/run/docker.sock:/var/run/docker.sock   # ← 追加した行
  depends_on:
    postgres:
      condition: service_healthy            # ← postgres が ready になってから起動
```

`/var/run/docker.sock` は Docker デーモンへの Unix ソケット。
これをマウントすることで Functions コンテナから `docker` コマンドや Docker SDK が使える。

**セキュリティ上の注意:** このソケットへのアクセスは root 相当の権限を持つ。
本番では適切な認証・認可が必要。

---

## 17. 動作確認 — grpcurl の使い方

`grpcurl` は gRPC の curl のようなツール。

```bash
# 基本形
grpcurl \
  -plaintext \                           # TLS なし（開発環境）
  -import-path ./proto \                 # proto ファイルの検索パス
  -proto functions/functions.proto \    # 使う proto ファイル
  -d '{"name":"hello","runtime":"python3.12","code":"print(\"hi\")"}' \  # リクエスト JSON
  localhost:50055 \                      # ホスト:ポート
  functions.FunctionsService/CreateFunction  # パッケージ.サービス/メソッド

# リクエストなし（ListFunctionsRequest は空メッセージ）
grpcurl -plaintext -import-path ./proto -proto functions/functions.proto \
  localhost:50055 functions.FunctionsService/ListFunctions

# ExecuteFunction
grpcurl -plaintext -import-path ./proto -proto functions/functions.proto \
  -d '{"function_id":"<UUID>","timeout_sec":10}' \
  localhost:50055 functions.FunctionsService/ExecuteFunction
```

### 期待するレスポンス例

```json
// CreateFunction
{
  "id": "a1b2c3d4-...",
  "name": "hello",
  "runtime": "python3.12",
  "code": "print(\"hi\")",
  "createdAt": "2026-04-18T12:00:00Z",
  "timeoutSec": 30
}

// ExecuteFunction
{
  "output": "hi\n",
  "error": "",
  "exitCode": 0,
  "durationMs": 1234
}
```

---

## 18. ゼロから実装する手順チェックリスト

```
□ 1. proto ファイルを書く
      - service ブロックに全 RPC を定義
      - 各 RPC のリクエスト/レスポンスメッセージを定義
      - フィールド番号は連番（1, 2, 3...）

□ 2. protoc でコード生成
      protoc --go_out=./gen --go-grpc_out=./gen \
        --go_opt=paths=source_relative \
        --go-grpc_opt=paths=source_relative \
        -I proto proto/<name>.proto

□ 3. model/ にテーブル定義を書く
      - ID は `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
      - CreatedAt/UpdatedAt は time.Time で GORM が自動管理

□ 4. repository/ に GORM を使った CRUD を書く
      - db を struct フィールドに持つ
      - NewXxxRepo(db *gorm.DB) で外から注入

□ 5. usecase/ にビジネスロジックを書く
      - repo を struct フィールドに持つ
      - proto の型（pb.*）を一切 import しない
      - Docker SDK を使う場合: client.NewClientWithOpts(client.FromEnv)

□ 6. server/ に gRPC ハンドラを書く
      - pb.UnimplementedXxxServer を embed する
      - uc（usecase）を struct フィールドに持つ
      - 各メソッドで: proto型→プリミティブ変換 → uc 呼び出し → model→proto型変換
      - エラーは status.Errorf(codes.Xxx, ...) で返す
      - convert.go に model ↔ proto 変換関数を分ける

□ 7. main.go を書く
      - os.Getenv("DATABASE_URL") で DB 接続文字列を取得
      - db.AutoMigrate(&model.Xxx{}, ...) でテーブル作成
      - NewRepo → NewUsecase → NewServer の順で DI
      - grpc.NewServer() で gRPCサーバー作成
      - pb.RegisterXxxServer(grpcServer, srv) で登録
      - net.Listen("tcp", ":50055") → grpcServer.Serve(lis)

□ 8. go.mod に replace ディレクティブを追加（gen/ を使う場合）
      replace github.com/.../gen => ../../gen

□ 9. go mod tidy で依存関係を整理

□ 10. docker-compose.yaml に Docker ソケットマウントを追加（Docker 実行が必要な場合）
       volumes:
         - /var/run/docker.sock:/var/run/docker.sock

□ 11. Dockerfile のコピー順序を確認（gen/ → go.mod/go.sum → ソース）

□ 12. go build ./... でコンパイル確認

□ 13. make build && make up で起動確認

□ 14. grpcurl で各 RPC を動作確認
```

---

## 補足: よくあるハマりポイント

### 1. protoc を再生成し忘れる
proto を変えたのに `go build` が通らなくなったらまず再生成。
生成コードは `gen/` に置いてあり git 管理されているため、
proto を変えたら必ずセットで再生成してコミットする。

### 2. `replace` が効かない
`go.mod` に `replace` を書いても、実際のディレクトリが存在しないと
`go mod download` でエラーになる。Dockerfile では `gen/` を先にコピーすること。

### 3. Docker コンテナがイメージを pull できない
初回実行時に `ImagePull` で `python:3.12-alpine` を自動 pull する。
Functions コンテナが docker.io にアクセスできるネットワーク設定が必要。
pull 自体が失敗する場合は `docker pull python:3.12-alpine` を手動実行して確認する。

### 4. UUID が空で返ってくる
`gen_random_uuid()` は PostgreSQL の関数。
SQLite やモック DB では動かない。開発環境では必ず PostgreSQL を使う。

### 5. gRPC エラーが `Internal` になる
usecase や repository でエラーが起きると server 層で `codes.Internal` に変換されて返る。
`log.Printf` を各層に入れるとデバッグしやすい。
