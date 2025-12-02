# DEPLOYMENT & TESTING GUIDE

## 🚀 Quick Start

### Option 1: Run Standalone (Development)

```bash
# Navigate to trip-service
cd backend/services/trip-service

# Install dependencies
npm install

# Start service
npm start
```

Service will be available at `http://localhost:3003`

### Option 2: Run with Docker

```bash
# Navigate to backend
cd backend

# Build and start all services
docker-compose up --build

# Or start only trip-service
docker-compose up trip-service
```

### Option 3: Run Complete System

```bash
cd backend

# Start all services (Auth, Trip, Notification, API Gateway)
docker-compose up

# Access via API Gateway
curl http://localhost:3000/trips/search?origin=Hanoi&destination=Da%20Nang
```

## 🧪 Testing Guide

### 1. Health Check

**Direct to Trip Service:**
```bash
curl http://localhost:3003/health
```

**Via API Gateway:**
```bash
curl http://localhost:3000/trips/health
```

**Expected Response:**
```json
{
  "service": "trip-service",
  "status": "healthy",
  "timestamp": "2025-12-01T...",
  "version": "1.0.0"
}
```

### 2. Basic Search

```bash
# Direct
curl "http://localhost:3003/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi"

# Via API Gateway
curl "http://localhost:3000/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi"
```

### 3. Advanced Filtering

**Filter by Bus Type:**
```bash
curl "http://localhost:3003/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&busType=limousine,sleeper"
```

**Filter by Departure Time:**
```bash
curl "http://localhost:3003/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&departureTime=morning,afternoon"
```

**Filter by Price Range:**
```bash
curl "http://localhost:3003/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&minPrice=400000&maxPrice=500000"
```

**Filter by Amenities:**
```bash
curl "http://localhost:3003/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&amenities=wifi,toilet,entertainment"
```

**Combined Filters:**
```bash
curl "http://localhost:3003/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&busType=limousine&departureTime=morning&minPrice=400000&maxPrice=600000&amenities=wifi,ac"
```

### 4. Sorting

**Sort by Price (Ascending):**
```bash
curl "http://localhost:3003/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&sortBy=price&order=asc"
```

**Sort by Price (Descending):**
```bash
curl "http://localhost:3003/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&sortBy=price&order=desc"
```

**Sort by Departure Time:**
```bash
curl "http://localhost:3003/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&sortBy=time&order=asc"
```

**Sort by Duration:**
```bash
curl "http://localhost:3003/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&sortBy=duration&order=asc"
```

### 5. Pagination

**Page 1:**
```bash
curl "http://localhost:3003/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&page=1&limit=5"
```

**Page 2:**
```bash
curl "http://localhost:3003/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&page=2&limit=5"
```

### 6. Get Trip by ID

```bash
curl "http://localhost:3003/trips/TRIP001"
```

### 7. Complete Example (All Features)

```bash
curl "http://localhost:3003/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&busType=limousine,sleeper&departureTime=morning,afternoon&minPrice=400000&maxPrice=600000&amenities=wifi,ac&sortBy=price&order=asc&page=1&limit=10"
```

## 🔧 Configuration

### Environment Variables

Create `.env` file in `backend/services/trip-service/`:

```env
PORT=3003
NODE_ENV=development
SERVICE_NAME=trip-service
```

### API Gateway Configuration

Update `backend/api-gateway/.env`:

```env
PORT=3000
AUTH_SERVICE_URL=http://localhost:3001
TRIP_SERVICE_URL=http://localhost:3003
NOTIFICATION_SERVICE_URL=http://localhost:3004
```

### Docker Compose Configuration

Ports are configured in `backend/docker-compose.yml`:
- API Gateway: 3000
- Auth Service: 3001
- Trip Service: 3003
- Notification Service: 3004

## 🐛 Troubleshooting

### Service Won't Start

**Check if port is already in use:**
```bash
# Windows
netstat -ano | findstr :3003

# Linux/Mac
lsof -i :3003
```

