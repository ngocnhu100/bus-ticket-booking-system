// repositories/tripRepository.js
const pool = require('../database');
const TIMEZONE_CONFIG = require('../config/timezone');

class TripRepository {
  // Helper để tạo câu SELECT đầy đủ các trường theo interface Trip
  _getSelectClause() {
    return `
      SELECT 
        t.trip_id, t.departure_time, t.arrival_time, t.base_price, t.status, t.policies::jsonb AS policies,
        
        -- Route info
        r.route_id, r.origin, r.destination, r.distance_km, r.estimated_minutes,
        
        -- Operator info
        o.operator_id, o.name as operator_name, 
        COALESCE((
          SELECT AVG(rating.overall_rating) 
          FROM ratings rating 
          WHERE rating.operator_id = o.operator_id AND rating.is_approved = true
        ), 0) as operator_rating, 
        o.logo_url as operator_logo,
        
        -- Bus info
        b.bus_id, b.plate_number, b.type as bus_type, bm.name as bus_model,
        b.seat_capacity, b.amenities::jsonb AS amenities, b.image_url,
        
        -- Availability (subquery for booked/unavailable seats)
        (
          SELECT COUNT(*) 
          FROM bookings bk 
          JOIN booking_passengers bp ON bk.booking_id = bp.booking_id 
          WHERE bk.trip_id = t.trip_id AND (
            bk.status = 'confirmed' OR 
            (bk.status = 'pending' AND bk.locked_until > CURRENT_TIMESTAMP)
          )
        ) as booked_seats
        
      FROM trips t
      JOIN routes r ON t.route_id = r.route_id
      JOIN buses b ON t.bus_id = b.bus_id
      JOIN operators o ON b.operator_id = o.operator_id
      JOIN bus_models bm ON b.bus_model_id = bm.bus_model_id
    `;
  }

  async _getRouteStops(route_id) {
    const query = `
      SELECT stop_id, stop_name, address, sequence, arrival_offset_minutes
      FROM route_stops
      WHERE route_id = $1
      ORDER BY sequence
    `;
    const result = await pool.query(query, [route_id]);
    return result.rows.map((row) => ({
      stop_id: row.stop_id,
      stop_name: row.stop_name,
      address: row.address,
      sequence: parseInt(row.sequence),
      arrival_offset_minutes: parseInt(row.arrival_offset_minutes),
    }));
  }
  async _getPointsForTrip(trip_id, route_id, departure_time) {
    // Route-level points: query `route_points` (canonical route-level pickup/dropoff offsets)
    const routePointsQuery = `
      SELECT point_id, name, address, departure_offset_minutes, arrival_offset_minutes, is_pickup, is_dropoff
      FROM route_points
      WHERE route_id = $1
      ORDER BY sequence
    `;
    const routePointsRes = await pool.query(routePointsQuery, [route_id]);

    if (routePointsRes.rowCount > 0) {
      const rows = routePointsRes.rows;

      // Compute absolute timestamptz for each point using departure_time + appropriate offset minutes
      // For pickups prefer `departure_offset_minutes`; for dropoffs prefer `arrival_offset_minutes`.
      // If a point is both pickup and dropoff we compute both times separately.
      const points = rows.map((r) => {
        const depOffset = parseInt(r.departure_offset_minutes ?? 0, 10);
        //const arrOffset = parseInt(r.arrival_offset_minutes ?? r.departure_offset_minutes ?? 0, 10);

        let pickupTimeIso = null;
        let dropoffTimeIso = null;
        try {
          const base = new Date(departure_time);
          const t1 = new Date(base);
          t1.setMinutes(t1.getMinutes() + depOffset);
          pickupTimeIso = t1.toISOString();

          const t2 = new Date(base);
          t2.setMinutes(t2.getMinutes() + depOffset);
          dropoffTimeIso = t2.toISOString();
        } catch (e) {
          // keep nulls if parsing fails
        }

        return {
          point_id: r.point_id,
          name: r.name,
          address: r.address,
          pickup_time: pickupTimeIso,
          dropoff_time: dropoffTimeIso,
          is_pickup: r.is_pickup,
          is_dropoff: r.is_dropoff,
        };
      });

      const pickup = points
        .filter((p) => p.is_pickup)
        .map((p) => ({
          point_id: p.point_id,
          name: p.name,
          address: p.address,
          time: p.pickup_time,
        }));

      const dropoff = points
        .filter((p) => p.is_dropoff)
        .map((p) => ({
          point_id: p.point_id,
          name: p.name,
          address: p.address,
          time: p.dropoff_time,
        }));

      return { pickup_points: pickup, dropoff_points: dropoff };
    }

    // If no route_points defined, fallback to existing route_stops behaviour (compute from offsets)
    console.log(
      `[TripRepository] No route_points for route_id=${route_id}, falling back to route_stops`
    );
    const fallbackQuery = `
      SELECT 
        stop_id as point_id, stop_name as name, address, 
        ($1::timestamptz + INTERVAL '1 minute' * arrival_offset_minutes) AS time
      FROM route_stops 
      WHERE route_id = $2
      ORDER BY sequence
    `;
    const result = await pool.query(fallbackQuery, [departure_time, route_id]);
    const points = result.rows.map((row) => ({
      point_id: row.point_id,
      name: row.name,
      address: row.address,
      time: row.time ? row.time.toISOString() : null,
    }));

    return {
      pickup_points: points.slice(0, Math.floor(points.length / 2)),
      dropoff_points: points.slice(Math.floor(points.length / 2)),
    };
  }

