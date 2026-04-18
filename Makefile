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

# proto から Go コード生成（ローカルに protoc がある場合のみ）
proto:
	protoc --go_out=./gen --go-grpc_out=./gen \
		--go_opt=paths=source_relative \
		--go-grpc_opt=paths=source_relative \
		proto/**/*.proto
