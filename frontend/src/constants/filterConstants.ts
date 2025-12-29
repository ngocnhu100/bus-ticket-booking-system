export const amenities = [
  { id: 'wifi', label: 'WiFi' },
  { id: 'ac', label: 'Air Conditioning' },
  { id: 'usb', label: 'USB Port' },
  { id: 'toilet', label: 'Restroom' },
  { id: 'entertainment', label: 'Entertainment' },
  { id: 'blanket', label: 'Blanket' },
  { id: 'tv', label: 'TV' },
  { id: 'water', label: 'Drinking Water' },
  { id: 'reading_light', label: 'Reading Light' },
  { id: 'massage', label: 'Massage' },
  { id: 'pillow', label: 'Pillow' },
]

// Additional time slots format for user components
export const timeSlots = [
  {
    id: 'morning',
    value: 'morning',
    label: 'Morning (06:00 - 12:00)',
    time: '06:00 - 12:00',
  },
  {
    id: 'afternoon',
    value: 'afternoon',
    label: 'Afternoon (12:00 - 18:00)',
    time: '12:00 - 18:00',
  },
  {
    id: 'evening',
    value: 'evening',
    label: 'Evening (18:00 - 24:00)',
    time: '18:00 - 24:00',
  },
  {
    id: 'night',
    value: 'night',
    label: 'Night (00:00 - 06:00)',
    time: '00:00 - 06:00',
  },
]

// Additional bus types format for user components
export const busTypes = [
  {
    id: 'standard',
    value: 'standard',
    label: 'Standard',
    description: 'Regular seating',
  },
  {
    id: 'limousine',
    value: 'limousine',
    label: 'Limousine',
    description: 'Luxury seating',
  },
  {
    id: 'sleeper',
    value: 'sleeper',
    label: 'Sleeper',
    description: 'Bed-style seating',
  },
]

export const seatTypes = [
  { id: 'standard', label: 'Standard Seat' },
  { id: 'vip', label: 'VIP Seat' },
]

export const seatLocations = [
  { id: 'window', label: 'Window Side' },
  { id: 'aisle', label: 'Aisle Side' },
]
