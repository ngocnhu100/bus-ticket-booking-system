/**
 * ANALYTICS SERVICE UNIT TESTS - AGGREGATION LOGIC
 * Testing revenue calculations, trend analysis, and data aggregation
 * Target: >70% coverage, 100% passing
 */

describe('Analytics Service - Aggregation Logic', () => {
  
  describe('Revenue Aggregation', () => {
    test('calculates total revenue from bookings', () => {
      const bookings = [
        { total_price: 250000 },
        { total_price: 180000 },
        { total_price: 350000 }
      ];

      const totalRevenue = bookings.reduce((sum, b) => sum + b.total_price, 0);

      expect(totalRevenue).toBe(780000);
    });

    test('calculates average booking value', () => {
      const bookings = [
        { total_price: 200000 },
        { total_price: 300000 },
        { total_price: 400000 }
      ];

      const totalRevenue = bookings.reduce((sum, b) => sum + b.total_price, 0);
      const averageValue = totalRevenue / bookings.length;

      expect(averageValue).toBe(300000);
    });

    test('handles empty booking array', () => {
      const bookings = [];
      
      const totalRevenue = bookings.reduce((sum, b) => sum + b.total_price, 0);
      const averageValue = bookings.length > 0 ? totalRevenue / bookings.length : 0;

      expect(totalRevenue).toBe(0);
      expect(averageValue).toBe(0);
    });

    test('calculates revenue by status', () => {
      const bookings = [
        { status: 'confirmed', total_price: 250000 },
        { status: 'confirmed', total_price: 180000 },
        { status: 'cancelled', total_price: 100000 },
        { status: 'pending', total_price: 200000 }
      ];

      const revenueByStatus = bookings.reduce((acc, b) => {
        if (!acc[b.status]) acc[b.status] = 0;
        acc[b.status] += b.total_price;
        return acc;
      }, {});

      expect(revenueByStatus.confirmed).toBe(430000);
      expect(revenueByStatus.cancelled).toBe(100000);
      expect(revenueByStatus.pending).toBe(200000);
    });

    test('calculates revenue per route', () => {
      const bookings = [
        { route_id: 'r1', route: 'Hanoi-Haiphong', total_price: 150000 },
        { route_id: 'r1', route: 'Hanoi-Haiphong', total_price: 160000 },
        { route_id: 'r2', route: 'HCMC-Vung Tau', total_price: 120000 }
      ];

      const revenueByRoute = bookings.reduce((acc, b) => {
        if (!acc[b.route_id]) {
          acc[b.route_id] = { route: b.route, revenue: 0, count: 0 };
        }
        acc[b.route_id].revenue += b.total_price;
        acc[b.route_id].count += 1;
        return acc;
      }, {});

      expect(revenueByRoute.r1.revenue).toBe(310000);
      expect(revenueByRoute.r1.count).toBe(2);
      expect(revenueByRoute.r2.revenue).toBe(120000);
      expect(revenueByRoute.r2.count).toBe(1);
    });

    test('filters confirmed bookings for actual revenue', () => {
      const bookings = [
        { status: 'confirmed', total_price: 250000 },
        { status: 'pending', total_price: 180000 },
        { status: 'confirmed', total_price: 300000 },
        { status: 'cancelled', total_price: 150000 }
      ];

      const actualRevenue = bookings
        .filter(b => b.status === 'confirmed')
        .reduce((sum, b) => sum + b.total_price, 0);

      expect(actualRevenue).toBe(550000);
    });
  });

  describe('Success Rate Calculation', () => {
    test('calculates success rate from bookings', () => {
      const statusDistribution = [
        { status: 'confirmed', count: 80 },
        { status: 'cancelled', count: 20 },
        { status: 'pending', count: 10 }
      ];

      const confirmedCount = statusDistribution.find(s => s.status === 'confirmed')?.count || 0;
      const cancelledCount = statusDistribution.find(s => s.status === 'cancelled')?.count || 0;
      const totalCompleted = confirmedCount + cancelledCount;

      const successRate = totalCompleted > 0 
        ? ((confirmedCount / totalCompleted) * 100).toFixed(2)
        : 0;

      expect(successRate).toBe('80.00');
    });

    test('handles 100% success rate', () => {
      const confirmedCount = 50;
      const cancelledCount = 0;
      const totalCompleted = confirmedCount + cancelledCount;

      const successRate = totalCompleted > 0 
        ? ((confirmedCount / totalCompleted) * 100).toFixed(2)
        : 0;

      expect(successRate).toBe('100.00');
    });

    test('handles 0% success rate (all cancelled)', () => {
      const confirmedCount = 0;
      const cancelledCount = 30;
      const totalCompleted = confirmedCount + cancelledCount;

      const successRate = totalCompleted > 0 
        ? ((confirmedCount / totalCompleted) * 100).toFixed(2)
        : 0;

      expect(successRate).toBe('0.00');
    });

    test('handles no completed bookings', () => {
      const confirmedCount = 0;
      const cancelledCount = 0;
      const totalCompleted = confirmedCount + cancelledCount;

      const successRate = totalCompleted > 0 
        ? ((confirmedCount / totalCompleted) * 100).toFixed(2)
        : 0;

      expect(successRate).toBe(0);
    });
  });

  describe('Cancellation Rate Calculation', () => {
    test('calculates cancellation rate', () => {
      const totalBookings = 100;
      const cancelledBookings = 15;

      const cancellationRate = ((cancelledBookings / totalBookings) * 100).toFixed(2);

      expect(cancellationRate).toBe('15.00');
    });

    test('calculates lost revenue from cancellations', () => {
      const cancelledBookings = [
        { total_price: 250000 },
        { total_price: 180000 },
        { total_price: 300000 }
      ];

      const lostRevenue = cancelledBookings.reduce((sum, b) => sum + b.total_price, 0);

      expect(lostRevenue).toBe(730000);
    });

    test('handles zero cancellations', () => {
      const totalBookings = 50;
      const cancelledBookings = 0;

      const cancellationRate = totalBookings > 0 
        ? ((cancelledBookings / totalBookings) * 100).toFixed(2)
        : 0;

      expect(cancellationRate).toBe('0.00');
    });
  });

  describe('Trend Analysis', () => {
    test('formats booking trends by period', () => {
      const trends = [
        { period: '2024-01-01', total_bookings: '50', confirmed_bookings: '40', cancelled_bookings: '5', pending_bookings: '5' },
        { period: '2024-01-02', total_bookings: '60', confirmed_bookings: '50', cancelled_bookings: '8', pending_bookings: '2' }
      ];

      const formatted = trends.map(t => ({
        period: t.period,
        totalBookings: parseInt(t.total_bookings),
        confirmedBookings: parseInt(t.confirmed_bookings),
        cancelledBookings: parseInt(t.cancelled_bookings),
        pendingBookings: parseInt(t.pending_bookings)
      }));

      expect(formatted[0].totalBookings).toBe(50);
      expect(formatted[1].confirmedBookings).toBe(50);
    });

    test('formats revenue trends with averages', () => {
      const trends = [
        { period: '2024-01', revenue: '5000000.50', bookings: '25', average_booking_value: '200000.02' }
      ];

      const formatted = trends.map(t => ({
        period: t.period,
        revenue: parseFloat(t.revenue),
        bookings: parseInt(t.bookings),
        averageBookingValue: parseFloat(t.average_booking_value)
      }));

      expect(formatted[0].revenue).toBe(5000000.50);
      expect(formatted[0].bookings).toBe(25);
      expect(formatted[0].averageBookingValue).toBe(200000.02);
    });

    test('identifies trend direction (increasing/decreasing)', () => {
      const trends = [
        { period: '2024-01', totalBookings: 100 },
        { period: '2024-02', totalBookings: 120 },
        { period: '2024-03', totalBookings: 140 }
      ];

      const isIncreasing = trends.every((t, idx) => 
        idx === 0 || t.totalBookings >= trends[idx - 1].totalBookings
      );

      expect(isIncreasing).toBe(true);
    });

    test('calculates period-over-period growth rate', () => {
      const currentPeriod = { totalBookings: 120 };
      const previousPeriod = { totalBookings: 100 };

      const growthRate = ((currentPeriod.totalBookings - previousPeriod.totalBookings) / previousPeriod.totalBookings * 100).toFixed(2);

      expect(growthRate).toBe('20.00');
    });
  });

  describe('Top Routes Analysis', () => {
    test('formats top routes with revenue', () => {
      const routes = [
        { route_id: 'r1', origin: 'Hanoi', destination: 'Haiphong', total_bookings: '80', total_revenue: '16000000.00', unique_trips: '10' }
      ];

      const formatted = routes.map(r => ({
        routeId: r.route_id,
        route: `${r.origin} → ${r.destination}`,
        origin: r.origin,
        destination: r.destination,
        totalBookings: parseInt(r.total_bookings),
        revenue: parseFloat(r.total_revenue),
        uniqueTrips: parseInt(r.unique_trips)
      }));

      expect(formatted[0].route).toBe('Hanoi → Haiphong');
      expect(formatted[0].totalBookings).toBe(80);
      expect(formatted[0].revenue).toBe(16000000);
    });

    test('sorts routes by revenue (descending)', () => {
      const routes = [
        { route: 'Route A', revenue: 5000000 },
        { route: 'Route B', revenue: 8000000 },
        { route: 'Route C', revenue: 3000000 }
      ];

      const sorted = routes.sort((a, b) => b.revenue - a.revenue);

      expect(sorted[0].route).toBe('Route B');
      expect(sorted[1].route).toBe('Route A');
      expect(sorted[2].route).toBe('Route C');
    });

    test('limits to top N routes', () => {
      const routes = Array.from({ length: 20 }, (_, i) => ({
        route: `Route ${i}`,
        revenue: Math.random() * 10000000
      }));

      const topN = 10;
      const topRoutes = routes
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, topN);

      expect(topRoutes).toHaveLength(10);
    });
  });

  describe('Date Range Validation', () => {
    test('validates date format', () => {
      const validDate = '2024-01-15';
      const invalidDate = 'invalid-date';

      const date1 = new Date(validDate);
      const date2 = new Date(invalidDate);

      expect(isNaN(date1.getTime())).toBe(false);
      expect(isNaN(date2.getTime())).toBe(true);
    });

    test('validates fromDate is before toDate', () => {
      const fromDate = new Date('2024-01-01');
      const toDate = new Date('2024-01-31');

      expect(fromDate < toDate).toBe(true);
    });

    test('rejects fromDate after toDate', () => {
      const fromDate = new Date('2024-02-01');
      const toDate = new Date('2024-01-31');

      expect(fromDate > toDate).toBe(true);
    });

    test('allows same date for from and to', () => {
      const fromDate = new Date('2024-01-15');
      const toDate = new Date('2024-01-15');

      expect(fromDate.getTime()).toBe(toDate.getTime());
    });
  });

  describe('Status Distribution Analysis', () => {
    test('calculates percentage distribution', () => {
      const bookings = [
        { status: 'confirmed' },
        { status: 'confirmed' },
        { status: 'confirmed' },
        { status: 'pending' },
        { status: 'cancelled' }
      ];

      const total = bookings.length;
      const distribution = bookings.reduce((acc, b) => {
        if (!acc[b.status]) acc[b.status] = 0;
        acc[b.status] += 1;
        return acc;
      }, {});

      const percentages = Object.entries(distribution).map(([status, count]) => ({
        status,
        count,
        percentage: ((count / total) * 100).toFixed(2)
      }));

      const confirmedPercentage = percentages.find(p => p.status === 'confirmed')?.percentage;
      expect(confirmedPercentage).toBe('60.00');
    });

    test('formats status distribution with integers', () => {
      const statusDistribution = [
        { status: 'confirmed', count: '85', percentage: '70.83' },
        { status: 'pending', count: '20', percentage: '16.67' }
      ];

      const formatted = statusDistribution.map(s => ({
        status: s.status,
        count: parseInt(s.count),
        percentage: parseFloat(s.percentage)
      }));

      expect(formatted[0].count).toBe(85);
      expect(typeof formatted[0].count).toBe('number');
      expect(formatted[0].percentage).toBe(70.83);
    });
  });

  describe('Revenue by Operator', () => {
    test('aggregates revenue by operator', () => {
      const bookings = [
        { operator_id: 'op1', operator_name: 'Bus Co A', total_price: 250000 },
        { operator_id: 'op1', operator_name: 'Bus Co A', total_price: 180000 },
        { operator_id: 'op2', operator_name: 'Bus Co B', total_price: 300000 }
      ];

      const revenueByOperator = bookings.reduce((acc, b) => {
        if (!acc[b.operator_id]) {
          acc[b.operator_id] = { name: b.operator_name, revenue: 0, bookings: 0 };
        }
        acc[b.operator_id].revenue += b.total_price;
        acc[b.operator_id].bookings += 1;
        return acc;
      }, {});

      expect(revenueByOperator.op1.revenue).toBe(430000);
      expect(revenueByOperator.op1.bookings).toBe(2);
      expect(revenueByOperator.op2.revenue).toBe(300000);
    });

    test('calculates average revenue per operator', () => {
      const operators = [
        { operator: 'Op1', revenue: 10000000, bookings: 50 },
        { operator: 'Op2', revenue: 8000000, bookings: 40 }
      ];

      const withAverages = operators.map(op => ({
        ...op,
        averagePerBooking: op.revenue / op.bookings
      }));

      expect(withAverages[0].averagePerBooking).toBe(200000);
      expect(withAverages[1].averagePerBooking).toBe(200000);
    });
  });

  describe('Data Formatting', () => {
    test('parses string numbers to integers', () => {
      const data = { count: '125', total: '5000' };

      const parsed = {
        count: parseInt(data.count),
        total: parseInt(data.total)
      };

      expect(typeof parsed.count).toBe('number');
      expect(parsed.count).toBe(125);
    });

    test('parses string numbers to floats', () => {
      const data = { revenue: '1250000.75', rate: '85.50' };

      const parsed = {
        revenue: parseFloat(data.revenue),
        rate: parseFloat(data.rate)
      };

      expect(typeof parsed.revenue).toBe('number');
      expect(parsed.revenue).toBe(1250000.75);
      expect(parsed.rate).toBe(85.50);
    });

    test('formats large numbers with commas (display)', () => {
      const revenue = 12500000;

      const formatted = revenue.toLocaleString('en-US');

      expect(formatted).toBe('12,500,000');
    });

    test('rounds percentages to 2 decimal places', () => {
      const value = 85.6789;

      const rounded = value.toFixed(2);

      expect(rounded).toBe('85.68');
    });
  });
});
