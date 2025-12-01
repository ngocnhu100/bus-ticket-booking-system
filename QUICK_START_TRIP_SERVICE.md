# Quick Start Guide - Trip Service

## Prerequisites

- Node.js 18+ installed
- Docker and Docker Compose installed (optional)
- Backend services running

## Option 1: Run with Docker Compose (Recommended)

### 1. Navigate to backend directory

```powershell
cd backend
```

### 2. Install dependencies for trip-service (first time only)

```powershell
cd services/trip-service
npm install
cd ../..
```

### 3. Start all services

```powershell
docker-compose up -d
```

### 4. Verify trip-service is running

```powershell
# Check container status
docker-compose ps

# View logs
docker-compose logs -f trip-service

# Test health endpoint
curl http://localhost:3002/health
```

### 5. Test the API through API Gateway

```powershell
# Search trips
curl "http://localhost:3000/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&date=2024-12-15"

# Get trip details
curl http://localhost:3000/trips/TRIP001

# Get operators
curl http://localhost:3000/trips/operators
```

## Option 2: Run Locally (Development)

### 1. Navigate to trip-service

```powershell
cd backend/services/trip-service
```

### 2. Install dependencies

```powershell
npm install
```

### 3. Start the service

```powershell
# Development mode with auto-reload
npm run dev

# Or production mode
npm start
```

### 4. Test the service

```powershell
# In a new terminal
curl http://localhost:3002/health
curl "http://localhost:3002/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&date=2024-12-15"
```

### 5. Run tests

```powershell
npm test
```

## Option 3: Run Only Trip Service with Docker

### 1. Build the image

```powershell
cd backend/services/trip-service
docker build -t trip-service .
```

### 2. Run the container

```powershell
docker run -p 3002:3002 --env-file .env trip-service
```

## API Testing Examples

### Search Trips with Filters

```powershell
# Basic search
curl "http://localhost:3000/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&date=2024-12-15"

# With bus type filter
curl "http://localhost:3000/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&date=2024-12-15&busType=limousine"

# With multiple filters
curl "http://localhost:3000/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&date=2024-12-15&busType=limousine&departureTime=morning&minPrice=400000&maxPrice=600000"

# With amenities
curl "http://localhost:3000/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&date=2024-12-15&amenities=wifi&amenities=toilet"

# With pagination
curl "http://localhost:3000/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&date=2024-12-15&page=1&limit=5"
```

### Get Trip Details

```powershell
curl http://localhost:3000/trips/TRIP001
curl http://localhost:3000/trips/TRIP002
```

### Get Operators and Routes

```powershell
curl http://localhost:3000/trips/operators
curl http://localhost:3000/trips/routes
```

## Common Issues

### Port 3002 already in use

```powershell
# Find process using port 3002
netstat -ano | findstr :3002

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Docker container won't start

```powershell
# Check logs
docker-compose logs trip-service

# Rebuild the container
docker-compose up -d --build trip-service
```

### API Gateway can't connect to Trip Service

Make sure `TRIP_SERVICE_URL` is set correctly in API Gateway:

```env
# In docker-compose.yml for api-gateway
TRIP_SERVICE_URL=http://trip-service:3002
```

## Stopping Services

### Stop all services

```powershell
docker-compose down
```

### Stop only trip-service

```powershell
docker-compose stop trip-service
```

### Stop local development server

Press `Ctrl+C` in the terminal running the service

## Next Steps

1. ✅ Verify all endpoints work
2. ✅ Run the test suite
3. ✅ Check the logs for any errors
4. ✅ Test with the frontend application
5. ✅ Monitor service performance

## Useful Commands

```powershell
# View service logs
docker-compose logs -f trip-service

# Restart service
docker-compose restart trip-service

# Execute commands inside container
docker-compose exec trip-service sh

# View container resource usage
docker stats bus-ticket-trip-service

# Remove and rebuild everything
docker-compose down
docker-compose up -d --build
```

## Documentation Links

- Full API Documentation: `backend/services/trip-service/README.md`
- Migration Summary: `TRIP_SERVICE_MIGRATION.md`
- Test Suite: `backend/services/trip-service/tests/tripService.test.js`

---

**Service Endpoints:**

- Trip Service Direct: `http://localhost:3002`
- Through API Gateway: `http://localhost:3000/trips`
- Health Check: `http://localhost:3002/health`

**Happy coding! 🚀**
