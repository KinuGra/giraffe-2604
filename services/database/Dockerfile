FROM golang:1.25-alpine AS builder

# gen/ をコピー
WORKDIR /build
COPY gen/ ./gen/

# database をコピー & ビルド
WORKDIR /build/services/database
COPY services/database/ .
RUN go mod tidy && go build -o database .

FROM alpine:3.21
WORKDIR /app
COPY --from=builder /build/services/database/database .
EXPOSE 50056
CMD ["./database"]