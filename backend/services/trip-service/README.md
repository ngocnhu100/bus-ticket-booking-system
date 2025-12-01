# Trip Service

## Overview

The Trip Service is a microservice responsible for managing trip search and filtering functionality in the Bus Ticket Booking System. It handles advanced trip searches with multiple filter criteria including departure time, price range, bus type, amenities, and more.

## Features

- **Advanced Trip Search**: Search trips with multiple filter criteria
- **Flexible Filtering**: Filter by bus type, departure time, price range, amenities, and operator
- **Pagination Support**: Efficient pagination for large result sets
- **Operator Management**: Get list of all bus operators
- **Route Management**: Get list of all available routes
- **Trip Details**: Retrieve detailed information about specific trips

## Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Validation**: Joi
- **Testing**: Jest + Supertest
- **Containerization**: Docker

## API Endpoints

### 1. Search Trips
**GET** `/search`

Search for trips with advanced filtering options.

**Query Parameters:**
- `origin` (string, required): Origin city
- `destination` (string, required): Destination city
- `date` (string, required): Travel date
- `passengers` (number, optional): Number of passengers (default: 1)
- `busType` (string|array, optional): Bus type(s) - `standard`, `limousine`, `sleeper`
- `departureTime` (string|array, optional): Departure time period(s) - `morning`, `afternoon`, `evening`, `night`
- `minPrice` (number, optional): Minimum price in VND
- `maxPrice` (number, optional): Maximum price in VND
- `operatorId` (string, optional): Filter by operator ID
- `amenities` (string|array, optional): Required amenities - `wifi`, `ac`, `toilet`, `entertainment`
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10, max: 100)

**Example Request:**
```bash
GET /search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&date=2024-12-15&busType=limousine&departureTime=morning&minPrice=400000&maxPrice=600000&amenities=wifi&amenities=toilet&page=1&limit=10
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "trips": [
      {
        "tripId": "TRIP001",
        "route": {
          "routeId": "ROUTE001",
          "origin": "Ho Chi Minh City",
          "destination": "Hanoi",
          "distance": 1720,
          "estimatedDuration": 720
        },
        "operator": {
          "operatorId": "OP001",
          "name": "Futa Bus Lines",
          "rating": 4.5,
          "logo": "https://via.placeholder.com/100x100?text=Futa"
        },
        "bus": {
          "busId": "BUS001",
          "busType": "limousine",
          "licensePlate": "59A-12345",
          "totalSeats": 40,
          "amenities": [
            { "id": "wifi", "name": "WiFi" },
            { "id": "ac", "name": "Air Conditioning" },
            { "id": "entertainment", "name": "Entertainment" }
          ]
        },
        "schedule": {
          "scheduleId": "SCH001",
          "departureTime": "08:00",
          "arrivalTime": "20:00",
          "frequency": "daily"
        },
        "pricing": {
          "basePrice": 450000,
          "currency": "VND",
          "discounts": []
        },
        "availability": {
          "availableSeats": 15,
          "totalSeats": 40
        }
      }
    ],
    "totalCount": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "filters": {
      "origin": "Ho Chi Minh City",
      "destination": "Hanoi",
      "date": "2024-12-15",
      "busType": ["limousine"],
      "departureTime": ["morning"],
      "minPrice": 400000,
      "maxPrice": 600000,
      "amenities": ["wifi", "toilet"]
    }
  },
  "timestamp": "2024-12-01T10:30:00.000Z"
}
```

### 2. Get Trip by ID
**GET** `/:tripId`

Retrieve detailed information about a specific trip.

**Example Request:**
```bash
GET /TRIP001
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "tripId": "TRIP001",
    "route": { ... },
    "operator": { ... },
    "bus": { ... },
    "schedule": { ... },
    "pricing": { ... },
    "availability": { ... }
  },
  "timestamp": "2024-12-01T10:30:00.000Z"
}
```

### 3. Get All Operators
**GET** `/operators`

