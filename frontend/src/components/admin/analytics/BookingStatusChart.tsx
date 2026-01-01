import { CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useState } from 'react'
import type {
  RevenueAnalyticsResponse,
  RevenueByStatus,
} from '@/api/revenueAnalytics'
import { formatCurrency } from '@/api/revenueAnalytics'

interface BookingStatusChartProps {
  data: RevenueAnalyticsResponse
}

export function BookingStatusTable({ data }: BookingStatusChartProps) {
  const [sortBy, setSortBy] = useState<
    'status' | 'revenue' | 'bookings' | 'averageValue'
  >('status')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [viewType, setViewType] = useState<'chart' | 'table'>('chart')
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar')
  const [selectedMetric, setSelectedMetric] = useState<
    'revenue' | 'bookings' | 'averageValue'
  >('revenue')

  const rawData: RevenueByStatus[] = data?.data?.byStatus || []

  // Show loading state if no data
  if (!rawData || rawData.length === 0) {
    return (
      <>
        <CardHeader className="border-b border-border/30 pb-4">
          <CardTitle className="text-lg font-semibold">
            Booking Status Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-200px text-muted-foreground">
            <p className="text-sm">No booking status data available</p>
          </div>
        </CardContent>
      </>
    )
  }

  // Colors for different statuses
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'var(--chart-1)'
      case 'pending':
        return 'var(--chart-2)'
      case 'cancelled':
        return 'var(--chart-3)'
      case 'refunded':
        return 'var(--chart-4)'
      case 'completed':
        return 'var(--chart-5)'
      default:
        return 'var(--muted-foreground)'
    }
  }

  const handleSort = (
    column: 'status' | 'revenue' | 'bookings' | 'averageValue'
  ) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
  }

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return null
    return sortOrder === 'asc' ? '↑' : '↓'
  }

  const sortedData = [...rawData].sort((a, b) => {
    let aValue: string | number = a[sortBy]
    let bValue: string | number = b[sortBy]

    if (sortBy === 'status') {
      aValue = a.status.toLowerCase()
      bValue = b.status.toLowerCase()
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortOrder === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    }

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue
    }

    return 0
  })

  const formatStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  return (
    <>
      <CardHeader className="border-b border-border/30 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            Booking Status Breakdown
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select
              value={viewType}
              onValueChange={(value: 'chart' | 'table') => setViewType(value)}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="chart">Chart</SelectItem>
                <SelectItem value="table">Table</SelectItem>
              </SelectContent>
            </Select>
            {viewType === 'chart' && (
              <>
                <Select
                  value={selectedMetric}
                  onValueChange={(
                    value: 'revenue' | 'bookings' | 'averageValue'
                  ) => setSelectedMetric(value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="revenue">Revenue</SelectItem>
                    <SelectItem value="bookings">Bookings</SelectItem>
                    <SelectItem value="averageValue">Avg. Value</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={chartType}
                  onValueChange={(value: 'bar' | 'pie') => setChartType(value)}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bar">Bar</SelectItem>
                    <SelectItem value="pie">Pie</SelectItem>
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {viewType === 'chart' ? (
          <ResponsiveContainer width="100%" height={320}>
            {chartType === 'bar' ? (
              <BarChart
                data={rawData}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="status"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tickFormatter={formatStatusLabel}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => {
                    if (
                      selectedMetric === 'revenue' ||
                      selectedMetric === 'averageValue'
                    ) {
                      return `${(value / 1000000).toFixed(1)}M`
                    }
                    return value.toLocaleString()
                  }}
                />
                <Tooltip
                  formatter={(value: number | undefined) => [
                    value === undefined
                      ? 'N/A'
                      : selectedMetric === 'revenue' ||
                          selectedMetric === 'averageValue'
                        ? formatCurrency(value)
                        : value.toLocaleString(),
                    selectedMetric === 'revenue'
                      ? 'Revenue'
                      : selectedMetric === 'bookings'
                        ? 'Bookings'
                        : 'Avg. Value',
                  ]}
                  labelFormatter={(label) => formatStatusLabel(label)}
                  labelStyle={{ color: 'var(--foreground)' }}
                  contentStyle={{
                    backgroundColor: 'var(--background)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                  }}
                />
                <Bar
                  dataKey={selectedMetric}
                  fill="var(--chart-1)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            ) : (
              <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <Pie
                  data={rawData as unknown as Record<string, string | number>[]}
                  cx="50%"
                  cy="45%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey={selectedMetric}
                  nameKey="status"
                >
                  {rawData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={getStatusColor(entry.status)}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number | undefined) => [
                    value === undefined
                      ? 'N/A'
                      : selectedMetric === 'revenue' ||
                          selectedMetric === 'averageValue'
                        ? formatCurrency(value)
                        : value.toLocaleString(),
                    selectedMetric === 'revenue'
                      ? 'Revenue'
                      : selectedMetric === 'bookings'
                        ? 'Bookings'
                        : 'Avg. Value',
                  ]}
                  labelFormatter={(label) => formatStatusLabel(label)}
                  contentStyle={{
                    backgroundColor: 'var(--background)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                  }}
                  labelStyle={{ color: 'var(--foreground)' }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => (
                    <span
                      style={{
                        color: 'var(--foreground)',
                        fontSize: '0.875rem',
                      }}
                    >
                      {formatStatusLabel(value)}
                    </span>
                  )}
                />
              </PieChart>
            )}
          </ResponsiveContainer>
        ) : (
          <TooltipProvider>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-2">
                      Status
                      {getSortIcon('status')}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50 select-none text-right"
                    onClick={() => handleSort('revenue')}
                  >
                    <div className="flex items-center gap-2 justify-end">
                      Revenue
                      {getSortIcon('revenue')}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50 select-none text-right"
                    onClick={() => handleSort('bookings')}
                  >
                    <div className="flex items-center gap-2 justify-end">
                      Bookings
                      {getSortIcon('bookings')}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50 select-none text-right"
                    onClick={() => handleSort('averageValue')}
                  >
                    <div className="flex items-center gap-2 justify-end">
                      Avg. Value
                      {getSortIcon('averageValue')}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: getStatusColor(item.status),
                          }}
                        />
                        {formatStatusLabel(item.status)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      <UITooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help">
                            {formatCurrency(item.revenue)}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{item.revenue.toLocaleString()} ₫</p>
                        </TooltipContent>
                      </UITooltip>
                    </TableCell>
                    <TableCell className="text-right">
                      {item.bookings.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      <UITooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help">
                            {formatCurrency(item.averageValue)}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{item.averageValue.toLocaleString()} ₫</p>
                        </TooltipContent>
                      </UITooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TooltipProvider>
        )}
      </CardContent>
    </>
  )
}
