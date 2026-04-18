FROM golang:1.25-alpine AS builder

# gen/ をコピー
WORKDIR /build
COPY gen/ ./gen/

# functions をコピー & ビルド
WORKDIR /build/services/functions
COPY services/functions/go.mod services/functions/go.sum ./
RUN go mod download
COPY services/functions/ .
RUN go build -o functions .

FROM alpine:3.19
WORKDIR /app
COPY --from=builder /build/services/functions/functions .
EXPOSE 50055
CMD ["./functions"]
