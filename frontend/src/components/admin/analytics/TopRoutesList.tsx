import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatCurrency } from '@/api/revenueAnalytics'
import type { BookingAnalyticsResponse } from '@/api/bookingAnalytics'

interface TopRoutesListProps {
  data: BookingAnalyticsResponse
  limit?: number
}

export function TopRoutesList({ data, limit = 5 }: TopRoutesListProps) {
  const [selectedMetric, setSelectedMetric] = useState<
    'totalBookings' | 'revenue' | 'uniqueTrips'
  >('totalBookings')
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar')
  const { topRoutes } = data.data
  const chartData = topRoutes.slice(0, limit)

  // Show loading state if no data
  if (!chartData || chartData.length === 0) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Top Routes</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-80 text-muted-foreground">
            <p className="text-sm">No route data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const formatValue = (value: number) => {
    if (selectedMetric === 'revenue') {
      return formatCurrency(value)
    }
    return value.toString()
  }

  const getMetricLabel = () => {
    switch (selectedMetric) {
      case 'totalBookings':
        return 'Total Bookings'
      case 'revenue':
        return 'Revenue'
      case 'uniqueTrips':
        return 'Unique Trips'
      default:
        return 'Value'
    }
  }

  // Colors for pie chart slices
  const getRouteColor = (index: number) => {
    const colors = [
      'var(--chart-1)',
      'var(--chart-2)',
      'var(--chart-3)',
      'var(--chart-4)',
      'var(--chart-5)',
    ]
    return colors[index % colors.length]
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="border-b border-border/30 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Top Routes</CardTitle>
          <div className="flex items-center gap-2">
            <Select
              value={selectedMetric}
              onValueChange={(value) =>
                setSelectedMetric(
                  value as 'totalBookings' | 'revenue' | 'uniqueTrips'
                )
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="totalBookings">Bookings</SelectItem>
                <SelectItem value="revenue">Revenue</SelectItem>
                <SelectItem value="uniqueTrips">Trips</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={chartType}
              onValueChange={(value: 'bar' | 'pie') => setChartType(value)}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bar">Bar</SelectItem>
                <SelectItem value="pie">Pie</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <ResponsiveContainer width="100%" height={320}>
          {chartType === 'bar' ? (
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ left: 120, right: 40 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                horizontal={false}
                opacity={0.3}
              />
              <XAxis
                type="number"
                stroke="var(--muted-foreground)"
                style={{ fontSize: '0.75rem' }}
                opacity={0.6}
              />
              <YAxis
                type="category"
                dataKey="route"
                stroke="var(--muted-foreground)"
                width={140}
                style={{ fontSize: '0.75rem' }}
                opacity={0.6}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  color: 'var(--foreground)',
                }}
                labelStyle={{ color: 'var(--foreground)' }}
                formatter={(value) => [
                  formatValue(value as number),
                  getMetricLabel(),
                ]}
              />
              <Bar
                dataKey={selectedMetric}
                fill="var(--chart-1)"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          ) : (
            <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <Pie
                data={chartData as unknown as Record<string, string | number>[]}
                cx="50%"
                cy="45%"
                outerRadius={80}
                fill="#8884d8"
                dataKey={selectedMetric}
                nameKey="route"
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={getRouteColor(index)} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  color: 'var(--foreground)',
                }}
                labelStyle={{ color: 'var(--foreground)' }}
                formatter={(value) => [
                  formatValue(value as number),
                  getMetricLabel(),
                ]}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => (
                  <span
                    style={{ color: 'var(--foreground)', fontSize: '0.875rem' }}
                  >
                    {value}
                  </span>
                )}
              />
            </PieChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
