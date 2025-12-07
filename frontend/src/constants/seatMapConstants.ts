/**
 * Seat Map Constants
 *
 * Centralized constants for seat-related configuration and metadata.
 * Ensures consistency across components while maintaining single source of truth.
 */

/**
 * Seat Availability Definitions
 * Defines seat availability status based on status string
 */
export const SEAT_AVAILABILITY = {
  AVAILABLE: 'available',
  OCCUPIED: 'occupied',
  LOCKED: 'locked',
} as const

export type SeatAvailability =
  (typeof SEAT_AVAILABILITY)[keyof typeof SEAT_AVAILABILITY]

/**
 * Seat Type Definitions
 * Categorizes seats by type and amenities
 */
export const SEAT_TYPE = {
  STANDARD: 'standard',
  VIP: 'vip',
} as const

export type SeatType = (typeof SEAT_TYPE)[keyof typeof SEAT_TYPE]

/**
 * Seat Position Definitions
 * Indicates physical position in the bus
 */
export const SEAT_POSITION = {
  WINDOW: 'window',
  AISLE: 'aisle',
} as const

export type SeatPosition = (typeof SEAT_POSITION)[keyof typeof SEAT_POSITION]

/**
 * Seat Availability Labels
 * Human-readable labels for availability states
 */
export const SEAT_AVAILABILITY_LABELS: Record<SeatAvailability, string> = {
  [SEAT_AVAILABILITY.AVAILABLE]: 'Available',
  [SEAT_AVAILABILITY.OCCUPIED]: 'Occupied',
  [SEAT_AVAILABILITY.LOCKED]: 'Locked',
}

/**
 * Seat Type Labels
 * Human-readable labels for each type
 */
export const SEAT_TYPE_LABELS: Record<SeatType, string> = {
  [SEAT_TYPE.STANDARD]: 'Standard Seat',
  [SEAT_TYPE.VIP]: 'VIP Seat',
}

/**
 * Seat Type Descriptions
 * Detailed descriptions for UI display
 */
export const SEAT_TYPE_DESCRIPTIONS: Record<SeatType, string> = {
  [SEAT_TYPE.STANDARD]: 'Regular seat for economy travel',
  [SEAT_TYPE.VIP]: 'Premium seat with extra comfort and amenities',
}

/**
 * Seat Position Descriptions
 * Descriptions for window/aisle positions
 */
export const SEAT_POSITION_DESCRIPTIONS: Record<'window' | 'aisle', string> = {
  window: 'Seat next to the window with a view',
  aisle: 'Seat next to the aisle for easy access',
}

/**
 * Common Bus Layouts
 * Standard bus configurations
 */
export const BUS_LAYOUTS = {
  COMPACT_2x2: {
    layout: '2-2',
    description: 'Compact (2 columns, 2 seats per row)',
  },
  STANDARD_2x3: {
    layout: '2-3',
    description: 'Standard (2 sections, 3 seats per row)',
  },
  WIDE_2x4: {
    layout: '2-4',
    description: 'Wide (2 sections, 4 seats per row)',
  },
  LUXURY_1x2: { layout: '1-2', description: 'Luxury (1-2 configuration)' },
} as const

/**
 * Default SeatMap Configuration
 * Reasonable defaults for seat map behavior
 */
export const DEFAULT_SEAT_MAP_CONFIG = {
  MAX_SELECTABLE_SEATS: 10,
  SEAT_SIZE_DESKTOP: 44,
  SEAT_SIZE_TABLET: 40,
  SEAT_SIZE_MOBILE: 36,
  SEAT_GAP_DESKTOP: 12,
  SEAT_GAP_TABLET: 10,
  SEAT_GAP_MOBILE: 8,
  ROW_GAP_DESKTOP: 16,
  ROW_GAP_TABLET: 12,
  ROW_GAP_MOBILE: 10,
  ANIMATION_DURATION_MS: 200,
} as const

/**
 * Seat Priority Rules
 * Rules for suggesting or filtering seats
 */
export const SEAT_PRIORITY = {
  // Priority order for recommendations (by position)
  WINDOW_FIRST: ['window', 'aisle'],
  AISLE_FIRST: ['aisle', 'window'],
  // Priority by type
  VIP_FIRST: ['vip', 'standard'],
  STANDARD_FIRST: ['standard', 'vip'],
} as const

/**
 * Price Tiers
 * Default price multipliers by seat type
 */
export const SEAT_PRICE_MULTIPLIER: Record<SeatType, number> = {
  [SEAT_TYPE.STANDARD]: 1.0,
  [SEAT_TYPE.VIP]: 1.5,
}

/**
 * Accessibility Configuration
 */
export const ACCESSIBILITY_CONFIG = {
  FOCUS_OUTLINE_WIDTH: '2px',
  FOCUS_OUTLINE_OFFSET: '2px',
  MIN_TAP_TARGET_SIZE: 44, // pixels (mobile)
  HIGH_CONTRAST_MODE: false,
} as const

/**
 * Analytics Events for Seat Selection
 * Track user interactions for analytics
 */
export const SEAT_ANALYTICS_EVENTS = {
  SEAT_VIEWED: 'seat_map_viewed',
  SEAT_SELECTED: 'seat_selected',
  SEAT_DESELECTED: 'seat_deselected',
  MAX_SEATS_REACHED: 'max_seats_reached',
  SEAT_MAP_COMPLETED: 'seat_map_completed',
} as const

/**
 * Helper function to get CSS class for seat availability
 */
export function getSeatAvailabilityClass(isActive: boolean): string {
  return isActive ? 'seat-available' : 'seat-unavailable'
}

/**
 * Helper function to get CSS class for seat type
 */
export function getSeatTypeClass(type: SeatType): string {
  return `seat-${type}`
}

/**
 * Helper function to generate seat code from row/column
 */
export function generateSeatCode(row: number, column: number): string {
  const rowLabel = String.fromCharCode(65 + row) // A, B, C, etc.
  const colNumber = column + 1
  return `${rowLabel}${colNumber}`
}

/**
 * Helper function to check if seat is bookable
 */
export function isSeatBookable(isActive: boolean): boolean {
  return isActive === true
}

/**
 * Helper function to check if seat is premium
 */
export function isPremiumSeat(type: SeatType): boolean {
  return type === SEAT_TYPE.VIP
}
