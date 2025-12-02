# Advanced Filtering Implementation for Bus Ticket Booking System

## Overview

This implementation adds comprehensive advanced filtering functionality to the Bus Ticket Booking System, allowing users to search and filter trips by multiple criteria including departure time, price range, bus type, and amenities.

## Features Implemented

### 1. **Trip Search API Module** (`frontend/src/api/trips.ts`)

- Complete TypeScript interfaces for Trip data structure
- `searchTrips()` function that accepts multiple filter parameters
- Supports the following query parameters:
  - `origin`, `destination`, `date` (required)
  - `passengers` (optional, default 1)
  - `busType` (optional, array: standard|limousine|sleeper)
  - `departureTime` (optional, array: morning|afternoon|evening|night)
  - `minPrice`, `maxPrice` (optional)
  - `operatorId` (optional)
  - `amenities` (optional, array)
  - `page`, `limit` (optional, for pagination)

### 2. **Filter Components**

#### **DepartureTimeFilter** (`frontend/src/components/users/DepartureTimeFilter.tsx`)

- Checkbox-based filter for time slots
- Options: Morning (06:00-12:00), Afternoon (12:00-18:00), Evening (18:00-24:00), Night (00:00-06:00)
- Multi-select enabled

#### **BusTypeFilter** (`frontend/src/components/users/BusTypeFilter.tsx`)

- Checkbox-based filter for bus types
- Options: Standard, Limousine, Sleeper
- Includes descriptions for each type

#### **PriceRangeFilter** (`frontend/src/components/users/PriceRangeFilter.tsx`)

- Dual-range slider for price selection
- Numeric input fields for precise price entry
- Formatted currency display (VND)
- Default range: 0 - 1,000,000 VND
- **Debounced**: Changes are debounced by 500ms to prevent excessive API calls

#### **AmenitiesFilter** (`frontend/src/components/users/AmenitiesFilter.tsx`)

- Checkbox-based filter for bus amenities
- Options: WiFi, Air Conditioning, Toilet, Entertainment
- Icons for visual clarity

### 3. **UI Components**

#### **Checkbox** (`frontend/src/components/ui/checkbox.tsx`)

- Radix UI-based checkbox component
- Accessible and keyboard-navigable
- Styled with Tailwind CSS

#### **Slider** (`frontend/src/components/ui/slider.tsx`)

- Radix UI-based dual-range slider
- Supports two thumbs for min/max selection
- Accessible and touch-friendly

### 4. **Trip Result Display**

#### **TripResultCard** (`frontend/src/components/users/TripResultCard.tsx`)

- Displays comprehensive trip information:
  - Operator name and logo
  - Departure/arrival times and duration
  - Route and distance
  - Bus type and seat availability
  - Price with currency formatting
  - Amenities with icons
- Color-coded seat availability (green > 10, yellow 5-10, red < 5)
- "Select Seats" button with disabled state for sold-out trips

### 5. **Main Trip Search Page** (`frontend/src/pages/users/TripSearch.tsx`)

#### **Layout**

- Left sidebar: Sticky filter panel (responsive on mobile)
- Right content area: Search results with pagination
- Header: Search summary with route, date, and passenger count

#### **Features**

- **Dynamic Filtering**: Results update automatically when filters change
- **Debouncing**: Price range changes debounced by 500ms
- **Loading States**: Skeleton loaders while fetching data
- **Empty States**: Helpful message when no results found
- **Reset Filters**: Quick button to clear all active filters
- **Pagination**: Navigate through multiple pages of results
- **Error Handling**: User-friendly error messages via toast notifications

#### **State Management**

- URL query parameters for search criteria (origin, destination, date, passengers)
- Local state for all filter options
- `useCallback` hook for optimized API calls
- `useEffect` for automatic re-fetching when filters change

### 6. **Trip Search Form** (`frontend/src/components/users/TripSearchForm.tsx`)

- Clean, user-friendly form for initiating trip searches
- Fields: Origin, Destination, Date, Passengers
- Date picker with validation (min: today)
- Form validation before submission
- Navigates to search results with query parameters

### 7. **Dashboard Integration** (`frontend/src/pages/users/Dashboard.tsx`)

- Search form prominently displayed at top
- Upcoming trips section below
- Seamless navigation to trip search page

### 8. **Routing** (`frontend/src/App.tsx`)

- New route: `/trips/search` (protected, passenger-only)
- Integrated with existing authentication flow

## Technical Implementation Details

### **API Integration**

