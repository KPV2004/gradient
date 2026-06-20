# apps/grader-service/Dockerfile
FROM golang:1.26-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o grader-service ./apps/grader-service/main.go

FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/grader-service .
COPY apps/grader-service/config/sandbox_profiles.yaml ./config/sandbox_profiles.yaml
EXPOSE 8081
CMD ["./grader-service"]
