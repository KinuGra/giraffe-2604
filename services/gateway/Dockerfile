FROM golang:1.25-alpine AS builder

WORKDIR /build
COPY gen/ ./gen/

COPY services/gateway/go.mod services/gateway/go.sum services/storage/go.mod services/storage/go.sum /build/services/gateway/
COPY gen/ /build/gen/

WORKDIR /build/services/gateway
RUN go mod download

COPY services/gateway/ .
COPY services/storage/ /build/services/storage/
RUN go build -o gateway .

FROM alpine:3.21
WORKDIR /app
COPY --from=builder /build/services/gateway/gateway .
EXPOSE 8080
CMD ["./gateway"]