Retrieve a list of all bus operators.

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "operatorId": "OP001",
      "name": "Futa Bus Lines",
      "rating": 4.5,
      "logo": "https://via.placeholder.com/100x100?text=Futa"
    }
  ],
  "timestamp": "2024-12-01T10:30:00.000Z"
}
```

### 4. Get All Routes
**GET** `/routes`

Retrieve a list of all available routes.

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "routeId": "ROUTE001",
      "origin": "Ho Chi Minh City",
      "destination": "Hanoi",
      "distance": 1720
    }
  ],
  "timestamp": "2024-12-01T10:30:00.000Z"
}
```

### 5. Health Check
**GET** `/health`

Check service health status.

**Example Response:**
```json
{
  "service": "trip-service",
  "status": "healthy",
  "timestamp": "2024-12-01T10:30:00.000Z",
  "version": "1.0.0"
}
```

## Filter Criteria

### Bus Types
- `standard`: Standard seating bus
- `limousine`: Luxury limousine bus
- `sleeper`: Sleeper bus with beds

### Departure Time Periods
- `morning`: 06:00 - 12:00
- `afternoon`: 12:00 - 18:00
- `evening`: 18:00 - 24:00
- `night`: 00:00 - 06:00

### Amenities
- `wifi`: WiFi connectivity
- `ac`: Air conditioning
- `toilet`: Onboard toilet
- `entertainment`: Entertainment system

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": []
  },
  "timestamp": "2024-12-01T10:30:00.000Z"
}
```

### Error Codes
- `VALIDATION_ERROR`: Invalid request parameters
- `NOT_FOUND`: Resource not found
- `INTERNAL_ERROR`: Internal server error

## Development

### Local Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Configure environment variables:**
Create a `.env` file:
```env
PORT=3002
NODE_ENV=development
SERVICE_NAME=trip-service
```

3. **Run the service:**
```bash
# Development mode
npm run dev

# Production mode
npm start
```

4. **Run tests:**
```bash
npm test
```

### Docker Setup

1. **Build the Docker image:**
```bash
docker build -t trip-service .
```

2. **Run the container:**
```bash
docker run -p 3002:3002 --env-file .env trip-service
```

### With Docker Compose

From the `backend` directory:

```bash
# Start all services
docker-compose up -d

# Start only trip-service
docker-compose up -d trip-service

# View logs
docker-compose logs -f trip-service

# Stop services
docker-compose down
```

## Testing

The service includes comprehensive test coverage:

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- tripService.test.js
```

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| PORT | Service port | 3002 | No |
| NODE_ENV | Environment | development | No |
| SERVICE_NAME | Service name | trip-service | No |

## Architecture

```
trip-service/
├── src/
│   ├── index.js           # Express server setup
│   ├── tripController.js  # Request handlers
│   ├── tripService.js     # Business logic
│   ├── mockData.js        # Mock trip data
│   └── validation.js      # Input validation schemas
├── tests/
│   ├── test-env.js        # Test environment setup
│   ├── setup.js           # Test global setup
│   └── tripService.test.js # Service tests
├── .env                   # Environment variables
├── .dockerignore         # Docker ignore file
├── Dockerfile            # Docker configuration
├── package.json          # Dependencies
└── README.md            # This file
```

## Integration

The Trip Service is designed to work as part of the Bus Ticket Booking System microservices architecture. It is accessed through the API Gateway.

**API Gateway URL Pattern:**
```
http://api-gateway:3000/trips/*
```

The API Gateway proxies all `/trips` requests to this service.

## Future Enhancements

- [ ] Database integration (PostgreSQL)
- [ ] Real-time seat availability
- [ ] Trip booking integration
- [ ] Advanced caching with Redis
- [ ] Rate limiting
- [ ] Search result sorting
- [ ] Favorite trips
- [ ] Trip recommendations

## License

ISC

## Support

For issues or questions, please contact the development team.
