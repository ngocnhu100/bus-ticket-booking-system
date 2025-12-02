# Trip Service - Quick Reference

## Service Information
- **Port**: 3003
- **Base URL (Direct)**: http://localhost:3003
- **Base URL (via Gateway)**: http://localhost:3000/trips
- **Health Check**: GET /health

## Quick Commands

### Start Service
```bash
cd backend/services/trip-service
npm install
npm start
```

### Run with Docker
```bash
cd backend
docker-compose up trip-service
```

## API Endpoints

### 1. Search Trips
```
GET /trips/search
```

**Common Examples:**

```bash
# Basic search
/trips/search?origin=Ho Chi Minh City&destination=Hanoi

# With bus type filter
/trips/search?origin=Hanoi&destination=Da Nang&busType=limousine,sleeper

# With price sorting
/trips/search?origin=Hanoi&destination=Da Nang&sortBy=price&order=asc

# With pagination
/trips/search?origin=Hanoi&destination=Da Nang&page=1&limit=5

# Complete example
/trips/search?origin=Ho Chi Minh City&destination=Hanoi&busType=limousine&sortBy=price&order=asc&page=1&limit=10
```

### 2. Get Trip by ID
```
GET /trips/:tripId
```

**Example:**
```bash
/trips/TRIP001
```

## Query Parameters

| Parameter | Type | Values | Description |
|-----------|------|--------|-------------|
| origin | string | - | Origin city |
| destination | string | - | Destination city |
| busType | string/array | standard, limousine, sleeper | Bus type filter |
| departureTime | string/array | morning, afternoon, evening, night | Departure time filter |
| minPrice | number | - | Minimum price in VND |
| maxPrice | number | - | Maximum price in VND |
| amenities | string/array | wifi, ac, toilet, entertainment | Required amenities |
| passengers | number | - | Minimum available seats |
| sortBy | string | price, time, duration | Sort field (default: time) |
| order | string | asc, desc | Sort order (default: asc) |
| page | number | - | Page number (default: 1) |
| limit | number | 1-100 | Items per page (default: 10) |

## Response Format

### Success
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
  "timestamp": "2025-12-01T..."
}
```

### Error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Error description"
  },
  "timestamp": "2025-12-01T..."
}
```

## Available Routes (Sample Data)

### Ho Chi Minh City → Hanoi
- 10 trips available
- Price range: 320,000 - 580,000 VND
- Bus types: standard, limousine, sleeper
- Operators: Futa, Phuong Trang, Hoang Long, Mai Linh

### Ho Chi Minh City → Da Nang
- 8 trips available
- Price range: 290,000 - 430,000 VND
- All bus types available

### Hanoi → Da Nang
- 3 trips available
- Price range: 360,000 - 480,000 VND
- Sleeper and limousine available

## Trip IDs
TRIP001 - TRIP020 (20 trips total)

## Common Use Cases

### 1. Find cheapest trips
```
sortBy=price&order=asc
```

### 2. Find early morning trips
```
departureTime=morning
```

### 3. Find luxury trips with amenities
```
busType=limousine,sleeper&amenities=wifi,toilet,entertainment
```

### 4. Find trips within budget
```
minPrice=300000&maxPrice=400000
```

## Integration with Frontend

```typescript
// Example API call
const searchTrips = async (params) => {
  const response = await fetch(
    `http://localhost:3000/trips/search?${new URLSearchParams(params)}`
  );
  return response.json();
};
```

## Status Codes

- `200` - Success
- `400` - Validation Error
- `404` - Trip Not Found
- `500` - Internal Server Error
