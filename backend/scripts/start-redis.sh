#!/bin/bash

# Redis Docker Setup Script for Bus Ticket Booking System

echo "🚀 Setting up Redis with Docker..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Redis container is already running
if docker ps | grep -q redis; then
    echo "✅ Redis container is already running"
    docker ps | grep redis
    exit 0
fi

# Check if Redis container exists but is stopped
if docker ps -a | grep -q redis; then
    echo "🔄 Starting existing Redis container..."
    docker start redis
else
    echo "🐳 Creating new Redis container..."
    docker run -d \
        --name redis \
        -p 6379:6379 \
        redis:alpine
fi

# Wait for Redis to be ready
echo "⏳ Waiting for Redis to be ready..."
sleep 3

# Test connection
if docker exec redis redis-cli ping | grep -q PONG; then
    echo "✅ Redis is running and responding to ping"
    echo ""
    echo "📊 Redis Info:"
    echo "   Host: localhost"
    echo "   Port: 6379"
    echo "   Container: redis"
    echo ""
    echo "🛑 To stop Redis: docker stop redis"
    echo "🗑️  To remove Redis: docker rm redis"
else
    echo "❌ Redis failed to start properly"
    echo "   Check: docker logs redis"
    exit 1
fi