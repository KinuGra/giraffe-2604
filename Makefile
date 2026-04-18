.PHONY: up down build logs ps proto

# 全サービス起動
up:
	docker compose up -d

# 全サービス停止
down:
	docker compose down

# Docker イメージ再ビルド
build:
	docker compose build

# ログ確認
logs:
	docker compose logs -f

# 稼働状況
ps:
	docker compose ps

# proto からコード生成 (buf)
proto:
	cd proto && buf generate

# proto の lint チェック
lint-proto:
	cd proto && buf lint
