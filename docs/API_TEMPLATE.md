# API Documentation Template

Template chuẩn cho việc viết tài liệu API trong Bus Ticket Booking System. Mỗi service nên tạo tài liệu API riêng theo template này.

---

## Table of Contents

1. [API Overview](#api-overview)
2. [Base URL](#base-url)
3. [Authentication](#authentication)
4. [Common Response Format](#common-response-format)
5. [Error Codes](#error-codes)
6. [API Endpoints](#api-endpoints)

---

## API Overview

**Service Name**: [Tên service, ví dụ: Trip Service]  
**Version**: 1.0.0  
**Description**: [Mô tả ngắn gọn về service và chức năng chính]

**Maintainer**: [Tên team hoặc người maintain]  
**Last Updated**: [Ngày cập nhật]

---

## Base URL

### Development

```
http://localhost:3000/[service-prefix]
```

### Production

```
https://api.quad-n.me/[service-prefix]
```

**Example**:

- Trip Service: `http://localhost:3005` (Direct) or `http://localhost:3000/trips` (via Gateway)
- Auth Service: `http://localhost:3000/auth` (via Gateway)

---

## Authentication

### Yêu cầu xác thực

Các endpoint yêu cầu authentication cần gửi kèm JWT token trong header:

```http
Authorization: Bearer <access_token>
```

### Lấy Access Token

Access token có thể lấy thông qua:

1. Login endpoint: `POST /auth/login`
2. Register endpoint: `POST /auth/register`
3. Refresh endpoint: `POST /auth/refresh`

### Token Expiration

- **Access Token**: 15 phút
- **Refresh Token**: 7 ngày

---

## Common Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    // Response data here
  },
  "message": "Operation completed successfully",
  "timestamp": "2025-12-01T10:30:00.000Z"
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {} // Optional additional error details
  },
  "timestamp": "2025-12-01T10:30:00.000Z"
}
```

### Paginated Response

```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "currentPage": 1,
      "pageSize": 10,
      "totalPages": 5,
      "totalItems": 50,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  },
  "timestamp": "2025-12-01T10:30:00.000Z"
}
```

---

## Error Codes

| Code                  | HTTP Status | Description                              | Solution                 |
| --------------------- | ----------- | ---------------------------------------- | ------------------------ |
| `VALIDATION_ERROR`    | 400         | Input validation failed                  | Check request parameters |
| `UNAUTHORIZED`        | 401         | Authentication required or invalid token | Login or refresh token   |
| `FORBIDDEN`           | 403         | Insufficient permissions                 | Check user role          |
| `NOT_FOUND`           | 404         | Resource not found                       | Verify resource ID       |
| `CONFLICT`            | 409         | Resource conflict (e.g., duplicate)      | Use different values     |
| `INTERNAL_ERROR`      | 500         | Server error                             | Contact support team     |
| `SERVICE_UNAVAILABLE` | 503         | Service temporarily unavailable          | Retry later              |

---

## API Endpoints

### Template cho mỗi endpoint:

---

## [Endpoint Title]

### Description

[Mô tả chi tiết về chức năng của endpoint]

### HTTP Method & Endpoint

```
[METHOD] /path/to/endpoint
```

### Authentication

- [ ] Required
- [x] Not Required

**Required Roles**: `[passenger, admin]` hoặc `Public`

### Request Headers

| Header          | Type   | Required | Description      |
| --------------- | ------ | -------- | ---------------- |
| `Authorization` | string | Yes      | Bearer token     |
| `Content-Type`  | string | Yes      | application/json |

### Path Parameters

| Parameter | Type    | Required | Description         |
| --------- | ------- | -------- | ------------------- |
| `id`      | integer | Yes      | Resource identifier |

### Query Parameters

| Parameter | Type    | Required | Default | Description           |
| --------- | ------- | -------- | ------- | --------------------- |
| `page`    | integer | No       | 1       | Page number           |
| `limit`   | integer | No       | 10      | Items per page        |
| `sortBy`  | string  | No       | id      | Sort field            |
| `order`   | string  | No       | asc     | Sort order (asc/desc) |

### Request Body

```json
{
  "field1": "string",
  "field2": 123,
  "field3": true
}
```

**Field Descriptions**:

| Field    | Type    | Required | Validation    | Description           |
| -------- | ------- | -------- | ------------- | --------------------- |
| `field1` | string  | Yes      | max 255 chars | Description of field1 |
| `field2` | integer | Yes      | min 1         | Description of field2 |
| `field3` | boolean | No       | -             | Description of field3 |

### Response

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Example",
    "createdAt": "2025-12-01T10:30:00.000Z"
  },
  "message": "Resource retrieved successfully",
  "timestamp": "2025-12-01T10:30:00.000Z"
}
```

#### Error Response (400 Bad Request)

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input parameters",
    "details": {
      "field1": "Field1 is required"
    }
  },
  "timestamp": "2025-12-01T10:30:00.000Z"
}
```

#### Error Response (401 Unauthorized)

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  },
  "timestamp": "2025-12-01T10:30:00.000Z"
}
```