**Kill process if needed:**
```bash
# Windows
taskkill /PID <PID> /F

# Linux/Mac
kill -9 <PID>
```

### Cannot Connect to Service

**Verify service is running:**
```bash
# Check logs
docker-compose logs trip-service

# Or if running standalone
# Check terminal output
```

**Verify port mapping:**
```bash
docker ps | grep trip-service
```

### Docker Build Issues

**Clean rebuild:**
```bash
docker-compose down
docker-compose build --no-cache trip-service
docker-compose up trip-service
```

**Remove old images:**
```bash
docker rmi $(docker images -f "dangling=true" -q)
```

## 📊 Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    "trips": [...],
    "totalCount": 20,
    "page": 1,
    "limit": 10,
    "totalPages": 2
  },
  "timestamp": "2025-12-01T12:00:00.000Z"
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid sortBy. Valid values are: price, time, duration"
  },
  "timestamp": "2025-12-01T12:00:00.000Z"
}
```

## 🔍 Frontend Integration

### API Client Setup

```typescript
// In frontend/src/api/trips.ts
const API_BASE_URL = 'http://localhost:3000'; // API Gateway

export const searchTrips = async (params: SearchParams) => {
  const queryString = new URLSearchParams(params).toString();
  const response = await fetch(`${API_BASE_URL}/trips/search?${queryString}`);
  return response.json();
};
```

### Example Usage in React

```typescript
import { searchTrips } from '@/api/trips';

const TripSearch = () => {
  const [trips, setTrips] = useState([]);
  
  const handleSearch = async () => {
    const results = await searchTrips({
      origin: 'Ho Chi Minh City',
      destination: 'Hanoi',
      busType: ['limousine', 'sleeper'],
      sortBy: 'price',
      order: 'asc',
      page: 1,
      limit: 10
    });
    
    setTrips(results.data.trips);
  };
  
  return <div>...</div>;
};
```

## 📝 Production Deployment

### Environment Setup

**Production Environment Variables:**
```env
NODE_ENV=production
PORT=3003
LOG_LEVEL=info
```

### Docker Production Build

```bash
# Build production image
docker build -t trip-service:latest -f Dockerfile .

# Run production container
docker run -d \
  -p 3003:3003 \
  -e NODE_ENV=production \
  --name trip-service \
  trip-service:latest
```

### Health Monitoring

**Kubernetes Health Probes:**
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 3003
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health
    port: 3003
  initialDelaySeconds: 5
  periodSeconds: 5
```

## 🎯 Performance Tips

### Optimization Recommendations

1. **Add Caching:**
   - Cache search results in Redis
   - Set TTL based on data freshness requirements

2. **Database Indexing:**
   - Index origin and destination fields
   - Composite index on (origin, destination, departureTime)

3. **Response Compression:**
   - Enable gzip compression in Express

4. **Connection Pooling:**
   - Configure database connection pool
   - Reuse HTTP connections

## 🔐 Security Considerations

### Current Implementation
- ✅ Helmet.js for security headers
- ✅ CORS configuration
- ✅ Input validation with Joi
- ✅ No sensitive data exposure

### Additional Recommendations
- Add rate limiting
- Implement API authentication if needed
- Add request logging for audit
- Sanitize error messages in production

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [Joi Validation](https://joi.dev/)
- [Docker Documentation](https://docs.docker.com/)
- [Microservices Pattern](https://microservices.io/)

## ✅ Verification Checklist

Before deploying to production:

- [ ] All dependencies installed
- [ ] Environment variables configured
- [ ] Health endpoint responding
- [ ] All search filters working
- [ ] Sorting functioning correctly
- [ ] Pagination working as expected
- [ ] Error handling tested
- [ ] API Gateway integration verified
- [ ] Docker build successful
- [ ] Performance benchmarked
- [ ] Security headers configured
- [ ] Monitoring set up
- [ ] Documentation updated
