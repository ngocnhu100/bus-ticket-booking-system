export interface RevenuePeriod {
  from: string
  to: string
}

export interface RevenueSummary {
  totalRevenue: number
  totalBookings: number
  averageBookingValue: number
  currency: string
}

export interface RevenueBreakdown {
  period: string
  revenue: number
  bookings: number
  averageBookingValue: number
}

export interface TopRoute {
  routeId: string
  route: string
  origin: string
  destination: string
  revenue: number
  bookings: number
  averagePrice: number
}

export interface RevenueByStatus {
  status: string
  revenue: number
  bookings: number
  averageValue: number
}

export interface TopOperator {
  operatorId: string
  operatorName: string
  revenue: number
  bookings: number
  uniqueTrips: number
}

export interface Operator {
  operatorId: string
  name: string
  contactEmail: string
  contactPhone: string
  status: string
  totalRoutes: number
  totalBuses: number
  rating: number
  approvedAt: string
  createdAt: string
}

export interface OperatorsResponse {
  success: boolean
  data: Operator[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface RevenueAnalyticsResponse {
  success: boolean
  data: {
    period: RevenuePeriod
    summary: RevenueSummary
    trends: RevenueBreakdown[]
    byRoute: TopRoute[]
    byStatus: RevenueByStatus[]
    byOperator: TopOperator[]
  }
}

interface FetchRevenueAnalyticsParams {
  fromDate: string
  toDate: string
  groupBy?: 'day' | 'week' | 'month'
  operatorId?: string
}

import { request } from './auth'

export async function fetchRevenueAnalytics(
  params: FetchRevenueAnalyticsParams
): Promise<RevenueAnalyticsResponse> {
  const queryParams = new URLSearchParams({
    fromDate: params.fromDate,
    toDate: params.toDate,
    ...(params.groupBy && { groupBy: params.groupBy }),
    ...(params.operatorId && { operatorId: params.operatorId }),
  })

  const response = await request(
    `/analytics/revenue?${queryParams.toString()}`,
    {
      method: 'GET',
    }
  )

  return response
}

// Helper function to fetch operators for filtering
export async function fetchOperators(
  status?: 'pending' | 'approved' | 'rejected' | 'suspended'
): Promise<OperatorsResponse> {
  const queryParams = new URLSearchParams()
  if (status) {
    queryParams.append('status', status)
  }
  queryParams.append('limit', '100') // Fetch more operators for the filter

  const response = await request(
    `/trips/admin/operators?${queryParams.toString()}`,
    {
      method: 'GET',
    }
  )

  return response
}

// Helper function to format currency
export function formatCurrency(
  value: number,
  currency: string = 'VND'
): string {
  if (currency === 'VND') {
    // Abbreviate large numbers to keep display compact
    if (value >= 1000000000) {
      // 1B+
      return `${(value / 1000000000).toFixed(1)}B ₫`
    } else if (value >= 1000000) {
      // 1M+
      return `${(value / 1000000).toFixed(1)}M ₫`
    } else if (value >= 1000) {
      // 1K+
      return `${(value / 1000).toFixed(1)}K ₫`
    } else {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
      }).format(value)
    }
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 2,
  }).format(value)
}

// Helper function to get date range based on string
export function getDateRangeFromString(
  range: 'week' | 'month' | 'quarter' | 'year'
): { from: string; to: string } {
  const today = new Date()
  const from = new Date()

  switch (range) {
    case 'week':
      from.setDate(today.getDate() - 7)
      break
    case 'month':
      from.setDate(today.getDate() - 30)
      break
    case 'quarter':
      from.setMonth(today.getMonth() - 3)
      break
    case 'year':
      from.setFullYear(today.getFullYear() - 1)
      break
  }

  // Create date objects at the start of the day in UTC
  const fromDate = new Date(
    Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())
  )
  // Backend query already adds 1 day with "created_at < (toDate + 1 day)"
  // So we should NOT add 1 here - just use today's date
  const toDate = new Date(
    Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  )

  return {
    from: fromDate.toISOString().split('T')[0],
    to: toDate.toISOString().split('T')[0],
  }
}
