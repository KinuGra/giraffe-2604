# DB 設計仕様書

**データベース:** PostgreSQL 16  
**データベース名:** `functions_db`  
**接続:** `postgres://dev:dev@postgres:5432/functions_db?sslmode=disable`

テーブルは `services/functions/main.go` の `db.AutoMigrate()` によってサービス起動時に自動作成・更新される。

---

## ER 図

```
┌──────────────────────────────────┐
│           functions              │
├──────────────────────────────────┤
│ id          UUID  PK             │
│ name        VARCHAR  NOT NULL    │
│ runtime     VARCHAR  NOT NULL    │
│ code        TEXT     NOT NULL    │
│ timeout_sec INTEGER  NOT NULL    │
│ created_at  TIMESTAMPTZ          │
│ updated_at  TIMESTAMPTZ          │
└──────────────────────┬───────────┘
                       │ 1
                       │
                       │ N
┌──────────────────────▼───────────┐
│         execution_logs           │
├──────────────────────────────────┤
│ id          UUID  PK             │
│ function_id UUID  NOT NULL  IDX  │◄── functions.id
│ output      TEXT                 │
│ error       TEXT                 │
│ exit_code   INTEGER              │
│ duration_ms BIGINT               │
│ created_at  TIMESTAMPTZ          │
└──────────────────────────────────┘
```

---

## テーブル定義

### functions

関数の定義情報を保存するテーブル。

| カラム名     | 型           | 制約                                    | 説明                          |
|------------|--------------|----------------------------------------|-------------------------------|
| id         | uuid         | PRIMARY KEY, DEFAULT gen_random_uuid() | PostgreSQL が UUID を自動生成  |
| name       | varchar      | NOT NULL                               | ユーザーが付けた関数名         |
| runtime    | varchar      | NOT NULL                               | 実行環境識別子                 |
| code       | text         | NOT NULL                               | 実行するソースコード全文        |
| timeout_sec| integer      | NOT NULL, DEFAULT 30                   | コンテナ実行タイムアウト（秒）  |
| created_at | timestamptz  | GORM が INSERT 時に自動セット           | 作成日時                      |
| updated_at | timestamptz  | GORM が UPDATE 時に自動更新            | 最終更新日時                  |

**runtime の取りうる値:**

| 値          | 対応 Docker イメージ  |
|------------|----------------------|
| python3.12 | python:3.12-alpine   |
| node20     | node:20-alpine       |

**インデックス:** PRIMARY KEY (id) のみ

**GORM モデル定義 (`model/function.go`):**

```go
type Function struct {
    ID         string    `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
    Name       string    `gorm:"not null"`
    Runtime    string    `gorm:"not null"`
    Code       string    `gorm:"type:text;not null"`
    TimeoutSec int       `gorm:"default:30;not null"`
    CreatedAt  time.Time
    UpdatedAt  time.Time
}
```

---

### execution_logs

関数の実行結果を記録するテーブル。実行ごとに 1 レコードが INSERT される。関数を削除しても実行ログは残る。

| カラム名     | 型           | 制約                                    | 説明                          |
|------------|--------------|----------------------------------------|-------------------------------|
| id         | uuid         | PRIMARY KEY, DEFAULT gen_random_uuid() | 実行ごとにユニークな UUID      |
| function_id| uuid         | NOT NULL, INDEX                        | 実行した関数の id             |
| output     | text         |                                        | コンテナ stdout の内容        |
| error      | text         |                                        | コンテナ stderr の内容        |
| exit_code  | integer      |                                        | プロセス終了コード（0=正常）   |
| duration_ms| bigint       |                                        | コンテナ起動〜終了の経過時間   |
| created_at | timestamptz  | GORM が INSERT 時に自動セット           | 実行日時                      |

**インデックス:**
- PRIMARY KEY (id)
- INDEX (function_id) — `ListLogs` の `WHERE function_id = ?` を高速化

**GORM モデル定義 (`model/function.go`):**

```go
type ExecutionLog struct {
    ID         string    `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
    FunctionID string    `gorm:"type:uuid;not null;index"`
    Output     string    `gorm:"type:text"`
    Error      string    `gorm:"type:text"`
    ExitCode   int
    DurationMs int64
    CreatedAt  time.Time
}
```

---

## 主な CRUD クエリ

`repository/function_repo.go` が発行するクエリを GORM の記法と SQL 相当で示す。

### 関数の作成

```go
r.db.Create(f)
```

```sql
INSERT INTO functions (id, name, runtime, code, timeout_sec, created_at, updated_at)
VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW())
RETURNING *;
```

UUID は DB 側で生成され、INSERT 後に `f.ID` に書き戻される。

### ID で関数を取得

```go
r.db.First(&f, "id = ?", id)
```

```sql
SELECT * FROM functions WHERE id = $1 ORDER BY id LIMIT 1;
```

### 名前で関数を取得

```go
r.db.First(&f, "name = ?", name)
```

```sql
SELECT * FROM functions WHERE name = $1 ORDER BY id LIMIT 1;
```

### 全関数取得

```go
r.db.Find(&funcs)
```

```sql
SELECT * FROM functions;
```

### 関数の更新

空文字・0 のフィールドは更新しない（部分更新）。

```go
r.db.First(&f, "id = ?", id)
// name/code/timeoutSec が非ゼロ値のときのみ上書き
r.db.Save(&f)
```

```sql
SELECT * FROM functions WHERE id = $1 ORDER BY id LIMIT 1;
UPDATE functions SET name=$2, code=$3, timeout_sec=$4, updated_at=NOW() WHERE id=$1;
```

### 関数の削除

```go
r.db.Delete(&model.Function{}, "id = ?", id)
```

```sql
DELETE FROM functions WHERE id = $1;
```

### 実行ログの保存

```go
r.db.Create(l)
```

```sql
INSERT INTO execution_logs (id, function_id, output, error, exit_code, duration_ms, created_at)
VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW());
```

### 実行ログ一覧（最新順）

```go
r.db.Where("function_id = ?", functionID).Order("created_at desc").Find(&logs)
```

```sql
SELECT * FROM execution_logs WHERE function_id = $1 ORDER BY created_at DESC;
```

---

## AutoMigrate の挙動

```go
db.AutoMigrate(&model.Function{}, &model.ExecutionLog{})
```

サービス起動時に毎回実行される。

| 状況 | 挙動 |
|------|------|
| テーブルが存在しない | CREATE TABLE を実行 |
| カラムが追加された | ALTER TABLE ADD COLUMN を実行 |
| カラムが削除された | **何もしない**（安全のため） |
| カラムの型が変わった | 変更しない（手動マイグレーションが必要） |

---

## DB 初期化

`db/init.sql` がコンテナ初回起動時に実行され、`functions_db` データベースを作成する。テーブル自体はアプリの AutoMigrate が担う。
