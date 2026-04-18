FROM golang:1.25-alpine AS builder

WORKDIR /build
COPY gen/ ./gen/

WORKDIR /build/services/gateway
COPY services/gateway/go.mod services/gateway/go.sum ./
RUN go mod download
COPY services/gateway/ .
RUN go build -o gateway .

FROM alpine:3.21
WORKDIR /app
COPY --from=builder /build/services/gateway/gateway .
EXPOSE 8080
CMD ["./gateway"]