  // Helper mapping từ DB Row sang Trip interface (snake_case)
  async _mapRowToTrip(row) {
    if (!row) return null;

    const { pickup_points, dropoff_points } = await this._getPointsForTrip(
      row.trip_id,
      row.route_id,
      row.departure_time
    );

    const route_stops = await this._getRouteStops(row.route_id);

    const total_seats = parseInt(row.seat_capacity);
    const booked_seats = parseInt(row.booked_seats || 0);
    const available_seats = total_seats - booked_seats;

    // Tính duration
    const dep_time = new Date(row.departure_time);
    const arr_time = new Date(row.arrival_time);
    const duration = Math.round((arr_time - dep_time) / 60000);

    // Parse bus images
    let image_urls = [];
    if (row.image_url) {
      if (Array.isArray(row.image_url)) {
        image_urls = row.image_url.filter((url) => url);
      } else if (typeof row.image_url === 'string') {
        try {
          const parsed = JSON.parse(row.image_url);
          image_urls = Array.isArray(parsed) ? parsed.filter((url) => url) : [row.image_url];
        } catch {
          image_urls = [row.image_url];
        }
      }
    }

    return {
      trip_id: row.trip_id,
      route: {
        route_id: row.route_id,
        origin: row.origin,
        destination: row.destination,
        distance_km: parseFloat(row.distance_km),
        estimated_minutes: parseInt(row.estimated_minutes),
      },
      operator: {
        operator_id: row.operator_id,
        name: row.operator_name,
        rating: parseFloat(row.operator_rating || 0),
        logo: row.operator_logo,
      },
      bus: {
        bus_id: row.bus_id,
        model: row.bus_model,
        plate_number: row.plate_number,
        seat_capacity: total_seats,
        bus_type: row.bus_type,
        amenities: row.amenities || [],
        image_urls: image_urls,
      },
      schedule: {
        departure_time: row.departure_time.toISOString(),
        arrival_time: row.arrival_time.toISOString(),
        duration,
      },
      pricing: {
        base_price: parseFloat(row.base_price),
        currency: 'VND', // Mặc định
        service_fee: 0, // Mặc định nếu thiếu
      },
      availability: {
        total_seats,
        available_seats: available_seats > 0 ? available_seats : 0,
        occupancy_rate: total_seats > 0 ? parseFloat((booked_seats / total_seats).toFixed(2)) : 0,
      },
      bookings: booked_seats,
      policies: row.policies || {
        cancellation_policy: 'Standard cancellation',
        modification_policy: 'Flexible',
        refund_policy: 'Refundable up to 24h',
      },
      pickup_points,
      dropoff_points,
      route_stops,
      status: row.status, // Return actual status from database
    };
  }

  async create(trip_data) {
    const query = `
      INSERT INTO trips (route_id, bus_id, departure_time, arrival_time, base_price, policies, status)
      VALUES ($1, $2, $3, $4, $5, $6::jsonb, 'scheduled')
      RETURNING *
    `;
    const values = [
      trip_data.route_id,
      trip_data.bus_id,
      trip_data.departure_time,
      trip_data.arrival_time,
      trip_data.base_price,
      trip_data.policies || {},
    ];
    const result = await pool.query(query, values);

    return await this._mapRowToTrip(result.rows[0]);
  }

  async update(id, trip_data) {
    const fields = [];
    const values = [];
    let index = 1;

    if (trip_data.departure_time) {
      fields.push(`departure_time = $${index++}`);
      values.push(trip_data.departure_time);
    }
    if (trip_data.arrival_time) {
      fields.push(`arrival_time = $${index++}`);
      values.push(trip_data.arrival_time);
    }
    if (trip_data.base_price) {
      fields.push(`base_price = $${index++}`);
      values.push(trip_data.base_price);
    }
    if (trip_data.bus_id) {
      fields.push(`bus_id = $${index++}`);
      values.push(trip_data.bus_id);
    }
    if (trip_data.policies) {
      fields.push(`policies = $${index++}::jsonb`);
      values.push(trip_data.policies);
    }
    if (trip_data.status) {
      fields.push(`status = $${index++}`);
      values.push(trip_data.status);
    }

    if (fields.length === 0) return await this.findById(id);

    const query = `UPDATE trips SET ${fields.join(', ')}, updated_at = NOW() WHERE trip_id = $${index} RETURNING trip_id`;
    values.push(id);

    const result = await pool.query(query, values);

    if (result.rowCount === 0) return null;

    // Fetch the updated trip with all relationships
    return await this.findById(id);
  }

