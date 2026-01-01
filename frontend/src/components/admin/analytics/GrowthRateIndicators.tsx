import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react'
import type {
  RevenueAnalyticsResponse,
  RevenueBreakdown,
} from '@/api/revenueAnalytics'
import { formatCurrency } from '@/api/revenueAnalytics'

interface GrowthRateIndicatorsProps {
  data: RevenueAnalyticsResponse
}

function parsePeriod(period: string): Date {
  // Parse period string to Date - handle different formats
  if (period.includes('W')) {
    // Week format: "YYYY-WNN" -> parse as first day of that week
    const match = period.match(/(\d{4})-W(\d{2})/)
    if (match) {
      const year = parseInt(match[1])
      const week = parseInt(match[2])
      // Calculate first day of the week (approximation)
      const firstDay = new Date(year, 0, 1 + (week - 1) * 7)
      return firstDay
    }
  } else if (period.match(/^\d{4}-\d{2}$/)) {
    // Month format: "YYYY-MM" -> parse as first day of month
    return new Date(period + '-01')
  }
  // Day format: "YYYY-MM-DD" or full ISO string
  return new Date(period)
}

function sumRange(breakdown: RevenueBreakdown[], start: Date, end: Date) {
  if (!breakdown || !Array.isArray(breakdown)) return 0

  const startT = start.setHours(0, 0, 0, 0)
  const endT = end.setHours(23, 59, 59, 999)
  return breakdown.reduce((acc, item) => {
    const d = parsePeriod(item.period).getTime()
    if (d >= startT && d <= endT) return acc + item.revenue
    return acc
  }, 0)
}

function pctChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100
  return ((current - previous) / Math.abs(previous)) * 100
}

export function GrowthRateIndicators({ data }: GrowthRateIndicatorsProps) {
  const breakdown = data?.data?.trends
  const currency = data?.data?.summary?.currency || 'VND'

  // Check if we have breakdown data
  if (!breakdown || !Array.isArray(breakdown) || breakdown.length === 0) {
    return (
      <Card className="border-border/50">
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">No revenue data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Use the actual current date for "Today" calculations, not the period end
  const actualToday = new Date()
  const today = new Date(
    Date.UTC(
      actualToday.getFullYear(),
      actualToday.getMonth(),
      actualToday.getDate()
    )
  )
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  // Week: last 7 days (including today)
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - 6)
  const prevWeekStart = new Date(weekStart)
  prevWeekStart.setDate(weekStart.getDate() - 7)
  const prevWeekEnd = new Date(weekStart)
  prevWeekEnd.setDate(weekStart.getDate() - 1)

  // Month: calendar month
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const prevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  const prevMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)

  // Year: calendar year
  const yearStart = new Date(today.getFullYear(), 0, 1)
  const prevYearStart = new Date(today.getFullYear() - 1, 0, 1)
  const prevYearEnd = new Date(today.getFullYear() - 1, 11, 31)

  // Always use the most recent day's data available
  let actualTodaySum = 0
  let actualYesterdaySum = 0
  let todayLabel = 'Today'

  if (breakdown && breakdown.length > 0) {
    console.log('Raw breakdown data:', breakdown)
    // Find the most recent date with data
    const sortedBreakdown = [...breakdown].sort(
      (a, b) =>
        parsePeriod(b.period).getTime() - parsePeriod(a.period).getTime()
    )
    const mostRecent = sortedBreakdown[0]
    if (mostRecent) {
      const mostRecentDate = parsePeriod(mostRecent.period)
      const mostRecentDateOnly = new Date(
        Date.UTC(
          mostRecentDate.getUTCFullYear(),
          mostRecentDate.getUTCMonth(),
          mostRecentDate.getUTCDate()
        )
      )

      actualTodaySum = mostRecent.revenue

      // Find the day before the most recent for comparison
      const dayBefore = new Date(mostRecentDate)
      dayBefore.setDate(dayBefore.getDate() - 1)
      actualYesterdaySum = sumRange(breakdown, dayBefore, dayBefore)

      if (mostRecentDateOnly.getTime() === today.getTime()) {
        todayLabel = 'Today'
      } else {
        // Handle different period formats
        const period = mostRecent.period
        if (period.includes('W')) {
          // Week format: show date range
          const match = period.match(/(\d{4})-W(\d{2})/)
          if (match) {
            const year = parseInt(match[1])
            const week = parseInt(match[2])
            const firstDay = new Date(year, 0, 1 + (week - 1) * 7)
            const lastDay = new Date(firstDay)
            lastDay.setDate(firstDay.getDate() + 6)
            todayLabel = `${firstDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${lastDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
          }
        } else if (period.match(/^\d{4}-\d{2}$/)) {
          // Month format: show month and year
          todayLabel = mostRecentDate.toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
          })
        } else {
          // Day format
          todayLabel = mostRecentDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })
        }
      }
    }
  }

  const weekSum = sumRange(breakdown, weekStart, today)
  const prevWeekSum = sumRange(breakdown, prevWeekStart, prevWeekEnd)

  const monthSum = sumRange(breakdown, monthStart, today)
  const prevMonthSum = sumRange(breakdown, prevMonth, prevMonthEnd)

  const yearSum = sumRange(breakdown, yearStart, today)
  const prevYearSum = sumRange(breakdown, prevYearStart, prevYearEnd)

  const metrics = [
    {
      label: todayLabel,
      current: actualTodaySum,
      previous: actualYesterdaySum,
      compareLabel:
        todayLabel === 'Today'
          ? 'Compared to yesterday'
          : 'Compared to previous day',
    },
    {
      label: 'This Week',
      current: weekSum,
      previous: prevWeekSum,
      compareLabel: 'Compared to last week',
    },
    {
      label: 'This Month',
      current: monthSum,
      previous: prevMonthSum,
      compareLabel: 'Compared to last month',
    },
    {
      label: 'This Year',
      current: yearSum,
      previous: prevYearSum,
      compareLabel: 'Compared to last year',
    },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Revenue Growth Rate
        </h2>
        <p className="text-sm text-muted-foreground">
          Track your revenue performance across different time periods
        </p>
      </div>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m, i) => {
          const change = pctChange(m.current, m.previous)
          const positive = change >= 0
          const absPct = Math.abs(change).toFixed(1)

          return (
            <Card
              key={i}
              className="border border-border/40 hover:shadow-md hover:scale-[1.02] transition-all duration-200"
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {m.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-2xl lg:text-3xl font-bold">
                      {formatCurrency(m.current, currency)}
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${
                          positive
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30'
                        }`}
                      >
                        {positive ? (
                          <ArrowUpIcon className="h-3 w-3" />
                        ) : (
                          <ArrowDownIcon className="h-3 w-3" />
                        )}
                        {absPct}%
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {m.compareLabel}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
