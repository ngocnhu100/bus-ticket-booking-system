# Trip Search API Documentation

## Endpoint: GET /trips/search

API endpoint hỗ trợ tìm kiếm chuyến xe với các bộ lọc nâng cao (Advanced Filtering).

## Base URL
```
http://localhost:3000
```

## Request

### Required Query Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| origin | string | Điểm xuất phát | `Ho Chi Minh City` |
| destination | string | Điểm đến | `Hanoi` |
| date | string | Ngày khởi hành (ISO 8601) | `2024-01-20` |

### Optional Query Parameters

| Parameter | Type | Description | Valid Values | Example |
|-----------|------|-------------|--------------|---------|
| passengers | integer | Số hành khách | > 0 | `2` |
| busType | string[] | Loại xe | `standard`, `limousine`, `sleeper` | `busType=limousine&busType=sleeper` |
| departureTime | string[] | Khung giờ xuất phát | `morning`, `afternoon`, `evening`, `night` | `departureTime=morning&departureTime=afternoon` |
| minPrice | number | Giá tối thiểu (VND) | >= 0 | `300000` |
| maxPrice | number | Giá tối đa (VND) | >= minPrice | `500000` |
| operatorId | string | ID nhà xe | - | `OP001` |
| amenities | string[] | Tiện ích | `wifi`, `ac`, `toilet`, `entertainment` | `amenities=wifi&amenities=ac` |
| page | integer | Số trang | >= 1, default: 1 | `1` |
| limit | integer | Số kết quả mỗi trang | 1-100, default: 10 | `10` |

### Time Periods
- **morning**: 6:00 - 11:59
- **afternoon**: 12:00 - 17:59
- **evening**: 18:00 - 23:59
- **night**: 0:00 - 5:59

## Response

### Success Response (200 OK)

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
    "totalCount": 20,
    "page": 1,
    "limit": 10,
    "totalPages": 2,
    "filters": {
      "origin": "Ho Chi Minh City",
      "destination": "Hanoi",
      "date": "2024-01-20",
      "busType": ["limousine", "sleeper"],
      "departureTime": ["morning"],
      "minPrice": 300000,
      "maxPrice": 500000,
      "operatorId": null,
      "amenities": ["wifi", "ac"],
      "passengers": 2
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Error Responses

#### 400 Bad Request - Missing Required Parameters
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Missing required parameters: origin, destination, and date are required"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### 400 Bad Request - Invalid busType
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid busType. Valid values are: standard, limousine, sleeper"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### 400 Bad Request - Invalid departureTime
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid departureTime. Valid values are: morning, afternoon, evening, night"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### 400 Bad Request - Invalid Price Range
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "minPrice cannot be greater than maxPrice"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### 400 Bad Request - Invalid Page
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Page must be greater than 0"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### 400 Bad Request - Invalid Limit
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Limit must be between 1 and 100"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An error occurred while searching trips"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Example Requests

### Basic Search
```bash
curl "http://localhost:3000/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&date=2024-01-20"
```

### Search with Bus Type Filter
```bash
curl "http://localhost:3000/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&date=2024-01-20&busType=limousine&busType=sleeper"
```

### Search with Departure Time Filter
```bash
curl "http://localhost:3000/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&date=2024-01-20&departureTime=morning&departureTime=afternoon"
```

### Search with Price Range Filter
```bash
curl "http://localhost:3000/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&date=2024-01-20&minPrice=300000&maxPrice=500000"
```

### Search with Amenities Filter
```bash
curl "http://localhost:3000/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&date=2024-01-20&amenities=wifi&amenities=ac&amenities=toilet"
```

### Search with Multiple Filters and Pagination
```bash
curl "http://localhost:3000/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&date=2024-01-20&busType=limousine&departureTime=morning&minPrice=400000&maxPrice=600000&amenities=wifi&amenities=entertainment&passengers=2&page=1&limit=5"
```

## Filter Logic

### Bus Type Filter
- Trips match if their `bus.busType` is in the provided array
- Multiple bus types can be selected (OR logic)

### Departure Time Filter
- Trips are categorized by their `schedule.departureTime`:
  - Morning: 06:00-11:59
  - Afternoon: 12:00-17:59
  - Evening: 18:00-23:59
  - Night: 00:00-05:59
- Multiple time periods can be selected (OR logic)

### Price Range Filter
- Trips match if `pricing.basePrice` is within the range
- Both `minPrice` and `maxPrice` are inclusive
- If only `minPrice` is provided, no upper limit
- If only `maxPrice` is provided, no lower limit

### Amenities Filter
- Trips must have ALL requested amenities (AND logic)
- A trip matches only if its `bus.amenities` array contains all requested amenity IDs

### Passengers Filter
- Trips match if `availability.availableSeats >= passengers`
- Ensures enough seats are available for booking

### Operator Filter
- Trips match if `operator.operatorId` equals the provided ID
- Single operator selection only

## Mock Data

Backend hiện tại sử dụng 20 mock trips với:
- 3 routes: Ho Chi Minh City → Hanoi, Ho Chi Minh City → Da Nang, Hanoi → Da Nang
- 4 operators: Futa Bus Lines, Phuong Trang Express, Hoang Long Bus, Mai Linh Express
- 3 bus types: standard, limousine, sleeper
- Various amenity combinations
- Price range: 290,000 - 580,000 VND
- Departure times covering all time periods

## Testing

### Test với curl:
```bash
# Test basic search
curl "http://localhost:3000/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&date=2024-01-20"

# Test với multiple filters
curl "http://localhost:3000/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&date=2024-01-20&busType=sleeper&departureTime=evening&amenities=wifi&amenities=toilet"
```

### Test với Postman/Thunder Client:
1. Method: GET
2. URL: `http://localhost:3000/trips/search`
3. Query Params: Thêm các parameters cần thiết
4. Send request

## Implementation Details

### File Structure
```
backend/api-gateway/src/
├── index.js           # Main Express app with /trips/search endpoint
└── tripService.js     # Mock data and filtering logic
```

### Key Functions (tripService.js)

#### `getTimePeriod(timeString)`
Converts time string (HH:mm) to period (morning/afternoon/evening/night)

#### `filterTrips(trips, filters)`
Applies all filters to the trip array and returns matching trips

#### `paginateResults(trips, page, limit)`
Paginates filtered results and returns page metadata

## Future Enhancements

1. **Database Integration**: Replace mock data with real database queries
2. **Sorting**: Add sorting by price, departure time, duration, rating
3. **Distance Filter**: Filter by route distance
4. **Duration Filter**: Filter by estimated travel duration
5. **Rating Filter**: Filter by operator rating
6. **Date Range**: Support searching across multiple dates
7. **Caching**: Implement Redis caching for frequently searched routes
8. **Search History**: Track and suggest popular searches
