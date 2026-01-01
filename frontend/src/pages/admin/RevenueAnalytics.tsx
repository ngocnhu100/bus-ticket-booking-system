import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/admin/DashboardLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Download, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  RevenueSummaryCards,
  RevenueTrendChart,
  RoutePerformanceChart,
  OperatorComparisonChart,
  BookingStatusTable,
  RevenueBreakdownTable,
  DateRangeFilter,
  GrowthRateIndicators,
  BookingSummaryCards,
  BookingStatusDistribution,
  TopRoutesList,
  CancellationStats,
  BookingTrendsChart,
} from '@/components/admin/analytics'
import type { RevenueAnalyticsResponse } from '@/api/revenueAnalytics'
import {
  fetchRevenueAnalytics,
  getDateRangeFromString,
  fetchOperators,
  type Operator,
} from '@/api/revenueAnalytics'
import type { BookingAnalyticsResponse } from '@/api/bookingAnalytics'
import { fetchBookingAnalytics } from '@/api/bookingAnalytics'
import { exportToPDF } from '@/utils/pdfExport'
import '@/styles/admin.css'

type DateRange = 'week' | 'month' | 'quarter' | 'year' | 'custom'

export default function RevenueAnalytics() {
  const [activeTab, setActiveTab] = useState<'revenue' | 'booking'>('revenue')
  const [dateRange, setDateRange] = useState<DateRange>('month')
  const [selectedOperator, setSelectedOperator] = useState<string>('all')
  const [selectedGroupBy, setSelectedGroupBy] = useState<
    'day' | 'week' | 'month'
  >('day')
  const [customDateRange, setCustomDateRange] = useState({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  })
  const [hasCustomDatesBeenSet, setHasCustomDatesBeenSet] = useState(false)
  const [data, setData] = useState<RevenueAnalyticsResponse | null>(null)
  const [bookingData, setBookingData] =
    useState<BookingAnalyticsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [operators, setOperators] = useState<Operator[]>([])
  const [operatorsLoading, setOperatorsLoading] = useState(true)
  const [dateError, setDateError] = useState<string | null>(null)

  // Auto-clear date error after 5 seconds
  useEffect(() => {
    if (dateError) {
      const timer = setTimeout(() => setDateError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [dateError])

  // Fetch data when filters change
  useEffect(() => {
    // Don't fetch if user just selected 'custom' but hasn't set dates yet
    if (dateRange === 'custom' && !hasCustomDatesBeenSet) {
      setLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        let fromDate: string
        let toDate: string

        if (dateRange === 'custom') {
          // Convert to UTC date strings to ensure consistent timezone handling
          console.log(
            'Today is considered:',
            new Date().toISOString().split('T')[0],
            'in UTC for custom range'
          )
          const fromDateUTC = new Date(
            Date.UTC(
              customDateRange.from.getFullYear(),
              customDateRange.from.getMonth(),
              customDateRange.from.getDate()
            )
          )
          // Backend query already adds 1 day with "created_at < (toDate + 1 day)"
          // So we should NOT add 1 here - just use the selected toDate
          const toDateUTC = new Date(
            Date.UTC(
              customDateRange.to.getFullYear(),
              customDateRange.to.getMonth(),
              customDateRange.to.getDate()
            )
          )

          fromDate = fromDateUTC.toISOString().split('T')[0]
          toDate = toDateUTC.toISOString().split('T')[0]
        } else {
          const range = getDateRangeFromString(dateRange)
          console.log(
            'Today is considered:',
            new Date().toISOString().split('T')[0],
            'in local timezone'
          )
          console.log('Date range:', {
            from: range.from,
            to: range.to,
            dateRange,
          })
          fromDate = range.from
          toDate = range.to
        }

        if (activeTab === 'revenue') {
          console.log('🔵 Fetching REVENUE analytics:', {
            fromDate,
            toDate,
            groupBy: selectedGroupBy,
          })
          const response = await fetchRevenueAnalytics({
            fromDate,
            toDate,
            groupBy: selectedGroupBy,
            operatorId:
              selectedOperator !== 'all' ? selectedOperator : undefined,
          })
          console.log('🔵 Revenue response:', {
            totalBookings: response.data.summary.totalBookings,
            totalRevenue: response.data.summary.totalRevenue,
          })
          setData(response)
          setBookingData(null)
        } else {
          console.log('🟢 Fetching BOOKING analytics:', {
            fromDate,
            toDate,
            groupBy: selectedGroupBy,
          })
          const response = await fetchBookingAnalytics({
            fromDate,
            toDate,
            groupBy: selectedGroupBy,
          })
          console.log('🟢 Booking response:', {
            totalBookings: response.data.summary.totalBookings,
            successRate: response.data.summary.successRate,
            cancellationRate: response.data.summary.cancellationRate,
          })
          setBookingData(response)
          setData(null)
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch analytics data'
        )
        console.error('Error fetching analytics:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [
    dateRange,
    selectedOperator,
    selectedGroupBy,
    hasCustomDatesBeenSet,
    customDateRange.from,
    customDateRange.to,
    activeTab,
  ])

  // Fetch operators for filter dropdown
  useEffect(() => {
    const fetchOperatorsData = async () => {
      try {
        setOperatorsLoading(true)
        const response = await fetchOperators('approved') // Only fetch approved operators
        setOperators(response.data)
      } catch (err) {
        console.error('Error fetching operators:', err)
        // Fallback to empty array, filter will show "All Operators" only
        setOperators([])
      } finally {
        setOperatorsLoading(false)
      }
    }

    fetchOperatorsData()
  }, [])

  const handleExportCSV = () => {
    if (!data && !bookingData) return

    const csvLines: string[] = []

    // Calculate the actual date range used
    let exportFromDate: string
    let exportToDate: string

    if (dateRange === 'custom') {
      exportFromDate = customDateRange.from.toISOString().split('T')[0]
      exportToDate = customDateRange.to.toISOString().split('T')[0]
    } else {
      const range = getDateRangeFromString(dateRange)
      exportFromDate = range.from
      exportToDate = range.to
    }

    // Add filter settings section
    csvLines.push('FILTERS')
    csvLines.push('setting,value')
    csvLines.push(`From Date,${exportFromDate}`)
    csvLines.push(`To Date,${exportToDate}`)
    csvLines.push(`Group By,${selectedGroupBy}`)
    if (activeTab === 'revenue') {
      csvLines.push(`Operator,${selectedOperator}`)
    }
    csvLines.push(
      `Analytics Type,${activeTab === 'revenue' ? 'Revenue' : 'Booking'}`
    )
    csvLines.push(`Export Date,${new Date().toISOString().split('T')[0]}`)
    csvLines.push('')

    if (activeTab === 'revenue' && data) {
      const { summary, trends, byRoute, byOperator, byStatus } = data.data

      // Add summary section (filtered totals)
      csvLines.push('SUMMARY')
      csvLines.push('metric,value')
      csvLines.push(`Total Revenue,${summary.totalRevenue}`)
      csvLines.push(`Total Bookings,${summary.totalBookings}`)
      csvLines.push(`Average Booking Value,${summary.averageBookingValue}`)
      csvLines.push(`Currency,${summary.currency}`)
      csvLines.push('')

      // Add revenue breakdown section (filtered data)
      csvLines.push('REVENUE_BREAKDOWN')
      csvLines.push('date,revenue,bookings,avg_price')
      trends.forEach((row) => {
        const avgPrice =
          row.bookings > 0 ? (row.revenue / row.bookings).toFixed(2) : '0.00'
        csvLines.push(
          `${row.period},${row.revenue},${row.bookings},${avgPrice}`
        )
      })
      csvLines.push('')

      // Add top routes section (filtered data)
      csvLines.push('TOP_ROUTES')
      csvLines.push('route,revenue,bookings,average_price')
      byRoute.forEach((route) => {
        csvLines.push(
          `${route.route},${route.revenue},${route.bookings},${route.averagePrice}`
        )
      })
      csvLines.push('')

      // Add top operators section (filtered data)
      csvLines.push('TOP_OPERATORS')
      csvLines.push('operator_id,name,revenue,bookings')
      byOperator.forEach((operator) => {
        csvLines.push(
          `${operator.operatorId || ''},${operator.operatorName},${operator.revenue},${operator.bookings}`
        )
      })
      csvLines.push('')

      // Add booking status breakdown section (filtered data)
      csvLines.push('BOOKING_STATUS_BREAKDOWN')
      csvLines.push('status,revenue,bookings,average_value')
      byStatus.forEach((status) => {
        csvLines.push(
          `${status.status},${status.revenue},${status.bookings},${status.averageValue}`
        )
      })
    } else if (activeTab === 'booking' && bookingData) {
      const {
        summary,
        trends,
        statusDistribution,
        topRoutes,
        cancellationStats,
      } = bookingData.data

      // Add summary section
      csvLines.push('SUMMARY')
      csvLines.push('metric,value')
      csvLines.push(`Total Bookings,${summary.totalBookings}`)
      csvLines.push(`Success Rate,${summary.successRate}%`)
      csvLines.push(`Cancellation Rate,${summary.cancellationRate}%`)
      csvLines.push(`Conversion Rate,${summary.conversionRate || 'N/A'}`)
      csvLines.push('')

      // Add booking trends section
      csvLines.push('BOOKING_TRENDS')
      csvLines.push('period,total_bookings,confirmed,cancelled,pending')
      trends.forEach((trend) => {
        csvLines.push(
          `${trend.period},${trend.totalBookings},${trend.confirmedBookings},${trend.cancelledBookings},${trend.pendingBookings}`
        )
      })
      csvLines.push('')

      // Add status distribution section
      csvLines.push('STATUS_DISTRIBUTION')
      csvLines.push('status,count,percentage')
      statusDistribution.forEach((status) => {
        csvLines.push(`${status.status},${status.count},${status.percentage}`)
      })
      csvLines.push('')

      // Add top routes section
      csvLines.push('TOP_ROUTES')
      csvLines.push(
        'route_id,route,origin,destination,total_bookings,revenue,unique_trips'
      )
      topRoutes.forEach((route) => {
        csvLines.push(
          `${route.routeId},"${route.route}",${route.origin},${route.destination},${route.totalBookings},${route.revenue},${route.uniqueTrips}`
        )
      })
      csvLines.push('')

      // Add cancellation stats section
      csvLines.push('CANCELLATION_STATS')
      csvLines.push('metric,value')
      csvLines.push(`Cancelled Bookings,${cancellationStats.cancelledBookings}`)
      csvLines.push(`Confirmed Bookings,${cancellationStats.confirmedBookings}`)
      csvLines.push(`Total Bookings,${cancellationStats.totalBookings}`)
      csvLines.push(`Cancellation Rate,${cancellationStats.cancellationRate}%`)
      csvLines.push(`Lost Revenue,${cancellationStats.lostRevenue}`)
    }

    const csv = csvLines.join('\n')

    // Add UTF-8 BOM to ensure proper Unicode character rendering in Excel and other CSV readers
    const csvWithBOM = '\ufeff' + csv

    const element = document.createElement('a')
    element.setAttribute(
      'href',
      `data:text/csv;charset=utf-8,${encodeURIComponent(csvWithBOM)}`
    )
    element.setAttribute(
      'download',
      `${activeTab}-analytics-${dateRange}-${selectedOperator}-${selectedGroupBy}-${new Date().toISOString().split('T')[0]}.csv`
    )
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const handleExportPDF = async () => {
    if (!data && !bookingData) return

    const exportFromDate =
      dateRange === 'custom'
        ? customDateRange.from.toISOString().split('T')[0]
        : getDateRangeFromString(dateRange).from

    const exportToDate =
      dateRange === 'custom'
        ? customDateRange.to.toISOString().split('T')[0]
        : getDateRangeFromString(dateRange).to

    await exportToPDF(activeTab === 'revenue' ? data : bookingData, {
      dateRange,
      fromDate: exportFromDate,
      toDate: exportToDate,
      groupBy: selectedGroupBy,
      operator: selectedOperator,
      activeTab,
    })
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header with Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              Analytics Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Track your financial performance and booking metrics
            </p>
          </div>

          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  disabled={!data && !bookingData}
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportCSV}>
                  <FileText className="w-4 h-4 mr-2" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPDF}>
                  <Download className="w-4 h-4 mr-2" />
                  Export as PDF (with Charts)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) =>
            setActiveTab(value as 'revenue' | 'booking')
          }
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="revenue">Revenue Analytics</TabsTrigger>
            <TabsTrigger value="booking">Booking Analytics</TabsTrigger>
          </TabsList>

          {/* Revenue Analytics Tab */}
          <TabsContent value="revenue" className="space-y-6">
            {/* Content */}
            {loading ? (
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="w-8 h-8 rounded-full border-2 border-muted-foreground border-t-primary animate-spin mx-auto mb-3"></div>
                      <p className="text-sm text-muted-foreground">
                        Loading analytics...
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : error ? (
              <Card className="border-red-200/50 bg-red-50 dark:bg-red-950/20 dark:border-red-900/50">
                <CardContent className="pt-6">
                  <p className="text-red-700 dark:text-red-300 text-sm font-medium">
                    {error}
                  </p>
                </CardContent>
              </Card>
            ) : data ? (
              <>
                {/* Filters Card */}
                <Card className="border-border/50 bg-card">
                  <CardContent className="pt-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                      <div className="flex-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
                          Date Range
                        </label>
                        <Select
                          value={dateRange}
                          onValueChange={(value) =>
                            setDateRange(value as DateRange)
                          }
                        >
                          <SelectTrigger className="bg-background/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="week">Last 7 Days</SelectItem>
                            <SelectItem value="month">Last 30 Days</SelectItem>
                            <SelectItem value="quarter">
                              Last Quarter
                            </SelectItem>
                            <SelectItem value="year">This Year</SelectItem>
                            <SelectItem value="custom">Custom Range</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {dateRange === 'custom' && (
                        <DateRangeFilter
                          dateRange={dateRange}
                          customDateRange={customDateRange}
                          onDateRangeChange={setDateRange}
                          onCustomDateRangeChange={(range) => {
                            if (range.from >= range.to) {
                              setDateError('From date must be before to date')
                            } else {
                              setDateError(null)
                              setCustomDateRange(range)
                              setHasCustomDatesBeenSet(true)
                            }
                          }}
                        />
                      )}

                      <div className="flex-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
                          Group By
                        </label>
                        <Select
                          value={selectedGroupBy}
                          onValueChange={(value) =>
                            setSelectedGroupBy(
                              value as 'day' | 'week' | 'month'
                            )
                          }
                        >
                          <SelectTrigger className="bg-background/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="day">Daily</SelectItem>
                            <SelectItem value="week">Weekly</SelectItem>
                            <SelectItem value="month">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
                          Operator
                        </label>
                        <Select
                          value={selectedOperator}
                          onValueChange={setSelectedOperator}
                          disabled={operatorsLoading}
                        >
                          <SelectTrigger className="bg-background/50">
                            <SelectValue
                              placeholder={
                                operatorsLoading
                                  ? 'Loading...'
                                  : 'All Operators'
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Operators</SelectItem>
                            {operators.map((operator) => (
                              <SelectItem
                                key={operator.operatorId}
                                value={operator.operatorId}
                              >
                                {operator.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Date Error Card */}
                {dateError && (
                  <Card className="border-red-200/50 bg-red-50 dark:bg-red-950/20 dark:border-red-900/50">
                    <CardContent className="pt-6">
                      <p className="text-red-700 dark:text-red-300 text-sm font-medium">
                        {dateError}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Summary Cards Grid */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">
                        Summary
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Key financial metrics and booking statistics
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <RevenueSummaryCards data={data} />
                  </div>
                </div>

                {/* Growth Indicators */}
                <GrowthRateIndicators data={data} />

                {/* Main Charts Grid */}
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Revenue Over Time */}
                  <Card className="border-border/50 lg:col-span-2">
                    <RevenueTrendChart data={data} />
                  </Card>

                  {/* Route Performance */}
                  <Card className="border-border/50">
                    <RoutePerformanceChart data={data} />
                  </Card>

                  {/* Operator Comparison */}
                  <Card className="border-border/50">
                    <OperatorComparisonChart data={data} />
                  </Card>

                  {/* Booking Status Breakdown */}
                  <Card className="border-border/50 lg:col-span-2">
                    <BookingStatusTable data={data} />
                  </Card>
                </div>

                {/* Revenue Breakdown Table */}
                <RevenueBreakdownTable data={data} />
              </>
            ) : (
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No data available for the selected period.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Booking Analytics Tab */}
          <TabsContent value="booking" className="space-y-6">
            {/* Content */}
            {loading ? (
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="w-8 h-8 rounded-full border-2 border-muted-foreground border-t-primary animate-spin mx-auto mb-3"></div>
                      <p className="text-sm text-muted-foreground">
                        Loading analytics...
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : error ? (
              <Card className="border-red-200/50 bg-red-50 dark:bg-red-950/20 dark:border-red-900/50">
                <CardContent className="pt-6">
                  <p className="text-red-700 dark:text-red-300 text-sm font-medium">
                    {error}
                  </p>
                </CardContent>
              </Card>
            ) : bookingData ? (
              <>
                {/* Filters Card */}
                <Card className="border-border/50 bg-card">
                  <CardContent className="pt-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                      <div className="flex-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
                          Date Range
                        </label>
                        <Select
                          value={dateRange}
                          onValueChange={(value) =>
                            setDateRange(value as DateRange)
                          }
                        >
                          <SelectTrigger className="bg-background/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="week">Last 7 Days</SelectItem>
                            <SelectItem value="month">Last 30 Days</SelectItem>
                            <SelectItem value="quarter">
                              Last Quarter
                            </SelectItem>
                            <SelectItem value="year">This Year</SelectItem>
                            <SelectItem value="custom">Custom Range</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {dateRange === 'custom' && (
                        <DateRangeFilter
                          dateRange={dateRange}
                          customDateRange={customDateRange}
                          onDateRangeChange={setDateRange}
                          onCustomDateRangeChange={(range) => {
                            if (range.from >= range.to) {
                              setDateError('From date must be before to date')
                            } else {
                              setDateError(null)
                              setCustomDateRange(range)
                              setHasCustomDatesBeenSet(true)
                            }
                          }}
                        />
                      )}

                      <div className="flex-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
                          Group By
                        </label>
                        <Select
                          value={selectedGroupBy}
                          onValueChange={(value) =>
                            setSelectedGroupBy(
                              value as 'day' | 'week' | 'month'
                            )
                          }
                        >
                          <SelectTrigger className="bg-background/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="day">Daily</SelectItem>
                            <SelectItem value="week">Weekly</SelectItem>
                            <SelectItem value="month">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Date Error Card */}
                {dateError && (
                  <Card className="border-red-200/50 bg-red-50 dark:bg-red-950/20 dark:border-red-900/50">
                    <CardContent className="pt-6">
                      <p className="text-red-700 dark:text-red-300 text-sm font-medium">
                        {dateError}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Summary Cards Grid */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">
                        Summary
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Key booking metrics and performance indicators
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <BookingSummaryCards data={bookingData} />
                  </div>
                </div>

                {/* Charts Grid */}
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Booking Trends Chart */}
                  <Card className="border-border/50 lg:col-span-2">
                    <BookingTrendsChart data={bookingData} />
                  </Card>

                  {/* Status Distribution */}
                  <BookingStatusDistribution data={bookingData} />

                  {/* Top Routes */}
                  <TopRoutesList data={bookingData} />

                  {/* Cancellation Stats */}
                  <CancellationStats data={bookingData} />
                </div>
              </>
            ) : (
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No data available for the selected period.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