  async findById(id) {
    const query = `${this._getSelectClause()} WHERE t.trip_id = $1`;
    const result = await pool.query(query, [id]);
    return this._mapRowToTrip(result.rows[0]);
  }

  /**
   * Get all trips with admin filtering, searching, sorting, and pagination
   * Supports: status, route_id, bus_id, operator_id filters
   * Supports: search in route origin/destination
   * Supports: date range filtering by departure_time
   * Supports: sorting by departure_time, bookings, created_at, price
   */
  async findAll({
    limit = 20,
    offset = 0,
    status,
    route_id,
    bus_id,
    operator_id,
    license_plate,
    search,
    departure_date_from,
    departure_date_to,
    sort_by = 'departure_time',
    sort_order = 'desc',
  } = {}) {
    try {
      let countQuery = `SELECT COUNT(*) as total FROM trips t 
        JOIN routes r ON t.route_id = r.route_id
        JOIN buses b ON t.bus_id = b.bus_id
        JOIN operators o ON b.operator_id = o.operator_id
        JOIN bus_models bm ON b.bus_model_id = bm.bus_model_id
      LEFT JOIN (SELECT bk.trip_id, COUNT(*) as booking_count FROM bookings bk JOIN booking_passengers bp ON bk.booking_id = bp.booking_id WHERE bk.status = 'confirmed' GROUP BY bk.trip_id) bk ON t.trip_id = bk.trip_id`;

      let query = `SELECT
        t.trip_id, t.departure_time, t.arrival_time, t.base_price, t.status, t.policies::jsonb AS policies, t.created_at,
        r.route_id, r.origin, r.destination, r.distance_km, r.estimated_minutes,
        o.operator_id, o.name as operator_name, o.logo_url as operator_logo,
        b.bus_id, b.plate_number, b.type as bus_type, bm.name as bus_model,
        b.seat_capacity, b.amenities::jsonb AS amenities,
        COALESCE(bk.booking_count, 0) as booked_seats
      FROM trips t
      JOIN routes r ON t.route_id = r.route_id
      JOIN buses b ON t.bus_id = b.bus_id
      JOIN operators o ON b.operator_id = o.operator_id
      JOIN bus_models bm ON b.bus_model_id = bm.bus_model_id
      LEFT JOIN (SELECT bk.trip_id, COUNT(*) as booking_count FROM bookings bk JOIN booking_passengers bp ON bk.booking_id = bp.booking_id WHERE bk.status = 'confirmed' GROUP BY bk.trip_id) bk ON t.trip_id = bk.trip_id`;

      const values = [];
      let index = 1;

      // Build WHERE clause
      const whereConditions = [];

      if (status) {
        whereConditions.push(`t.status = $${index}`);
        values.push(status);
        index++;
      }

      if (route_id) {
        whereConditions.push(`t.route_id = $${index}`);
        values.push(route_id);
        index++;
      }

      if (bus_id) {
        whereConditions.push(`t.bus_id = $${index}`);
        values.push(bus_id);
        index++;
      }

      if (operator_id) {
        whereConditions.push(`o.operator_id = $${index}`);
        values.push(operator_id);
        index++;
      }

      if (license_plate) {
        whereConditions.push(`UPPER(b.plate_number) LIKE UPPER($${index})`);
        values.push(`%${license_plate}%`);
        index++;
      }

      if (search) {
        // Search in route origin and destination
        whereConditions.push(`(
          UPPER(r.origin) LIKE UPPER($${index}) OR
          UPPER(r.destination) LIKE UPPER($${index})
        )`);
        values.push(`%${search}%`);
        index++;
      }

      if (departure_date_from) {
        whereConditions.push(`t.departure_time >= $${index}`);
        values.push(departure_date_from);
        index++;
      }

      if (departure_date_to) {
        whereConditions.push(`t.departure_time <= $${index}`);
        values.push(departure_date_to);
        index++;
      }

      if (whereConditions.length > 0) {
        const whereClause = ` WHERE ${whereConditions.join(' AND ')}`;
        countQuery += whereClause;
        query += whereClause;
      }

      // Get total count
      const countResult = await pool.query(countQuery, values);
      const total = parseInt(countResult.rows[0].total);

      // Build ORDER BY clause
      let orderBy = 't.departure_time DESC, t.trip_id DESC'; // default
      if (sort_by === 'departure_time') {
        orderBy = `t.departure_time ${sort_order === 'asc' ? 'ASC' : 'DESC'}, t.trip_id DESC`;
      } else if (sort_by === 'bookings') {
        orderBy = `COALESCE(bk.booking_count, 0) ${sort_order === 'asc' ? 'ASC' : 'DESC'}, t.trip_id DESC`;
      } else if (sort_by === 'created_at') {
        orderBy = `t.created_at ${sort_order === 'asc' ? 'ASC' : 'DESC'}, t.trip_id DESC`;
      } else if (sort_by === 'price') {
        orderBy = `t.base_price ${sort_order === 'asc' ? 'ASC' : 'DESC'}, t.trip_id DESC`;
      }

      // Add ORDER BY, LIMIT, OFFSET with correct parameter indices
      const limitIndex = index;
      const offsetIndex = index + 1;
      query += ` ORDER BY ${orderBy} LIMIT $${limitIndex} OFFSET $${offsetIndex}`;
      values.push(limit, offset);

      const result = await pool.query(query, values);

      // Map all rows to TripData format
      const trips = await Promise.all(result.rows.map((row) => this._mapRowToTrip(row)));

      return {
        data: trips,
        total: total,
        limit: limit,
        offset: offset,
      };
    } catch (err) {
      console.error('Error in findAll trips:', err);
      throw err;
    }
  }

