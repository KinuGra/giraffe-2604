# サーバーレス関数基盤 ドキュメント

AWS Lambda の極小版として「ユーザーがコードを登録し、Docker コンテナ上で安全に実行できる」基盤の設計・仕様ドキュメント集。

## ドキュメント一覧

| ファイル | 内容 |
|---------|------|
| [architecture.md](./architecture.md) | システム全体像・通信フロー・レイヤー構成・Docker 実行の仕組み |
| [api-spec.md](./api-spec.md) | REST API 仕様（Gateway）および gRPC RPC 仕様 |
| [db-spec.md](./db-spec.md) | DB テーブル設計・ER 図・インデックス設計 |

## システム概要

```
Browser (Next.js :3000)
    │ HTTP/REST
    ▼
API Gateway (Gin :8080)
    │ gRPC / Protobuf
    ▼
Functions Service (:50055)
    ├── PostgreSQL :5432  (関数定義・実行ログ保存)
    └── Docker API        (コード安全実行)
```

## 対応ランタイム

| 識別子       | Docker イメージ       |
|------------|----------------------|
| python3.12 | python:3.12-alpine   |
| node20     | node:20-alpine       |
