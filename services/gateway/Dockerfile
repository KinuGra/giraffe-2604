FROM golang:1.25-alpine AS builder

# gen/ をコピー
WORKDIR /build
COPY gen/ ./gen/

# gateway をコピー & ビルド
WORKDIR /build/services/gateway
COPY services/gateway/ .
RUN go mod tidy && go build -o gateway .

FROM alpine:3.21
WORKDIR /app
COPY --from=builder /build/services/gateway/gateway .
CMD ["./gateway"]
