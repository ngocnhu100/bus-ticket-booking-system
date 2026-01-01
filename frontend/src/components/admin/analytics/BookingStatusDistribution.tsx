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
import type { BookingAnalyticsResponse } from '@/api/bookingAnalytics'

interface BookingStatusDistributionProps {
  data: BookingAnalyticsResponse
}

export function BookingStatusDistribution({
  data,
}: BookingStatusDistributionProps) {
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar')
  const { statusDistribution } = data.data

  // Show loading state if no data
  if (!statusDistribution || statusDistribution.length === 0) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Booking Status Distribution</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-80 text-muted-foreground">
            <p className="text-sm">No status distribution data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Colors for pie chart slices
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

  const formatStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="border-b border-border/30 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            Booking Status Distribution
          </CardTitle>
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
      </CardHeader>
      <CardContent className="pt-6">
        <ResponsiveContainer width="100%" height={280}>
          {chartType === 'bar' ? (
            <BarChart
              data={statusDistribution}
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
                tickFormatter={(value) => value.toLocaleString()}
              />
              <Tooltip
                formatter={(
                  value: number | undefined,
                  name: string,
                  props: { payload?: { percentage?: number } }
                ) => [
                  value === undefined
                    ? 'N/A'
                    : `${value.toLocaleString()} (${props.payload?.percentage ?? 0}%)`,
                  'Count',
                ]}
                labelFormatter={(label) => formatStatusLabel(label)}
                labelStyle={{ color: 'var(--foreground)' }}
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                }}
              />
              <Bar
                dataKey="count"
                fill="var(--chart-1)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          ) : (
            <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <Pie
                data={
                  statusDistribution as unknown as Record<
                    string,
                    string | number
                  >[]
                }
                cx="50%"
                cy="45%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
                nameKey="status"
              >
                {statusDistribution.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getStatusColor(entry.status)}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(
                  value: number | undefined,
                  name: string,
                  props: { payload?: { percentage?: number } }
                ) => [
                  value === undefined
                    ? 'N/A'
                    : `${value.toLocaleString()} (${props.payload?.percentage ?? 0}%)`,
                  'Count',
                ]}
                labelFormatter={(label) => formatStatusLabel(label)}
                contentStyle={{
                  backgroundColor: 'var(--card)',
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
                    style={{ color: 'var(--foreground)', fontSize: '0.875rem' }}
                  >
                    {formatStatusLabel(value)}
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
