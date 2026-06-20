#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "🚀 Starting Gradient Platform Stack..."

# Check if docker is running
if ! docker info >/dev/null 2>&1; then
    echo "🚨 Error: Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Run docker compose up
echo "📦 Running Docker Compose (Database, Backend, Grader & Frontend)..."
docker compose up --build
