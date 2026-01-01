import { CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { RevenueAnalyticsResponse } from '@/api/revenueAnalytics'

interface RoutePerformanceChartProps {
  data: RevenueAnalyticsResponse
}

export function RoutePerformanceChart({ data }: RoutePerformanceChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<
    'revenue' | 'bookings' | 'averagePrice'
  >('revenue')
  const chartData = data?.data?.byRoute || []

  // Show loading state if no data
  if (!chartData || chartData.length === 0) {
    return (
      <>
        <CardHeader className="border-b border-border/30 pb-4">
          <CardTitle className="text-lg font-semibold">
            Route Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-80 text-muted-foreground">
            <p className="text-sm">No route performance data available</p>
          </div>
        </CardContent>
      </>
    )
  }

  const formatValue = (
    value: number,
    metric: 'revenue' | 'bookings' | 'averagePrice'
  ) => {
    if (metric === 'revenue' || metric === 'averagePrice') {
      return `${(value / 1000000).toFixed(1)}M`
    }
    return value.toLocaleString()
  }

  const getMetricLabel = (metric: 'revenue' | 'bookings' | 'averagePrice') => {
    switch (metric) {
      case 'revenue':
        return 'Revenue'
      case 'bookings':
        return 'Bookings'
      case 'averagePrice':
        return 'Avg. Price'
      default:
        return metric
    }
  }

  return (
    <>
      <CardHeader className="border-b border-border/30 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Top Routes</CardTitle>
          <Select
            value={selectedMetric}
            onValueChange={(value) =>
              setSelectedMetric(
                value as 'revenue' | 'bookings' | 'averagePrice'
              )
            }
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="revenue">Revenue</SelectItem>
              <SelectItem value="bookings">Bookings</SelectItem>
              <SelectItem value="averagePrice">Avg. Price</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ left: 100, right: 40 }}
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
              opacity={0.8}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              }}
              formatter={(value: number | undefined) => {
                if (value === undefined) {
                  return ['N/A', getMetricLabel(selectedMetric)]
                }
                return [
                  formatValue(value, selectedMetric),
                  getMetricLabel(selectedMetric),
                ]
              }}
              labelStyle={{ color: 'var(--foreground)' }}
            />
            <Bar
              dataKey={selectedMetric}
              fill="var(--chart-1)"
              radius={[0, 8, 8, 0]}
              name={getMetricLabel(selectedMetric)}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </>
  )
}