### Example Requests

#### cURL

```bash
curl -X POST http://localhost:3000/api/endpoint \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field1": "value1",
    "field2": 123
  }'
```

#### JavaScript (Fetch)

```javascript
const response = await fetch("http://localhost:3000/api/endpoint", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    field1: "value1",
    field2: 123,
  }),
});

const data = await response.json();
console.log(data);
```

#### JavaScript (Axios)

```javascript
const axios = require("axios");

try {
  const response = await axios.post(
    "http://localhost:3000/api/endpoint",
    {
      field1: "value1",
      field2: 123,
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    },
  );
  console.log(response.data);
} catch (error) {
  console.error(error.response.data);
}
```

### Notes

- [Các lưu ý quan trọng về endpoint này]
- [Performance considerations]
- [Rate limiting information]

---

# Ví dụ thực tế: Trip Search API

Dưới đây là ví dụ áp dụng template cho endpoint tìm kiếm chuyến xe.

---

## Search Trips

### Description

Tìm kiếm chuyến xe với các bộ lọc nâng cao. Hỗ trợ lọc theo origin, destination, bus type, departure time, price range, amenities và số lượng ghế trống. Kết quả có thể được sắp xếp và phân trang.

### HTTP Method & Endpoint

```
GET /trips/search
```

### Authentication

- [x] Not Required (Public endpoint)

### Request Headers

| Header         | Type   | Required | Description      |
| -------------- | ------ | -------- | ---------------- |
| `Content-Type` | string | No       | application/json |

### Query Parameters

| Parameter       | Type         | Required | Default | Description                                         |
| --------------- | ------------ | -------- | ------- | --------------------------------------------------- |
| `origin`        | string       | No       | -       | Origin location (e.g., "Ho Chi Minh City")          |
| `destination`   | string       | No       | -       | Destination location (e.g., "Hanoi")                |
| `busType`       | string/array | No       | -       | Bus types: standard, limousine, sleeper             |
| `departureTime` | string/array | No       | -       | Time periods: morning, afternoon, evening, night    |
| `minPrice`      | number       | No       | 0       | Minimum price filter (VND)                          |
| `maxPrice`      | number       | No       | -       | Maximum price filter (VND)                          |
| `operatorId`    | string       | No       | -       | Filter by bus operator ID                           |
| `amenities`     | string/array | No       | -       | Required amenities: wifi, ac, toilet, entertainment |
| `passengers`    | number       | No       | 1       | Minimum available seats required                    |
| `sortBy`        | string       | No       | time    | Sort field: price, time, duration                   |
| `order`         | string       | No       | asc     | Sort order: asc, desc                               |
| `page`          | number       | No       | 1       | Page number (min: 1)                                |
| `limit`         | number       | No       | 10      | Items per page (min: 1, max: 100)                   |

### Response

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "trips": [
      {
        "trip_id": "TRP001",
        "operator_name": "Phuong Trang",
        "bus_type": "limousine",
        "origin": "Ho Chi Minh City",
        "destination": "Hanoi",
        "departure_time": "08:00",
        "arrival_time": "22:00",
        "duration": "14h",
        "price": 450000,
        "currency": "VND",
        "available_seats": 15,
        "total_seats": 20,
        "amenities": ["wifi", "ac", "entertainment"],
        "rating": 4.5,
        "reviews_count": 120
      }
    ],
    "pagination": {
      "currentPage": 1,
      "pageSize": 10,
      "totalPages": 3,
      "totalItems": 28,
      "hasNextPage": true,
      "hasPreviousPage": false
    },
    "filters": {
      "origin": "Ho Chi Minh City",
      "destination": "Hanoi",
      "busType": ["limousine", "sleeper"],
      "sortBy": "price",
      "order": "asc"
    }
  },
  "timestamp": "2025-12-01T10:30:00.000Z"
}
```

#### Error Response (400 Bad Request)

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid query parameters",
    "details": {
      "page": "Page must be a positive integer",
      "busType": "Invalid bus type. Allowed values: standard, limousine, sleeper"
    }
  },
  "timestamp": "2025-12-01T10:30:00.000Z"
}
```

