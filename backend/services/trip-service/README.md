# Trip Service

Trip search microservice for Bus Ticket Booking System.

## Features

- **Advanced Filtering**: Filter trips by origin, destination, bus type, departure time, price range, amenities, and available seats
- **Sorting**: Sort results by price, departure time, or duration (ascending/descending)
- **Pagination**: Paginated results with configurable page size
- **RESTful API**: Clean and well-documented endpoints

## Endpoints

### Health Check
```
GET /health
```

### Search Trips
```
GET /trips/search
```

Query parameters:
- `origin` (string): Origin location
- `destination` (string): Destination location
- `busType` (string/array): Bus types (standard, limousine, sleeper)
- `departureTime` (string/array): Time periods (morning, afternoon, evening, night)
- `minPrice` (number): Minimum price filter
- `maxPrice` (number): Maximum price filter
- `operatorId` (string): Filter by operator
- `amenities` (string/array): Required amenities (wifi, ac, toilet, entertainment)
- `passengers` (number): Minimum available seats required
- `sortBy` (string): Sort field (price, time, duration) - default: time
- `order` (string): Sort order (asc, desc) - default: asc
- `page` (number): Page number - default: 1
- `limit` (number): Items per page - default: 10

Example:
```
GET /trips/search?origin=Ho Chi Minh City&destination=Hanoi&busType=limousine,sleeper&sortBy=price&order=asc&page=1&limit=10
```

### Get Trip by ID
```
GET /trips/:tripId
```

## Installation

```bash
cd backend/services/trip-service
npm install
```

## Running the Service

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## Environment Variables

Create a `.env` file:
```
PORT=3003
NODE_ENV=development
SERVICE_NAME=trip-service
```

## Testing

```bash
npm test
```

## Docker

Build image:
```bash
docker build -t trip-service .
```

Run container:
```bash
docker run -p 3003:3003 trip-service
```
