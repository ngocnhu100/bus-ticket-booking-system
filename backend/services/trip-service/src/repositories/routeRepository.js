// repositories/routeRepository.js
const pool = require('../database');

class RouteRepository {
  async create(routeData) {
    const {
      origin,
      destination,
      distance_km,
      estimated_minutes,
      pickup_points,
      dropoff_points,
      route_stops,
    } = routeData;

    // Check for existing route with same origin-destination
    // const checkQuery = `
    //   SELECT route_id FROM routes
    //   WHERE LOWER(origin) = LOWER($1) AND LOWER(destination) = LOWER($2)
    // `;
    // const checkResult = await pool.query(checkQuery, [origin, destination]);
    // if (checkResult.rows.length > 0) {
    //   const error = new Error('A route with this origin and destination already exists');
    //   error.code = 'DUPLICATE_ROUTE';
    //   throw error;
    // }
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Insert the route
      const routeQuery = `
        INSERT INTO routes (origin, destination, distance_km, estimated_minutes)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
      `;
      const routeResult = await client.query(routeQuery, [
        origin,
        destination,
        distance_km,
        estimated_minutes,
      ]);
      const newRoute = routeResult.rows[0];

      // Insert pickup points into route_points table
      if (pickup_points && pickup_points.length > 0) {
        for (let i = 0; i < pickup_points.length; i++) {
          const point = pickup_points[i];
          const pointQuery = `
            INSERT INTO route_points (
              route_id, 
              name, 
              address, 
              sequence, 
              arrival_offset_minutes, 
              departure_offset_minutes,
              is_pickup, 
              is_dropoff
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `;

          // Use departure_offset_minutes directly from frontend
          const departureOffset = point.departure_offset_minutes || 0;
          const arrivalOffset = point.arrival_offset_minutes || departureOffset; // For pickup, arrival defaults to departure

          console.log(
            `[Pickup Point ${i}] Inserting offset - arrival: ${arrivalOffset}, departure: ${departureOffset}`
          );

          await client.query(pointQuery, [
            newRoute.route_id,
            point.name,
            point.address || '',
            i + 1, // sequence starting from 1
            arrivalOffset,
            departureOffset,
            true, // is_pickup
            false, // is_dropoff
          ]);
        }
      }

      // Insert dropoff points into route_points table
      if (dropoff_points && dropoff_points.length > 0) {
        const pickupCount = pickup_points ? pickup_points.length : 0;
        for (let i = 0; i < dropoff_points.length; i++) {
          const point = dropoff_points[i];
          const pointQuery = `
            INSERT INTO route_points (
              route_id, 
              name, 
              address, 
              sequence, 
              arrival_offset_minutes, 
              departure_offset_minutes,
              is_pickup, 
              is_dropoff
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `;

          // Use departure_offset_minutes directly from frontend
          const departureOffset = point.departure_offset_minutes || 0;
          const arrivalOffset = point.arrival_offset_minutes || departureOffset; // For dropoff, arrival defaults to departure

          console.log(
            `[Dropoff Point ${i}] Inserting offset - arrival: ${arrivalOffset}, departure: ${departureOffset}`
          );

          await client.query(pointQuery, [
            newRoute.route_id,
            point.name,
            point.address || '',
            pickupCount + i + 1, // sequence after pickup points
            arrivalOffset,
            departureOffset,
            false, // is_pickup
            true, // is_dropoff
          ]);
        }
      }

      // Insert route stops into route_stops table
      if (route_stops && route_stops.length > 0) {
        for (const stop of route_stops) {
          const stopQuery = `
            INSERT INTO route_stops (
              route_id,
              stop_name,
              sequence,
              arrival_offset_minutes,
              address
            ) VALUES ($1, $2, $3, $4, $5)
          `;

          await client.query(stopQuery, [
            newRoute.route_id,
            stop.stop_name,
            stop.sequence,
            stop.arrival_offset_minutes || 0,
            stop.address || '',
          ]);
        }
      }

      await client.query('COMMIT');
      return newRoute;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async findById(id) {
    const query = 'SELECT * FROM routes WHERE route_id = $1;';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  async findAll({
    limit = 20,
    offset = 0,
    search,
    min_distance,
    max_distance,
    min_duration,
    max_duration,
    origin,
    destination,
  } = {}) {
    let countQuery = `SELECT COUNT(*) as total FROM routes r`;
    let query = `SELECT
      r.route_id,
      r.origin,
      r.destination,
      r.distance_km,
      r.estimated_minutes,
      r.created_at,
      r.updated_at
    FROM routes r`;

    const values = [];
    let index = 1;

    // Build WHERE clause
    const whereConditions = [];

    if (min_distance !== undefined) {
      whereConditions.push(`r.distance_km >= $${index}`);
      values.push(min_distance);
      index++;
    }

    if (max_distance !== undefined) {
      whereConditions.push(`r.distance_km <= $${index}`);
      values.push(max_distance);
      index++;
    }

    if (min_duration !== undefined) {
      whereConditions.push(`r.estimated_minutes >= $${index}`);
      values.push(min_duration);
      index++;
    }

    if (max_duration !== undefined) {
      whereConditions.push(`r.estimated_minutes <= $${index}`);
      values.push(max_duration);
      index++;
    }

    if (origin) {
      whereConditions.push(`UPPER(r.origin) LIKE UPPER($${index})`);
      values.push(`%${origin}%`);
      index++;
    }

    if (destination) {
      whereConditions.push(`UPPER(r.destination) LIKE UPPER($${index})`);
      values.push(`%${destination}%`);
      index++;
    }

    if (search) {
      whereConditions.push(`(
        UPPER(r.origin) LIKE UPPER($${index}) OR
        UPPER(r.destination) LIKE UPPER($${index})
      )`);
      values.push(`%${search}%`);
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

    query += ` ORDER BY r.created_at DESC, r.route_id DESC LIMIT $${index++} OFFSET $${index}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);

    return {
      data: result.rows,
      total: total,
      limit: limit,
      offset: offset,
    };
  }

  async update(id, routeData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update basic route fields
      const fields = [];
      const values = [];
      let idx = 1;

      const allowed = ['origin', 'destination', 'distance_km', 'estimated_minutes'];
      for (const key of allowed) {
        if (routeData[key] !== undefined) {
          fields.push(`${key} = $${idx++}`);
          values.push(routeData[key]);
        }
      }

      if (fields.length > 0) {
        values.push(id);
        const query = `
          UPDATE routes SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
          WHERE route_id = $${idx} RETURNING *;
        `;
        await client.query(query, values);
      }

      // Handle pickup_points update/insert
      if (routeData.pickup_points && routeData.pickup_points.length > 0) {
        // Delete existing pickup points for this route
        await client.query('DELETE FROM route_points WHERE route_id = $1 AND is_pickup = true', [
          id,
        ]);

        // Insert new pickup points with correct sequence
        for (let i = 0; i < routeData.pickup_points.length; i++) {
          const point = routeData.pickup_points[i];
          const pointQuery = `
            INSERT INTO route_points (
              route_id, 
              name, 
              address, 
              sequence, 
              arrival_offset_minutes, 
              departure_offset_minutes,
              is_pickup, 
              is_dropoff
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `;

          const departureOffset = point.departure_offset_minutes || 0;
          const arrivalOffset = point.arrival_offset_minutes || departureOffset;
          const sequence = i + 1; // Auto sequence: 1, 2, 3, ...

          console.log(
            `[Pickup Point ${i}] Updating offset - arrival: ${arrivalOffset}, departure: ${departureOffset}, sequence: ${sequence}`
          );

          await client.query(pointQuery, [
            id,
            point.name,
            point.address || '',
            sequence,
            arrivalOffset,
            departureOffset,
            true, // is_pickup
            false, // is_dropoff
          ]);
        }
      }

      // Handle dropoff_points update/insert
      if (routeData.dropoff_points && routeData.dropoff_points.length > 0) {
        // Delete existing dropoff points for this route
        await client.query('DELETE FROM route_points WHERE route_id = $1 AND is_dropoff = true', [
          id,
        ]);

        // Get current pickup points count to set correct sequence for dropoff
        const pickupCountResult = await client.query(
          'SELECT COUNT(*) as count FROM route_points WHERE route_id = $1 AND is_pickup = true',
          [id]
        );
        const pickupCount = parseInt(pickupCountResult.rows[0].count) || 0;

        // Insert new dropoff points with correct sequence
        for (let i = 0; i < routeData.dropoff_points.length; i++) {
          const point = routeData.dropoff_points[i];
          const pointQuery = `
            INSERT INTO route_points (
              route_id, 
              name, 
              address, 
              sequence, 
              arrival_offset_minutes, 
              departure_offset_minutes,
              is_pickup, 
              is_dropoff
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `;

          const departureOffset = point.departure_offset_minutes || 0;
          const arrivalOffset = point.arrival_offset_minutes || departureOffset;
          const sequence = pickupCount + i + 1; // Auto sequence after pickup points

          console.log(
            `[Dropoff Point ${i}] Updating offset - arrival: ${arrivalOffset}, departure: ${departureOffset}, sequence: ${sequence}`
          );

          await client.query(pointQuery, [
            id,
            point.name,
            point.address || '',
            sequence,
            arrivalOffset,
            departureOffset,
            false, // is_pickup
            true, // is_dropoff
          ]);
        }
      }

      // Handle route_stops update/insert
      if (routeData.route_stops && routeData.route_stops.length >= 0) {
        // Delete existing route stops for this route
        await client.query('DELETE FROM route_stops WHERE route_id = $1', [id]);

        // Insert new route stops if provided
        if (routeData.route_stops.length > 0) {
          for (let i = 0; i < routeData.route_stops.length; i++) {
            const stop = routeData.route_stops[i];
            const stopQuery = `
              INSERT INTO route_stops (
                route_id,
                stop_name,
                sequence,
                arrival_offset_minutes,
                address
              ) VALUES ($1, $2, $3, $4, $5)
            `;

            const sequence = i + 1; // Auto sequence: 1, 2, 3, ...

            console.log(`[Route Stop ${i}] Inserting with sequence: ${sequence}`);

            await client.query(stopQuery, [
              id,
              stop.stop_name,
              sequence,
              stop.arrival_offset_minutes || 0,
              stop.address || '',
            ]);
          }
        }
      }

      await client.query('COMMIT');

      // Return updated route
      const result = await pool.query('SELECT * FROM routes WHERE route_id = $1', [id]);
      return result.rows[0] || null;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async delete(id) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM route_stops WHERE route_id = $1', [id]);
      await client.query('DELETE FROM route_points WHERE route_id = $1', [id]);
      const res = await client.query('DELETE FROM routes WHERE route_id = $1 RETURNING *', [id]);
      await client.query('COMMIT');
      return res.rows[0] || null;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // Get route points (pickup/dropoff points)
  async getRoutePoints(routeId) {
    const query = `
      SELECT 
        point_id,
        route_id,
        name,
        address,
        sequence,
        arrival_offset_minutes,
        departure_offset_minutes,
        is_pickup,
        is_dropoff,
        created_at,
        updated_at
      FROM route_points
      WHERE route_id = $1
      ORDER BY sequence ASC;
    `;
    const result = await pool.query(query, [routeId]);
    return result.rows;
  }

  // Get route stops (without pickup/dropoff flags)
  async getStopsWithTypes(routeId) {
    const query = `
      SELECT
        stop_id,
        route_id,
        stop_name,
        sequence,
        arrival_offset_minutes,
        address,
        created_at,
        updated_at
      FROM route_stops
      WHERE route_id = $1
      ORDER BY sequence ASC;
    `;
    const result = await pool.query(query, [routeId]);
    return result.rows;
  }

  // MỚI: Upsert stop theo cấu trúc DB mới (dùng stop_name + 2 offset)
  async upsertStop(routeId, stopData) {
    const { stop_name, address = '', sequence, arrival_offset_minutes = 0 } = stopData;

    const query = `
      INSERT INTO route_stops (
        route_id,
        stop_name,
        address,
        sequence,
        arrival_offset_minutes
      ) VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (route_id, sequence) DO UPDATE SET
        stop_name = EXCLUDED.stop_name,
        address = EXCLUDED.address,
        arrival_offset_minutes = EXCLUDED.arrival_offset_minutes,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;

    const result = await pool.query(query, [
      routeId,
      stop_name,
      address,
      sequence,
      arrival_offset_minutes,
    ]);
    return result.rows[0];
  }

  // Cập nhật origin/destination từ điểm đầu và cuối (dùng stop_name)
  async updateOriginDestinationFromStops(routeId) {
    const stops = await this.getStopsWithTypes(routeId);
    if (stops.length < 2) return;

    const sorted = stops.sort((a, b) => a.sequence - b.sequence);
    const origin = sorted[0].stop_name;
    const destination = sorted[sorted.length - 1].stop_name;

    await this.update(routeId, { origin, destination });
  }

  // MỚI: Lấy các route phổ biến dựa trên số trip đã đặt
  async getPopularRoutes(limit = 10) {
    const query = `
    SELECT 
      r.route_id,
      r.origin,
      r.destination,
      r.distance_km,
      r.estimated_minutes,
      r.created_at,
      r.updated_at,
      COUNT(t.trip_id) AS total_trips,
      MIN(t.base_price) AS starting_price
    FROM routes r
    LEFT JOIN trips t ON t.route_id = r.route_id 
      AND t.status IN ('scheduled') 
      AND t.departure_time > NOW()
    GROUP BY r.route_id
    ORDER BY total_trips DESC, starting_price ASC NULLS LAST
    LIMIT $1;
  `;

    const result = await pool.query(query, [limit]);
    return result.rows;
  }
}

module.exports = new RouteRepository();