  async checkOverlap(bus_id, departure_time, arrival_time, exclude_trip_id = null) {
    let query = `
      SELECT COUNT(*) FROM trips 
      WHERE bus_id = $1 
      AND status = 'active'
      AND departure_time < $3 AND arrival_time > $2
    `;
    const values = [bus_id, departure_time, arrival_time];
    if (exclude_trip_id) {
      query += ` AND trip_id != $4`;
      values.push(exclude_trip_id);
    }
    const result = await pool.query(query, values);
    return parseInt(result.rows[0].count) > 0;
  }

  async search(filters) {
    const {
      origin,
      destination,
      date,
      passengers,
      departureTime,
      minPrice,
      maxPrice,
      operator,
      busType,
      amenity,
      seatLocation,
      minRating,
      minSeats,
      sort = 'default',
      limit = 10,
      page = 1,
      // flexibleDays,
      // direction = 'next',
    } = filters;

    const offset = (page - 1) * limit;
    const values = [];
    let index = 1;
    let where_clauses = [`t.status IN ('scheduled', 'active')`];

    // Build filters with advanced search capabilities
    if (origin) {
      // Use multi-strategy search:
      // 1. Full-text search with tsvector (fastest, uses GIN index)
      // 2. Unaccented ILIKE search (handles partial matches)
      // 3. Fuzzy similarity search (handles typos)
      where_clauses.push(`(
        r.origin_tsvector @@ to_tsquery('simple', immutable_unaccent($${index})) OR
        immutable_unaccent(r.origin) ILIKE immutable_unaccent($${index + 1}) OR
        similarity(immutable_unaccent(r.origin), immutable_unaccent($${index + 2})) > 0.3
      )`);
      values.push(origin.trim().replace(/\s+/g, ' & ')); // Full-text query
      values.push(`%${origin}%`); // ILIKE pattern
      values.push(origin); // Similarity comparison
      index += 3;
    }
    if (destination) {
      // Same multi-strategy search for destination
      where_clauses.push(`(
        r.destination_tsvector @@ to_tsquery('simple', immutable_unaccent($${index})) OR
        immutable_unaccent(r.destination) ILIKE immutable_unaccent($${index + 1}) OR
        similarity(immutable_unaccent(r.destination), immutable_unaccent($${index + 2})) > 0.3
      )`);
      values.push(destination.trim().replace(/\s+/g, ' & ')); // Full-text query
      values.push(`%${destination}%`); // ILIKE pattern
      values.push(destination); // Similarity comparison
      index += 3;
    }
    // if (date) {
    //   if (flexibleDays && flexibleDays > 0) {
    //     // Search within date range based on direction
    //     const startDate = new Date(date);
    //     const endDate = new Date(date);
    //     if (direction === 'previous') {
    //       startDate.setDate(startDate.getDate() - flexibleDays);
    //       endDate.setDate(endDate.getDate());
    //     } else {
    //       // next or default
    //       startDate.setDate(startDate.getDate());
    //       endDate.setDate(endDate.getDate() + flexibleDays);
    //     }
    //     where_clauses.push(
    //       `DATE(t.departure_time) >= $${index++} AND DATE(t.departure_time) <= $${index++}`
    //     );
    //     values.push(startDate.toISOString().split('T')[0]);
    //     values.push(endDate.toISOString().split('T')[0]);
    //   } else {
    //     where_clauses.push(`DATE(t.departure_time) = $${index++}`);
    //     values.push(date);
    //   }
    // }
    if (date) {
      where_clauses.push(`DATE(t.departure_time) = $${index++}`);
      values.push(date);
    }
    if (passengers !== undefined && passengers > 0) {
      where_clauses.push(`(b.seat_capacity - COALESCE((
        SELECT COUNT(*) 
        FROM bookings bk 
        JOIN booking_passengers bp ON bk.booking_id = bp.booking_id 
        WHERE bk.trip_id = t.trip_id AND (
          bk.status = 'confirmed' OR 
          (bk.status = 'pending' AND bk.locked_until > CURRENT_TIMESTAMP)
        )
      ), 0)) >= $${index++}`);
      values.push(passengers);
    }
    if (minPrice !== undefined && minPrice > 0) {
      where_clauses.push(`t.base_price >= $${index++}`);
      values.push(minPrice);
    }
    if (maxPrice !== undefined && maxPrice < 5000000) {
      where_clauses.push(`t.base_price <= $${index++}`);
      values.push(maxPrice);
    }
    if (departureTime) {
      const timeSlots = Array.isArray(departureTime) ? departureTime : [departureTime];
      const timeConditions = [];
      timeSlots.forEach((slot) => {
        switch (slot) {
          case 'morning':
            timeConditions.push(
              `EXTRACT(HOUR FROM t.departure_time AT TIME ZONE '${TIMEZONE_CONFIG.DEFAULT_TIMEZONE}') BETWEEN 6 AND 11`
            );
            break;
          case 'afternoon':
            timeConditions.push(
              `EXTRACT(HOUR FROM t.departure_time AT TIME ZONE '${TIMEZONE_CONFIG.DEFAULT_TIMEZONE}') BETWEEN 12 AND 17`
            );
            break;
          case 'evening':
            timeConditions.push(
              `EXTRACT(HOUR FROM t.departure_time AT TIME ZONE '${TIMEZONE_CONFIG.DEFAULT_TIMEZONE}') BETWEEN 18 AND 23`
            );
            break;
          case 'night':
            timeConditions.push(
              `EXTRACT(HOUR FROM t.departure_time AT TIME ZONE '${TIMEZONE_CONFIG.DEFAULT_TIMEZONE}') BETWEEN 0 AND 5`
            );
            break;
        }
      });
      if (timeConditions.length > 0) {
        where_clauses.push(`(${timeConditions.join(' OR ')})`);
      }
    }
    if (operator) {
      const operators = Array.isArray(operator) ? operator : [operator];
      where_clauses.push(`o.name = ANY($${index++})`);
      values.push(operators);
    }
    if (busType) {
      const busTypes = Array.isArray(busType) ? busType : [busType];
      where_clauses.push(`b.type = ANY($${index++})`);
      values.push(busTypes);
    }
    if (amenity) {
      let amenities;
      if (Array.isArray(amenity)) {
        amenities = amenity;
      } else if (typeof amenity === 'string') {
        amenities = amenity.split(',').map((s) => s.trim());
      } else {
        amenities = [amenity];
      }
      // Check if bus amenities JSONB array contains ANY of the requested amenities
      const amenityConditions = amenities.map((_, i) => `b.amenities ? $${index + i}`).join(' OR ');
      where_clauses.push(`(${amenityConditions})`);
      amenities.forEach((amenity) => values.push(amenity));
      index += amenities.length;
    }
    if (seatLocation) {
      let locations;
      if (Array.isArray(seatLocation)) {
        locations = seatLocation;
      } else if (typeof seatLocation === 'string') {
        locations = seatLocation.split(',').map((s) => s.trim());
      } else {
        locations = [seatLocation];
      }
      // Check if bus has available seats in the requested positions for this trip
      where_clauses.push(`EXISTS (
        SELECT 1 FROM seats s 
        WHERE s.bus_id = b.bus_id 
        AND s.position = ANY($${index++}) 
        AND s.is_active = true
        AND NOT EXISTS (
          SELECT 1 FROM booking_passengers bp 
          JOIN bookings bk ON bp.booking_id = bk.booking_id 
          WHERE bp.seat_code = s.seat_code 
          AND bk.trip_id = t.trip_id 
          AND (
            bk.status = 'confirmed' OR 
            (bk.status = 'pending' AND bk.locked_until > CURRENT_TIMESTAMP)
          )
        )
      )`);
      values.push(locations);
    }
    if (minRating !== undefined && minRating > 0) {
      where_clauses.push(`COALESCE((
        SELECT AVG(rating.overall_rating) 
        FROM ratings rating 
        WHERE rating.operator_id = o.operator_id AND rating.is_approved = true
      ), 0) >= $${index++}`);
      values.push(minRating);
    }
    if (minSeats !== undefined && minSeats > 0) {
      // Filter trips that have at least 'minSeats' seats available
      where_clauses.push(`(b.seat_capacity - COALESCE((
        SELECT COUNT(*) 
        FROM bookings bk 
        JOIN booking_passengers bp ON bk.booking_id = bp.booking_id 
        WHERE bk.trip_id = t.trip_id AND (
          bk.status = 'confirmed' OR 
          (bk.status = 'pending' AND bk.locked_until > CURRENT_TIMESTAMP)
        )
      ), 0)) >= $${index++}`);
      values.push(minSeats);
    }

    // Sort mapping
    const sort_mapping = {
      default: 't.departure_time ASC',
      price_asc: 't.base_price ASC',
      price_desc: 't.base_price DESC',
      time_asc: 't.departure_time ASC',
      time_desc: 't.departure_time DESC',
      departure_asc: 't.departure_time ASC',
      departure_desc: 't.departure_time DESC',
      duration_asc: '(t.arrival_time - t.departure_time) ASC',
      duration_desc: '(t.arrival_time - t.departure_time) DESC',
      rating_desc: 'o.rating DESC',
    };
    // Normalize sort parameter (convert hyphens to underscores and remove :number suffix)
    const normalizedSort = (sort || 'default').replace(/-/g, '_').replace(/:\d+$/, '');
    const order_by = sort_mapping[normalizedSort] || 't.departure_time ASC';

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM trips t
      JOIN routes r ON t.route_id = r.route_id
      JOIN buses b ON t.bus_id = b.bus_id
      JOIN operators o ON b.operator_id = o.operator_id
      WHERE ${where_clauses.join(' AND ')}
    `;

    const countResult = await pool.query(countQuery, values);
    const totalCount = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(totalCount / limit);

    // Get paginated results
    const query = `
      ${this._getSelectClause()}
      WHERE ${where_clauses.join(' AND ')}
      ORDER BY ${order_by}
      LIMIT $${index++} OFFSET $${index++}
    `;
    values.push(limit, offset);

    const result = await pool.query(query, values);

    // Map tất cả rows (parallel)
    const trips = await Promise.all(result.rows.map((row) => this._mapRowToTrip(row)));

    return {
      trips,
      totalCount,
      page,
      totalPages,
      limit,
    };
  }

  async softDelete(id) {
    const query = `UPDATE trips SET status = 'cancelled', updated_at = NOW() WHERE trip_id = $1 RETURNING *`;
    const result = await pool.query(query, [id]);
    if (result.rowCount === 0) return null;
    return await this._mapRowToTrip(result.rows[0]);
  }

  async getBookingsForTrip(tripId) {
    const query = `
      SELECT
        b.booking_id,
        b.booking_reference,
        b.contact_email,
        b.contact_phone,
        json_agg(
          json_build_object(
            'ticket_id', bp.ticket_id,
            'full_name', bp.full_name,
            'seat_code', bp.seat_code,
            'boarding_status', bp.boarding_status,
            'boarded_at', bp.boarded_at,
            'boarded_by', bp.boarded_by
          )
        ) as passengers
      FROM bookings b
      LEFT JOIN booking_passengers bp ON b.booking_id = bp.booking_id
      WHERE b.trip_id = $1 AND b.status = 'confirmed'
      GROUP BY b.booking_id, b.booking_reference, b.contact_email, b.contact_phone
      ORDER BY b.created_at DESC
    `;

    const result = await pool.query(query, [tripId]);
    return result.rows;
  }

  async getAlternativeTrips(tripId) {
    // First get the cancelled trip details
    const cancelledTrip = await this.findById(tripId);
    if (!cancelledTrip) return [];

    const query = `
      SELECT
        t.trip_id,
        t.departure_time,
        t.arrival_time,
        t.base_price as price,
        t.status,
        r.origin,
        r.destination,
        r.estimated_minutes,
        o.name as operator_name,
        bm.name as bus_model,
        b.license_plate
      FROM trips t
      JOIN routes r ON t.route_id = r.route_id
      JOIN buses b ON t.bus_id = b.bus_id
      JOIN bus_models bm ON b.bus_model_id = bm.bus_model_id
      JOIN operators o ON b.operator_id = o.operator_id
      WHERE t.route_id = $1
        AND t.status IN ('scheduled', 'in_progress')
        AND t.trip_id != $2
        AND DATE(t.departure_time) >= DATE($3)
        AND DATE(t.departure_time) <= DATE($3) + INTERVAL '7 days'
      ORDER BY t.departure_time ASC
      LIMIT 5
    `;

    const result = await pool.query(query, [
      cancelledTrip.route.route_id,
      tripId,
      cancelledTrip.schedule.departure_time,
    ]);

    return result.rows.map((trip) => ({
      tripId: trip.trip_id,
      departureTime: trip.departure_time,
      arrivalTime: trip.arrival_time,
      price: trip.price,
      operatorName: trip.operator_name,
      busModel: trip.bus_model,
      licensePlate: trip.license_plate,
      fromLocation: trip.origin,
      toLocation: trip.destination,
    }));
  }

  /**
   * Autocomplete/suggest locations for origin, destination, route stops, and dropoff points
   * Uses full-text search, unaccent, and fuzzy matching
   * @param {string} query - Search query
   * @param {string} type - 'origin', 'destination', 'both', 'stop', 'dropoff_point', or 'all'
   * @param {number} limit - Maximum number of results
   * @returns {Promise<Array>} Array of location suggestions
   */
  async autocompleteLocations(query, type = 'both', limit = 10) {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const searchQuery = query.trim();
    const tsQuery = searchQuery.replace(/\s+/g, ' & ');

    let locationQuery = '';

    if (type === 'both') {
      // Search origin, destination, route stops, and dropoff points
      locationQuery = `
        WITH origin_matches AS (
          SELECT DISTINCT
            r.origin as location,
            'origin' as location_type,
            ts_rank(r.origin_tsvector, to_tsquery('simple', immutable_unaccent($1))) as rank,
            similarity(immutable_unaccent(r.origin), immutable_unaccent($2)) as sim_score,
            r.origin,
            r.destination
          FROM routes r
          WHERE r.origin_tsvector @@ to_tsquery('simple', immutable_unaccent($1))
             OR immutable_unaccent(r.origin) ILIKE immutable_unaccent($3)
             OR similarity(immutable_unaccent(r.origin), immutable_unaccent($2)) > 0.3
        ),
        destination_matches AS (
          SELECT DISTINCT
            r.destination as location,
            'destination' as location_type,
            ts_rank(r.destination_tsvector, to_tsquery('simple', immutable_unaccent($1))) as rank,
            similarity(immutable_unaccent(r.destination), immutable_unaccent($2)) as sim_score,
            r.origin,
            r.destination
          FROM routes r
          WHERE r.destination_tsvector @@ to_tsquery('simple', immutable_unaccent($1))
             OR immutable_unaccent(r.destination) ILIKE immutable_unaccent($3)
             OR similarity(immutable_unaccent(r.destination), immutable_unaccent($2)) > 0.3
        ),
        stop_matches AS (
          SELECT DISTINCT
            rs.stop_name as location,
            'stop' as location_type,
            0 as rank,
            similarity(immutable_unaccent(rs.stop_name), immutable_unaccent($2)) as sim_score,
            r.origin,
            r.destination
          FROM route_stops rs
          JOIN routes r ON rs.route_id = r.route_id
          WHERE immutable_unaccent(rs.stop_name) ILIKE immutable_unaccent($3)
             OR similarity(immutable_unaccent(rs.stop_name), immutable_unaccent($2)) > 0.3
        ),
        dropoff_point_matches AS (
          SELECT DISTINCT
            rp.name as location,
            'dropoff_point' as location_type,
            0 as rank,
            similarity(immutable_unaccent(rp.name), immutable_unaccent($2)) as sim_score,
            r.origin,
            r.destination
          FROM route_points rp
          JOIN routes r ON rp.route_id = r.route_id
          WHERE rp.is_dropoff = true
            AND (immutable_unaccent(rp.name) ILIKE immutable_unaccent($3)
             OR similarity(immutable_unaccent(rp.name), immutable_unaccent($2)) > 0.3)
        ),
        all_matches AS (
          SELECT * FROM origin_matches
          UNION
          SELECT * FROM destination_matches
          UNION
          SELECT * FROM stop_matches
          UNION
          SELECT * FROM dropoff_point_matches
        )
        SELECT 
          location,
          location_type,
          MAX(rank) as max_rank,
          MAX(sim_score) as max_similarity,
          (array_agg(origin))[1] as origin,
          (array_agg(destination))[1] as destination
        FROM all_matches
        GROUP BY location, location_type
        ORDER BY max_rank DESC, max_similarity DESC
        LIMIT $4
      `;
    } else if (type === 'origin') {
      locationQuery = `
        SELECT DISTINCT
          r.origin as location,
          'origin' as location_type,
          ts_rank(r.origin_tsvector, to_tsquery('simple', immutable_unaccent($1))) as max_rank,
          similarity(immutable_unaccent(r.origin), immutable_unaccent($2)) as max_similarity
        FROM routes r
        WHERE r.origin_tsvector @@ to_tsquery('simple', immutable_unaccent($1))
           OR immutable_unaccent(r.origin) ILIKE immutable_unaccent($3)
           OR similarity(immutable_unaccent(r.origin), immutable_unaccent($2)) > 0.3
        ORDER BY max_rank DESC, max_similarity DESC
        LIMIT $4
      `;
    } else if (type === 'destination') {
      locationQuery = `
        SELECT DISTINCT
          r.destination as location,
          'destination' as location_type,
          ts_rank(r.destination_tsvector, to_tsquery('simple', immutable_unaccent($1))) as max_rank,
          similarity(immutable_unaccent(r.destination), immutable_unaccent($2)) as max_similarity
        FROM routes r
        WHERE r.destination_tsvector @@ to_tsquery('simple', immutable_unaccent($1))
           OR immutable_unaccent(r.destination) ILIKE immutable_unaccent($3)
           OR similarity(immutable_unaccent(r.destination), immutable_unaccent($2)) > 0.3
        ORDER BY max_rank DESC, max_similarity DESC
        LIMIT $4
      `;
    } else if (type === 'stop') {
      locationQuery = `
        SELECT DISTINCT
          rs.stop_name as location,
          'stop' as location_type,
          0 as max_rank,
          similarity(immutable_unaccent(rs.stop_name), immutable_unaccent($2)) as max_similarity
        FROM route_stops rs
        WHERE immutable_unaccent(rs.stop_name) ILIKE immutable_unaccent($3)
           OR similarity(immutable_unaccent(rs.stop_name), immutable_unaccent($2)) > 0.3
        ORDER BY max_similarity DESC
        LIMIT $4
      `;
    } else if (type === 'dropoff_point') {
      locationQuery = `
        SELECT DISTINCT
          rp.name as location,
          'dropoff_point' as location_type,
          0 as max_rank,
          similarity(immutable_unaccent(rp.name), immutable_unaccent($2)) as max_similarity
        FROM route_points rp
        WHERE rp.is_dropoff = true
          AND (immutable_unaccent(rp.name) ILIKE immutable_unaccent($3)
           OR similarity(immutable_unaccent(rp.name), immutable_unaccent($2)) > 0.3)
        ORDER BY max_similarity DESC
        LIMIT $4
      `;
    } else if (type === 'all') {
      // Include all types: origin, destination, stops, dropoff points
      locationQuery = `
        WITH origin_matches AS (
          SELECT DISTINCT
            r.origin as location,
            'origin' as location_type,
            ts_rank(r.origin_tsvector, to_tsquery('simple', immutable_unaccent($1))) as rank,
            similarity(immutable_unaccent(r.origin), immutable_unaccent($2)) as sim_score,
            r.origin,
            r.destination
          FROM routes r
          WHERE r.origin_tsvector @@ to_tsquery('simple', immutable_unaccent($1))
             OR immutable_unaccent(r.origin) ILIKE immutable_unaccent($3)
             OR similarity(immutable_unaccent(r.origin), immutable_unaccent($2)) > 0.3
        ),
        destination_matches AS (
          SELECT DISTINCT
            r.destination as location,
            'destination' as location_type,
            ts_rank(r.destination_tsvector, to_tsquery('simple', immutable_unaccent($1))) as rank,
            similarity(immutable_unaccent(r.destination), immutable_unaccent($2)) as sim_score,
            r.origin,
            r.destination
          FROM routes r
          WHERE r.destination_tsvector @@ to_tsquery('simple', immutable_unaccent($1))
             OR immutable_unaccent(r.destination) ILIKE immutable_unaccent($3)
             OR similarity(immutable_unaccent(r.destination), immutable_unaccent($2)) > 0.3
        ),
        stop_matches AS (
          SELECT DISTINCT
            rs.stop_name as location,
            'stop' as location_type,
            0 as rank,
            similarity(immutable_unaccent(rs.stop_name), immutable_unaccent($2)) as sim_score,
            r.origin,
            r.destination
          FROM route_stops rs
          JOIN routes r ON rs.route_id = r.route_id
          WHERE immutable_unaccent(rs.stop_name) ILIKE immutable_unaccent($3)
             OR similarity(immutable_unaccent(rs.stop_name), immutable_unaccent($2)) > 0.3
        ),
        dropoff_point_matches AS (
          SELECT DISTINCT
            rp.name as location,
            'dropoff_point' as location_type,
            0 as rank,
            similarity(immutable_unaccent(rp.name), immutable_unaccent($2)) as sim_score,
            r.origin,
            r.destination
          FROM route_points rp
          JOIN routes r ON rp.route_id = r.route_id
          WHERE rp.is_dropoff = true
            AND (immutable_unaccent(rp.name) ILIKE immutable_unaccent($3)
             OR similarity(immutable_unaccent(rp.name), immutable_unaccent($2)) > 0.3)
        ),
        all_matches AS (
          SELECT * FROM origin_matches
          UNION
          SELECT * FROM destination_matches
          UNION
          SELECT * FROM stop_matches
          UNION
          SELECT * FROM dropoff_point_matches
        )
        SELECT 
          location,
          location_type,
          MAX(rank) as max_rank,
          MAX(sim_score) as max_similarity,
          (array_agg(origin))[1] as origin,
          (array_agg(destination))[1] as destination
        FROM all_matches
        GROUP BY location, location_type
        ORDER BY max_rank DESC, max_similarity DESC
        LIMIT $4
      `;
    }

    const result = await pool.query(locationQuery, [
      tsQuery,
      searchQuery,
      `%${searchQuery}%`,
      limit,
    ]);

    return result.rows.map((row) => ({
      location: row.location,
      type: row.location_type,
      relevance: parseFloat(row.max_rank || 0) + parseFloat(row.max_similarity || 0),
      origin: row.origin,
      destination: row.destination,
    }));
  }
}

module.exports = new TripRepository();
