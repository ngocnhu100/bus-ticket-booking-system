const pool = require('../database');

/**
 * Analytics Repository
 * Contains all SQL queries for analytics and reporting
 */
class AnalyticsRepository {
  /**
   * Get total bookings count with optional filters
   */
  async getTotalBookings(fromDate = null, toDate = null, status = null) {
    let query = 'SELECT COUNT(*) as total FROM bookings WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (fromDate) {
      query += ` AND created_at >= $${paramIndex}::date`;
      params.push(fromDate);
      paramIndex++;
    }

    if (toDate) {
      query += ` AND created_at < ($${paramIndex}::date + interval '1 day')`;
      params.push(toDate);
      paramIndex++;
    }

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    const result = await pool.query(query, params);
    return parseInt(result.rows[0].total);
  }

  /**
   * Get booking trends grouped by time period
   */
  async getBookingTrends(fromDate, toDate, groupBy = 'day') {
    let dateFormat;
    let interval;
    switch (groupBy) {
      case 'week':
        dateFormat = 'YYYY-"W"IW';
        interval = '1 week';
        break;
      case 'month':
        dateFormat = 'YYYY-MM';
        interval = '1 month';
        break;
      default:
        dateFormat = 'YYYY-MM-DD';
        interval = '1 day';
    }

    const query = `
      WITH date_series AS (
        SELECT
          generate_series(
            $1::date,
            ($2::date + interval '1 day' - interval '1 day'),
            '${interval}'::interval
          )::date as period_date
      ),
      booking_stats AS (
        SELECT
          TO_CHAR(created_at, $3) as period,
          COUNT(*) as total_bookings,
          COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_bookings,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bookings,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_bookings
        FROM bookings
        WHERE created_at >= $1::date AND created_at < ($2::date + interval '1 day')
        GROUP BY period
      )
      SELECT
        TO_CHAR(ds.period_date, $3) as period,
        COALESCE(bs.total_bookings, 0) as total_bookings,
        COALESCE(bs.confirmed_bookings, 0) as confirmed_bookings,
        COALESCE(bs.cancelled_bookings, 0) as cancelled_bookings,
        COALESCE(bs.pending_bookings, 0) as pending_bookings
      FROM date_series ds
      LEFT JOIN booking_stats bs ON TO_CHAR(ds.period_date, $3) = bs.period
      ORDER BY ds.period_date ASC
    `;

    const result = await pool.query(query, [fromDate, toDate, dateFormat]);
    return result.rows;
  }

  /**
   * Get booking status distribution
   */
  async getBookingStatusDistribution(fromDate = null, toDate = null) {
    let query = `
      SELECT 
        status,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
      FROM bookings
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (fromDate) {
      query += ` AND created_at >= $${paramIndex}`;
      params.push(fromDate);
      paramIndex++;
    }

    if (toDate) {
      query += ` AND created_at <= $${paramIndex}`;
      params.push(toDate);
      paramIndex++;
    }

    query += ` GROUP BY status ORDER BY count DESC`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Get top most booked routes
   */
  async getTopRoutes(fromDate = null, toDate = null, limit = 10) {
    let query = `
      SELECT 
        r.route_id,
        r.origin,
        r.destination,
        COUNT(b.booking_id) as total_bookings,
        SUM(b.total_price) as total_revenue,
        COUNT(DISTINCT b.trip_id) as unique_trips
      FROM bookings b
      INNER JOIN trips t ON b.trip_id = t.trip_id
      INNER JOIN routes r ON t.route_id = r.route_id
      WHERE b.status IN ('confirmed', 'completed')
    `;
    const params = [];
    let paramIndex = 1;

    if (fromDate) {
      query += ` AND b.created_at >= $${paramIndex}`;
      params.push(fromDate);
      paramIndex++;
    }

    if (toDate) {
      query += ` AND b.created_at <= $${paramIndex}`;
      params.push(toDate);
      paramIndex++;
    }

    query += `
      GROUP BY r.route_id, r.origin, r.destination
      ORDER BY total_bookings DESC
      LIMIT $${paramIndex}
    `;
    params.push(limit);

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Get total revenue with optional filters
   */
  async getTotalRevenue(fromDate = null, toDate = null, status = null) {
    const params = [];
    let paramIndex = 1;
    
    let statusCondition;
    if (status) {
      statusCondition = `status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    } else {
      statusCondition = `status IN ('confirmed', 'completed')`;
    }
    
    let query = `
      SELECT 
        COALESCE(SUM(total_price), 0) as total_revenue,
        COUNT(*) as booking_count,
        COALESCE(AVG(total_price), 0) as average_booking_value
      FROM bookings
      WHERE ${statusCondition}
    `;

    if (fromDate) {
      query += ` AND created_at >= $${paramIndex}`;
      params.push(fromDate);
      paramIndex++;
    }

    if (toDate) {
      query += ` AND created_at <= $${paramIndex}`;
      params.push(toDate);
      paramIndex++;
    }

    const result = await pool.query(query, params);
    return result.rows[0];
  }

  /**
   * Get revenue trends grouped by time period
   */
  async getRevenueTrends(fromDate, toDate, groupBy = 'day') {
    let dateFormat;
    switch (groupBy) {
      case 'week':
        dateFormat = 'YYYY-"W"IW';
        break;
      case 'month':
        dateFormat = 'YYYY-MM';
        break;
      default:
        dateFormat = 'YYYY-MM-DD';
    }

    const query = `
      SELECT 
        TO_CHAR(created_at, $1) as period,
        COALESCE(SUM(total_price), 0) as revenue,
        COUNT(*) as bookings,
        COALESCE(AVG(total_price), 0) as average_booking_value
      FROM bookings
      WHERE created_at >= $2 
        AND created_at <= $3
        AND status IN ('confirmed', 'completed')
      GROUP BY period
      ORDER BY period ASC
    `;

    const result = await pool.query(query, [dateFormat, fromDate, toDate]);
    return result.rows;
  }

  /**
   * Get revenue by route
   */
  async getRevenueByRoute(fromDate = null, toDate = null, limit = 10) {
    let query = `
      SELECT 
        r.route_id,
        r.origin,
        r.destination,
        COALESCE(SUM(b.total_price), 0) as revenue,
        COUNT(b.booking_id) as bookings,
        COALESCE(AVG(b.total_price), 0) as average_price
      FROM bookings b
      INNER JOIN trips t ON b.trip_id = t.trip_id
      INNER JOIN routes r ON t.route_id = r.route_id
      WHERE b.status IN ('confirmed', 'completed')
    `;
    const params = [];
    let paramIndex = 1;

    if (fromDate) {
      query += ` AND b.created_at >= $${paramIndex}`;
      params.push(fromDate);
      paramIndex++;
    }

    if (toDate) {
      query += ` AND b.created_at <= $${paramIndex}`;
      params.push(toDate);
      paramIndex++;
    }

    query += `
      GROUP BY r.route_id, r.origin, r.destination
      ORDER BY revenue DESC
      LIMIT $${paramIndex}
    `;
    params.push(limit);

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Get revenue by booking status
   */
  async getRevenueByStatus(fromDate = null, toDate = null) {
    let query = `
      SELECT 
        status,
        COALESCE(SUM(total_price), 0) as revenue,
        COUNT(*) as bookings,
        COALESCE(AVG(total_price), 0) as average_value
      FROM bookings
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (fromDate) {
      query += ` AND created_at >= $${paramIndex}`;
      params.push(fromDate);
      paramIndex++;
    }

    if (toDate) {
      query += ` AND created_at <= $${paramIndex}`;
      params.push(toDate);
      paramIndex++;
    }

    query += ` GROUP BY status ORDER BY revenue DESC`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Get revenue by operator
   */
  async getRevenueByOperator(fromDate = null, toDate = null, limit = 10) {
    let query = `
      SELECT 
        o.operator_id,
        o.name as operator_name,
        COALESCE(SUM(b.total_price), 0) as revenue,
        COUNT(b.booking_id) as bookings,
        COUNT(DISTINCT b.trip_id) as unique_trips
      FROM bookings b
      INNER JOIN trips t ON b.trip_id = t.trip_id
      INNER JOIN buses bu ON t.bus_id = bu.bus_id
      INNER JOIN operators o ON bu.operator_id = o.operator_id
      WHERE b.status IN ('confirmed', 'completed')
    `;
    const params = [];
    let paramIndex = 1;

    if (fromDate) {
      query += ` AND b.created_at >= $${paramIndex}`;
      params.push(fromDate);
      paramIndex++;
    }

    if (toDate) {
      query += ` AND b.created_at <= $${paramIndex}`;
      params.push(toDate);
      paramIndex++;
    }

    query += `
      GROUP BY o.operator_id, o.name
      ORDER BY revenue DESC
      LIMIT $${paramIndex}
    `;
    params.push(limit);

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Get active users count
   * Active users are those who are registered and can login (have password or google account)
   */
  async getActiveUsersCount() {
    const query = `
      SELECT COUNT(*) as total
      FROM users
      WHERE (password_hash IS NOT NULL OR google_id IS NOT NULL)
        AND (account_locked_until IS NULL OR account_locked_until < NOW())
    `;

    const result = await pool.query(query);
    return parseInt(result.rows[0].total);
  }

  /**
   * Get cancellation statistics
   */
  async getCancellationStats(fromDate = null, toDate = null) {
    let query = `
      SELECT
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_bookings,
        COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_bookings,
        COUNT(*) as total_bookings,
        ROUND(
          COUNT(*) FILTER (WHERE status = 'cancelled')::numeric * 100.0 /
          NULLIF(COUNT(*), 0),
          2
        ) as cancellation_rate,
        COALESCE(SUM(total_price) FILTER (WHERE status = 'cancelled'), 0) as lost_revenue
      FROM bookings
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (fromDate) {
      query += ` AND created_at >= $${paramIndex}`;
      params.push(fromDate);
      paramIndex++;
    }

    if (toDate) {
      query += ` AND created_at <= $${paramIndex}`;
      params.push(toDate);
      paramIndex++;
    }

    const result = await pool.query(query, params);
    return result.rows[0];
  }
}

module.exports = new AnalyticsRepository();
