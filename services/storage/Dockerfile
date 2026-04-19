FROM golang:1.25-alpine AS builder

WORKDIR /build
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o storage .

FROM alpine:3.21
WORKDIR /app
COPY --from=builder /build/storage .
EXPOSE 50054
CMD ["./storage"]