#### Error Response (500 Internal Server Error)

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An error occurred while searching trips"
  },
  "timestamp": "2025-12-01T10:30:00.000Z"
}
```

### Example Requests

#### cURL - Basic Search

```bash
curl -X GET "http://localhost:3000/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&page=1&limit=10"
```

#### cURL - Advanced Search with Multiple Filters

```bash
curl -X GET "http://localhost:3000/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&busType=limousine&busType=sleeper&departureTime=morning&minPrice=300000&maxPrice=600000&amenities=wifi&amenities=ac&passengers=2&sortBy=price&order=asc&page=1&limit=20"
```

#### JavaScript (Fetch)

```javascript
const searchTrips = async () => {
  const params = new URLSearchParams({
    origin: "Ho Chi Minh City",
    destination: "Hanoi",
    busType: "limousine",
    sortBy: "price",
    order: "asc",
    page: 1,
    limit: 10,
  });

  const response = await fetch(`http://localhost:3000/trips/search?${params}`);
  const data = await response.json();

  if (data.success) {
    console.log("Trips found:", data.data.trips);
    console.log("Total pages:", data.data.pagination.totalPages);
  } else {
    console.error("Error:", data.error.message);
  }
};

searchTrips();
```

#### JavaScript (Axios)

```javascript
const axios = require("axios");

const searchTrips = async () => {
  try {
    const response = await axios.get("http://localhost:3000/trips/search", {
      params: {
        origin: "Ho Chi Minh City",
        destination: "Hanoi",
        busType: ["limousine", "sleeper"],
        departureTime: ["morning", "afternoon"],
        minPrice: 300000,
        maxPrice: 600000,
        amenities: ["wifi", "ac"],
        passengers: 2,
        sortBy: "price",
        order: "asc",
        page: 1,
        limit: 20,
      },
    });

    console.log("Search results:", response.data);
    console.log("Total trips:", response.data.data.pagination.totalItems);
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
  }
};

searchTrips();
```

#### React Example with TanStack Query

```javascript
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const useTripSearch = (filters) => {
  return useQuery({
    queryKey: ["trips", "search", filters],
    queryFn: async () => {
      const { data } = await axios.get("http://localhost:3000/trips/search", {
        params: filters,
      });
      return data;
    },
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Usage in component
const TripSearchPage = () => {
  const [filters, setFilters] = useState({
    origin: "Ho Chi Minh City",
    destination: "Hanoi",
    page: 1,
    limit: 10,
  });

  const { data, isLoading, error } = useTripSearch(filters);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data.data.trips.map((trip) => (
        <TripCard key={trip.trip_id} trip={trip} />
      ))}
      <Pagination
        currentPage={data.data.pagination.currentPage}
        totalPages={data.data.pagination.totalPages}
        onPageChange={(page) => setFilters({ ...filters, page })}
      />
    </div>
  );
};
```

### Notes

- **Caching**: Response được cache trong Redis với TTL 5 phút để tăng performance
- **Performance**: Query được optimize với database indexes trên các column thường dùng (origin, destination, departure_time, price)
- **Multiple Values**: Các parameters như `busType`, `departureTime`, `amenities` có thể nhận multiple values bằng cách repeat parameter name
- **Sorting**: Default sorting là theo departure_time ascending
- **Pagination**: Maximum limit là 100 items per page
- **Case Sensitivity**: Origin và destination searches là case-insensitive và support partial matching
- **Empty Results**: Nếu không tìm thấy trips, response sẽ trả về empty array với pagination info

---

## Rate Limiting

| Endpoint         | Rate Limit   | Window   |
| ---------------- | ------------ | -------- |
| `/trips/search`  | 100 requests | 1 minute |
| `/auth/login`    | 5 requests   | 1 minute |
| `/auth/register` | 3 requests   | 1 minute |

Khi vượt quá rate limit, API sẽ trả về:

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "retryAfter": 60
  },
  "timestamp": "2025-12-01T10:30:00.000Z"
}
```

---

## Versioning

API hiện tại sử dụng version 1.0.0. Trong tương lai, versioning sẽ được implement thông qua URL path:

```
/v1/trips/search
/v2/trips/search
```

---

## Support

Để báo cáo bugs hoặc đề xuất features:

- Tạo issue trong repository
- Contact development team
- Email: dev@busticket.com

---

**Last Updated**: December 1, 2025  
**Maintained by**: Backend Development Team
