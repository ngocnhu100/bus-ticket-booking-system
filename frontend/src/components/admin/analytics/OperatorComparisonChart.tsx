import { CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

interface OperatorComparisonChartProps {
  data: RevenueAnalyticsResponse
}

export function OperatorComparisonChart({
  data,
}: OperatorComparisonChartProps) {
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar')
  const [selectedMetric, setSelectedMetric] = useState<
    'revenue' | 'bookings' | 'uniqueTrips'
  >('revenue')

  // Use real data from API
  const rawData = data?.data?.byOperator || []
  const chartData = rawData.map((operator) => ({
    operator: operator.operatorName,
    operatorId: operator.operatorId,
    revenue: operator.revenue,
    bookings: operator.bookings,
    uniqueTrips: operator.uniqueTrips,
  }))

  // Show loading state if no data
  if (!chartData || chartData.length === 0) {
    return (
      <>
        <CardHeader className="border-b border-border/30 pb-4">
          <CardTitle className="text-lg font-semibold">
            Operator Comparison
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-80 text-muted-foreground">
            <p className="text-sm">No operator data available</p>
          </div>
        </CardContent>
      </>
    )
  }

  const formatValue = (
    value: number,
    metric: 'revenue' | 'bookings' | 'uniqueTrips'
  ) => {
    if (metric === 'revenue') {
      return `${(value / 1000000).toFixed(1)}M`
    }
    return value.toLocaleString()
  }

  const getMetricLabel = (metric: 'revenue' | 'bookings' | 'uniqueTrips') => {
    switch (metric) {
      case 'revenue':
        return 'Revenue'
      case 'bookings':
        return 'Bookings'
      case 'uniqueTrips':
        return 'Unique Trips'
      default:
        return metric
    }
  }

  // Colors for pie chart
  const COLORS = [
    'var(--chart-1)',
    'var(--chart-2)',
    'var(--chart-3)',
    'var(--chart-4)',
    'var(--chart-5)',
  ]

  return (
    <>
      <CardHeader className="border-b border-border/30 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Top Operators</CardTitle>
          <div className="flex items-center gap-2">
            <Select
              value={selectedMetric}
              onValueChange={(value: 'revenue' | 'bookings' | 'uniqueTrips') =>
                setSelectedMetric(value)
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="revenue">Revenue</SelectItem>
                <SelectItem value="bookings">Bookings</SelectItem>
                <SelectItem value="uniqueTrips">Unique Trips</SelectItem>
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
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          {chartType === 'bar' ? (
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="operator"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => formatValue(value, selectedMetric)}
              />
              <Tooltip
                formatter={(value: number | undefined) => [
                  value === undefined
                    ? 'N/A'
                    : formatValue(value, selectedMetric),
                  getMetricLabel(selectedMetric),
                ]}
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
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ operator, percent }) => {
                  const name =
                    typeof operator === 'string' ? operator : String(operator)
                  return `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`
                }}
                outerRadius={80}
                fill="#8884d8"
                dataKey={selectedMetric}
              >
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number | undefined) => [
                  value === undefined
                    ? 'N/A'
                    : formatValue(value, selectedMetric),
                  getMetricLabel(selectedMetric),
                ]}
                labelStyle={{ color: 'var(--foreground)' }}
                contentStyle={{
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                }}
              />
            </PieChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </>
  )
}
