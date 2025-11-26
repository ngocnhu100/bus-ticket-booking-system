import { StatCard } from '../../components/admin/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { BookOpen, Users, DollarSign } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import '@/styles/admin.css'
import { DashboardLayout } from '@/components/admin/DashboardLayout'
// Sample data
const bookingsTrendData = [
  { day: 'Mon', bookings: 45 },
  { day: 'Tue', bookings: 52 },
  { day: 'Wed', bookings: 61 },
  { day: 'Thu', bookings: 55 },
  { day: 'Fri', bookings: 70 },
  { day: 'Sat', bookings: 85 },
  { day: 'Sun', bookings: 78 },
]

const topRoutes = [
  { route: 'HCM → Hanoi', bookings: 234, revenue: '8.2M' },
  { route: 'HCM → Dalat', bookings: 189, revenue: '3.4M' },
  { route: 'Hanoi → Haiphong', bookings: 156, revenue: '2.8M' },
  { route: 'Danang → Hue', bookings: 142, revenue: '2.1M' },
]

const recentBookings = [
  {
    id: 'BK-2045',
    customer: 'Nguyen Van A',
    route: 'HCM → Hanoi',
    date: '2025-11-21',
    amount: '$45',
    status: 'Confirmed',
  },
  {
    id: 'BK-2044',
    customer: 'Tran Thi B',
    route: 'HCM → Dalat',
    date: '2025-11-21',
    amount: '$28',
    status: 'Confirmed',
  },
  {
    id: 'BK-2043',
    customer: 'Le Van C',
    route: 'Hanoi → Haiphong',
    date: '2025-11-21',
    amount: '$32',
    status: 'Pending',
  },
  {
    id: 'BK-2042',
    customer: 'Pham Thi D',
    route: 'Danang → Hue',
    date: '2025-11-20',
    amount: '$25',
    status: 'Confirmed',
  },
  {
    id: 'BK-2041',
    customer: 'Hoang Van E',
    route: 'HCM → Hanoi',
    date: '2025-11-20',
    amount: '$45',
    status: 'Confirmed',
  },
]

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Overview</h1>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Total Bookings"
            value="1,234"
            icon={BookOpen}
            iconColor="text-primary"
          />
          <StatCard
            title="Active Users"
            value="856"
            icon={Users}
            iconColor="text-success"
          />
          <StatCard
            title="Revenue Today"
            value="45.2M"
            icon={DollarSign}
            iconColor="text-warning"
          />
        </div>

        {/* Bookings Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Bookings Trend (Last 7 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={bookingsTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="day"
                  stroke="var(--muted-foreground)"
                  tick={{ fill: 'var(--muted-foreground)' }}
                />
                <YAxis
                  stroke="var(--muted-foreground)"
                  tick={{ fill: 'var(--muted-foreground)' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="bookings"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  dot={{ fill: 'var(--primary)' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Top Routes */}
          <Card>
            <CardHeader>
              <CardTitle>Top Routes</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Route</TableHead>
                    <TableHead className="text-right">Bookings</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topRoutes.map((route, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {route.route}
                      </TableCell>
                      <TableCell className="text-right">
                        {route.bookings}
                      </TableCell>
                      <TableCell className="text-right">
                        {route.revenue}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Recent Bookings */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">
                        {booking.id}
                      </TableCell>
                      <TableCell>{booking.customer}</TableCell>
                      <TableCell>{booking.route}</TableCell>
                      <TableCell className="text-right">
                        {booking.amount}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
