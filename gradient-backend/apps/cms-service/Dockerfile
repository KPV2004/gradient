# apps/cms-service/Dockerfile
FROM golang:1.26-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o cms-service ./apps/cms-service/main.go

FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/cms-service .
EXPOSE 8080
CMD ["./cms-service"]