```typescript
// Example API call with filters
const response = await searchTrips({
  origin: "Ho Chi Minh City",
  destination: "Hanoi",
  date: "2025-12-15",
  passengers: 2,
  departureTime: ["morning", "afternoon"],
  busType: ["limousine"],
  minPrice: 300000,
  maxPrice: 600000,
  amenities: ["wifi", "ac"],
  page: 1,
  limit: 10,
});
```

### **Debouncing Strategy**

- Price range changes trigger a 500ms debounce timer
- Prevents excessive API calls while user adjusts slider
- Uses separate `debouncedMinPrice` and `debouncedMaxPrice` state
- `useEffect` manages the debounce timeout

### **Filter State Management**

```typescript
const [departureTime, setDepartureTime] = useState<string[]>([]);
const [busType, setBusType] = useState<string[]>([]);
const [minPrice, setMinPrice] = useState<number>(0);
const [maxPrice, setMaxPrice] = useState<number>(1000000);
const [amenities, setAmenities] = useState<string[]>([]);
```

### **URL Parameter Handling**

- Search parameters read from URL on page load
- Enables sharing and bookmarking of search results
- Format: `/trips/search?origin=HCM&destination=Hanoi&date=2025-12-15&passengers=2`

## Dependencies Installed

- `@radix-ui/react-checkbox`: ^1.1.2
- `@radix-ui/react-slider`: ^1.2.1

## File Structure

```
frontend/
├── src/
│   ├── api/
│   │   └── trips.ts                          # Trip search API module
│   ├── components/
│   │   ├── ui/
│   │   │   ├── checkbox.tsx                  # Checkbox UI component
│   │   │   └── slider.tsx                    # Slider UI component
│   │   └── users/
│   │       ├── AmenitiesFilter.tsx           # Amenities filter
│   │       ├── BusTypeFilter.tsx             # Bus type filter
│   │       ├── DepartureTimeFilter.tsx       # Departure time filter
│   │       ├── PriceRangeFilter.tsx          # Price range filter
│   │       ├── TripResultCard.tsx            # Trip result card
│   │       └── TripSearchForm.tsx            # Trip search form
│   ├── pages/
│   │   └── users/
│   │       ├── Dashboard.tsx                 # Updated with search form
│   │       └── TripSearch.tsx                # Main trip search page
│   └── App.tsx                               # Updated with new route
```

## Usage

### **Starting a Search**

1. Navigate to Dashboard (`/dashboard`)
2. Fill in the trip search form (origin, destination, date, passengers)
3. Click "Search Trips"
4. Redirected to `/trips/search` with results

### **Applying Filters**

1. On the trip search page, use the left sidebar filters
2. Select departure times (multiple allowed)
3. Choose bus types (multiple allowed)
4. Adjust price range using slider or input fields
5. Select desired amenities (multiple allowed)
6. Results update automatically

### **Resetting Filters**

- Click "Reset" button in filter panel header
- All filters cleared, results refresh with original search parameters

### **Pagination**

- Use "Previous" and "Next" buttons at bottom of results
- Current page indicator shows progress

## Backend API Expected Format

The frontend expects the backend `/trips/search` endpoint to return:

```typescript
{
  success: boolean
  data: {
    trips: Trip[]
    totalCount: number
    page: number
    limit: number
  }
  timestamp: string
}
```

Where each `Trip` object includes:

- `tripId`, `route`, `operator`, `bus`, `schedule`, `pricing`, `availability`

## Accessibility Features

- Keyboard navigation support for all filters
- Focus indicators on interactive elements
- ARIA labels and roles
- Screen reader friendly

## Responsive Design

- Mobile-first approach
- Filters collapse to vertical stack on small screens
- Touch-friendly controls
- Readable font sizes and spacing

## Future Enhancements

- Save favorite routes/searches
- Sort options (price, departure time, duration, rating)
- Advanced operator rating filter (as shown in design)
- Map view for routes
- Real-time seat availability updates via WebSocket
- Filter presets (e.g., "Cheapest", "Fastest", "Most Comfortable")

## Testing Recommendations

1. Test filter combinations (multiple filters active simultaneously)
2. Verify debouncing works (price slider shouldn't trigger excessive calls)
3. Test pagination with different result counts
4. Verify responsive behavior on mobile devices
5. Test with empty results
6. Test error handling (network failures, invalid parameters)
7. Verify URL parameters work correctly for sharing

## Notes

- All monetary values formatted in VND with proper locale formatting
- Date formatting uses locale-aware methods
- Error messages are user-friendly and actionable
- Loading states prevent user confusion during API calls
- Toast notifications provide feedback for all user actions
