FROM golang:1.25-alpine AS builder

WORKDIR /build/services/storage
COPY services/storage/go.mod services/storage/go.sum ./
RUN go mod download
COPY services/storage/ .
RUN go build -o storage .

FROM alpine:3.21
WORKDIR /app
COPY --from=builder /build/services/storage/storage .
EXPOSE 50054
CMD ["./storage"]