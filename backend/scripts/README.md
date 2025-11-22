# Redis Startup Scripts

This directory contains scripts to start Redis server for development.

## Files

### `start-redis.bat` (Windows)

Starts Redis server using Docker on Windows systems.

**Usage:**

```bash
# From backend directory
./scripts/start-redis.bat

# Or from project root
cd backend && ./scripts/start-redis.bat
```

### `start-redis.sh` (Linux/Mac)

Starts Redis server using Docker on Unix-like systems.

**Usage:**

```bash
# From backend directory
./scripts/start-redis.sh

# Or from project root
cd backend && ./scripts/start-redis.sh
```

## Prerequisites

- Docker must be installed and running
- Docker Compose must be available

## What it does

The scripts run Redis in a Docker container with:

- Port: 6379 (default Redis port)
- Persistent data storage
- Automatic container management

## Troubleshooting

If Redis fails to start:

1. Ensure Docker is running
2. Check if port 6379 is available
3. Try stopping any existing Redis containers: `docker stop redis` then `docker rm redis`

## Alternative: Local Redis Installation

If you prefer not to use Docker, you can install Redis locally:

**Windows:**

- Download from: https://redis.io/download
- Run: `redis-server.exe`

**macOS (with Homebrew):**

```bash
brew install redis
brew services start redis
```

**Ubuntu/Debian:**

```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
```
