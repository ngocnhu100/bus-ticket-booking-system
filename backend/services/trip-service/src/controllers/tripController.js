// controllers/tripController.js
const tripService = require('../services/tripService');
const {
  create_trip_schema: createTripSchema,
  update_trip_schema: updateTripSchema,
  search_trip_schema: searchTripSchema,
  admin_create_trip_schema: adminCreateTripSchema,
  admin_update_trip_schema: adminUpdateTripSchema,
} = require('../validators/tripValidators');

class TripController {
  async create(req, res) {
    try {
      // Use admin schema since this endpoint requires admin authorization
      const { error, value } = adminCreateTripSchema.validate(req.body);
      if (error) {
        return res.status(422).json({
          success: false,
          error: { code: 'VAL_001', message: error.details[0].message },
        });
      }

      const trip = await tripService.createTrip(value);
      res.status(201).json({
        success: true,
        data: trip,
        message: 'Trip created successfully',
      });
    } catch (err) {
      const code = err.message.includes('overlap')
        ? 'TRIP_OVERLAP'
        : err.message.includes('not found')
          ? 'RESOURCE_NOT_FOUND'
          : 'TRIP_CREATE_FAILED';

      res.status(409).json({
        success: false,
        error: { code, message: err.message },
      });
    }
  }

  async getById(req, res) {
    try {
      const trip = await tripService.getTripWithDetails(req.params.id);
      if (!trip) {
        return res.status(404).json({
          success: false,
          error: { code: 'TRIP_NOT_FOUND', message: 'Trip not found' },
        });
      }
      res.json({ success: true, data: trip });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        error: { code: 'SYS_ERROR', message: 'Internal Server Error' },
      });
    }
  }

  async update(req, res) {
    try {
      // Use admin schema since this endpoint requires admin authorization
      const { error, value } = adminUpdateTripSchema.validate(req.body);
      if (error) {
        return res.status(422).json({
          success: false,
          error: { code: 'VAL_001', message: error.details[0].message },
        });
      }

      const trip = await tripService.updateTrip(req.params.id, value);
      res.json({
        success: true,
        data: trip,
        message: 'Trip updated successfully',
      });
    } catch (err) {
      if (err.message === 'Trip not found') {
        return res
          .status(404)
          .json({ success: false, error: { code: 'TRIP_NOT_FOUND', message: err.message } });
      }
      const code = err.message.includes('overlap') ? 'TRIP_OVERLAP' : 'TRIP_UPDATE_FAILED';
      res.status(409).json({
        success: false,
        error: { code, message: err.message },
      });
    }
  }

  async delete(req, res) {
    try {
      const result = await tripService.deleteTrip(req.params.id);
      if (!result) {
        return res.status(404).json({
          success: false,
          error: { code: 'TRIP_NOT_FOUND', message: 'Trip not found' },
        });
      }
      res.json({ success: true, message: 'Trip cancelled successfully' });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: { code: 'SYS_ERROR', message: err.message },
      });
    }
  }

  async search(req, res) {
    try {
      const { error, value } = searchTripSchema.validate(req.query);
      if (error) {
        return res.status(422).json({
          success: false,
          error: { code: 'VAL_001', message: error.details[0].message },
        });
      }

      const trips = await tripService.searchTrips(value);

      res.json({
        success: true,
        data: trips,
        meta: {
          limit: value.limit,
          page: value.page,
          count: trips.length,
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        error: { code: 'SYS_ERROR', message: 'Error searching trips' },
      });
    }
  }

  // ========== ADMIN LIST ENDPOINT ==========

  /**
   * Get all trips with admin filtering, searching, sorting, and pagination
   * GET / (Admin endpoint)
   */
  async getAll(req, res) {
    try {
      // Pagination
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      // Filters
      const status = req.query.status;
      const route_id = req.query.route_id;
      const bus_id = req.query.bus_id;
      const operator_id = req.query.operator_id;
      const departure_date_from = req.query.departure_date_from;
      const departure_date_to = req.query.departure_date_to;

      // Search
      const search = req.query.search; // Search in route origin/destination

      // Sorting
      const sort_by = req.query.sort_by || 'departure_time'; // departure_time, bookings, created_at
      const sort_order = req.query.sort_order === 'asc' ? 'asc' : 'desc'; // asc or desc

      // Convert page to offset
      const offset = (page - 1) * limit;

      const result = await tripService.getAllTrips({
        limit,
        offset,
        status,
        route_id,
        bus_id,
        operator_id,
        departure_date_from,
        departure_date_to,
        search,
        sort_by,
        sort_order,
      });

      // Calculate total pages
      const totalPages = Math.ceil(result.total / limit);

      res.json({
        success: true,
        data: {
          trips: result.data,
          total: result.total,
          page,
          limit,
          total_pages: totalPages,
        },
      });
    } catch (err) {
      console.error('Error in getAll trips:', err);
      res.status(500).json({
        success: false,
        error: { code: 'SYS_001', message: 'Error fetching trips list' },
      });
    }
  }

  async getSeats(req, res) {
    try {
      const { id: tripId } = req.params;

      const seatMapData = await tripService.getSeatMap(tripId);

      const transformedSeats = seatMapData.seats.map((seat) => {
        const seatData = {
          seat_id: seat.seat_id,
          seat_code: seat.seat_code,
          row: seat.row,
          column: seat.column,
          seat_type: seat.seat_type,
          position: seat.position,
          price: seat.price,
          status: seat.status,
        };

        if (seat.locked_until) {
          seatData.locked_until = seat.locked_until.toISOString();
          seatData.locked_by = seat.locked_by;
        }

        return seatData;
      });

      const response = {
        success: true,
        data: {
          trip_id: tripId,
          seat_map: {
            layout: seatMapData.layout,
            rows: seatMapData.rows,
            columns: seatMapData.columns,
            driver: seatMapData.driver,
            doors: seatMapData.doors,
            seats: transformedSeats,
          },
          legend: {
            available: 'seat can be selected',
            occupied: 'seat already booked',
            locked: 'seat temporarily reserved by another user',
          },
        },
      };

      res.json(response);
    } catch (err) {
      console.error('TripController.getSeats: Error occurred:', err.message);

      if (err.message === 'Trip not found') {
        return res.status(404).json({
          success: false,
          error: { code: 'TRIP_NOT_FOUND', message: 'Trip not found' },
        });
      }

      if (err.message.includes('Bus layout configuration')) {
        return res.status(500).json({
          success: false,
          error: { code: 'LAYOUT_CONFIG_ERROR', message: err.message },
        });
      }

      res.status(500).json({
        success: false,
        error: { code: 'SYS_ERROR', message: 'Internal Server Error' },
      });
    }
  }

  // ========== ADMIN ENDPOINTS ==========

  /**
   * Assign a bus to a trip
   * POST /trips/:id/assign-bus
   */
  async assignBus(req, res) {
    try {
      const { bus_id } = req.body;
      if (!bus_id) {
        return res.status(422).json({
          success: false,
          error: { code: 'VAL_001', message: 'bus_id is required' },
        });
      }

      const trip = await tripService.updateTrip(req.params.id, { bus_id });
      res.json({
        success: true,
        data: trip,
        message: 'Bus assigned to trip successfully',
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        error: { code: 'SYS_ERROR', message: 'Failed to assign bus' },
      });
    }
  }

  /**
   * Assign a route to a trip
   * POST /trips/:id/assign-route
   */
  async assignRoute(req, res) {
    try {
      const { route_id } = req.body;
      if (!route_id) {
        return res.status(422).json({
          success: false,
          error: { code: 'VAL_001', message: 'route_id is required' },
        });
      }

      const trip = await tripService.updateTrip(req.params.id, { route_id });
      res.json({
        success: true,
        data: trip,
        message: 'Route assigned to trip successfully',
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        error: { code: 'SYS_ERROR', message: 'Failed to assign route' },
      });
    }
  }

  /**
   * Update trip status
   * PATCH /trips/:id/status
   */
  async updateStatus(req, res) {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(422).json({
          success: false,
          error: { code: 'VAL_001', message: 'status is required' },
        });
      }

      const trip = await tripService.updateTrip(req.params.id, { status });
      res.json({
        success: true,
        data: trip,
        message: 'Trip status updated successfully',
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        error: { code: 'SYS_ERROR', message: 'Failed to update status' },
      });
    }
  }

  /**
   * Cancel a trip (with potential refund processing)
   * POST /trips/:id/cancel
   */
  async cancelTrip(req, res) {
    try {
      const { refund_reason } = req.body || {};

      // Update trip status to cancelled
      const trip = await tripService.updateTrip(req.params.id, {
        status: 'cancelled',
      });

      // TODO: Implement refund logic integration with payment service
      // For now, just mark as cancelled and let bookings handle refunds

      res.json({
        success: true,
        data: trip,
        message: 'Trip cancelled successfully. Refunds will be processed.',
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        error: { code: 'SYS_ERROR', message: 'Failed to cancel trip' },
      });
    }
  }
}

module.exports = new TripController();
