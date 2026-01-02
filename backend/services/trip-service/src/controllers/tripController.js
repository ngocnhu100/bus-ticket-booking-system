// controllers/tripController.js
const tripService = require('../services/tripService');
const axios = require('axios');
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

      const trip = await tripService.updateTrip(req.params.id, value, req.headers.authorization);
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
      const tripId = req.params.id;

      // Get trip details and bookings before cancelling
      const trip = await tripService.getTripWithDetails(tripId);
      if (!trip) {
        return res.status(404).json({
          success: false,
          error: { code: 'TRIP_NOT_FOUND', message: 'Trip not found' },
        });
      }

      // Get all confirmed bookings for this trip
      const bookings = await tripService.getBookingsForTrip(tripId);

      // Cancel the trip
      const result = await tripService.deleteTrip(tripId);
      if (!result) {
        return res.status(404).json({
          success: false,
          error: { code: 'TRIP_NOT_FOUND', message: 'Trip not found' },
        });
      }

      // Send notifications to all passengers
      if (bookings && bookings.length > 0) {
        const notificationServiceUrl =
          process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3003';

        for (const booking of bookings) {
          try {
            // Prepare update data for notification
            const updateData = {
              bookingReference: booking.booking_reference,
              updateType: 'cancellation',
              reason: 'Trip cancelled by admin',
              originalDepartureTime: trip.departure_time,
              newDepartureTime: null,
              originalArrivalTime: trip.arrival_time,
              newArrivalTime: null,
              fromLocation: trip.origin,
              toLocation: trip.destination,
              seats: booking.passengers?.map((p) => p.seat_code) || [],
              contactEmail: 'support@quad-n.me',
              contactPhone: '+84-1800-TICKET',
              customerEmail: booking.contact_email,
              customerPhone: booking.contact_phone,
              passengers: booking.passengers || [],
              operatorName: trip.operator_name,
              busModel: trip.bus_model,
              alternatives: [], // Could add alternative trips here
              nextSteps: [
                'Check your email for refund details',
                'Look for alternative trips',
                'Check refund policy',
              ],
            };

            // Send notification
            await axios.post(`${notificationServiceUrl}/notifications/send-trip-update`, {
              email: booking.contact_email,
              updateData,
            });

            console.log(
              `📧 Cancellation notification sent to ${booking.contact_email} for booking ${booking.booking_reference}`
            );
          } catch (notificationError) {
            console.error(
              `⚠️ Failed to send cancellation notification to ${booking.contact_email}:`,
              notificationError.message
            );
            // Don't fail the whole operation if notification fails
          }
        }
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

      const result = await tripService.searchTrips(value);

      res.json({
        success: true,
        data: {
          trips: result.trips,
          totalCount: result.totalCount,
          page: result.page,
          totalPages: result.totalPages,
          limit: result.limit,
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

  /**
   * Autocomplete locations for search (origin, destination, route stops, dropoff points)
   * Supports unaccented, full-text, and fuzzy search
   * GET /trips/autocomplete/locations?q=ha+noi&type=both&limit=10
   */
  async autocompleteLocations(req, res) {
    try {
      const query = req.query.q || req.query.query;
      const type = req.query.type || 'both'; // 'origin', 'destination', 'both', 'stop', 'dropoff_point', 'all'
      const limit = parseInt(req.query.limit) || 10;

      if (!query || query.trim().length < 2) {
        return res.json({
          success: true,
          data: {
            suggestions: [],
            message: 'Query must be at least 2 characters',
          },
        });
      }

      if (!['origin', 'destination', 'both', 'stop', 'dropoff_point', 'all'].includes(type)) {
        return res.status(422).json({
          success: false,
          error: {
            code: 'VAL_001',
            message:
              'Invalid type parameter. Must be "origin", "destination", "both", "stop", "dropoff_point", or "all"',
          },
        });
      }

      const suggestions = await tripService.autocompleteLocations(query, type, limit);

      res.json({
        success: true,
        data: {
          suggestions,
          query,
          type,
        },
      });
    } catch (err) {
      console.error('Autocomplete error:', err);
      res.status(500).json({
        success: false,
        error: { code: 'SYS_ERROR', message: 'Error getting location suggestions' },
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
      const license_plate = req.query.license_plate;
      const departure_date_from = req.query.departure_date_from;
      const departure_date_to = req.query.departure_date_to;

      // Search
      const search = req.query.search; // Search in route origin/destination

      // Sorting
      const sort_by = req.query.sort_by || 'departure_time'; // departure_time, bookings, created_at
      const sort_order = req.query.sort_order === 'asc' ? 'asc' : 'desc'; // asc or desc

      // Convert page to offset
      const offset = (page - 1) * limit;

      const result = await tripService.getAllTripsAdmin({
        limit,
        offset,
        status,
        route_id,
        bus_id,
        operator_id,
        license_plate,
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
            layout_structure: seatMapData.layout_structure, // Add layout_structure
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

      const trip = await tripService.updateTrip(
        req.params.id,
        { status },
        req.headers.authorization
      );
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
   * Mark trip as departed
   * POST /trips/:id/mark-departed
   */
  async markDeparted(req, res) {
    try {
      const trip = await tripService.updateTrip(
        req.params.id,
        {
          status: 'in_progress',
          departure_time: new Date(),
        },
        req.headers.authorization
      );
      res.json({
        success: true,
        data: trip,
        message: 'Trip marked as departed successfully',
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        error: { code: 'SYS_ERROR', message: 'Failed to mark trip as departed' },
      });
    }
  }

  /**
   * Mark trip as arrived
   * POST /trips/:id/mark-arrived
   */
  async markArrived(req, res) {
    try {
      const trip = await tripService.updateTrip(
        req.params.id,
        {
          status: 'completed',
          arrival_time: new Date(),
        },
        req.headers.authorization
      );
      res.json({
        success: true,
        data: trip,
        message: 'Trip marked as arrived successfully',
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        error: { code: 'SYS_ERROR', message: 'Failed to mark trip as arrived' },
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
      const tripId = req.params.id;

      // Update trip status to cancelled
      const trip = await tripService.updateTrip(
        tripId,
        {
          status: 'cancelled',
        },
        req.headers.authorization
      );

      // Process bulk refund for all confirmed bookings of this trip
      try {
        console.log(`[TripController] Processing bulk refund for cancelled trip ${tripId}`);

        const apiGatewayUrl = process.env.API_GATEWAY_URL || 'http://localhost:3000';
        const refundReason = refund_reason || 'Trip cancelled by admin';

        const refundResponse = await axios.post(
          `${apiGatewayUrl}/bookings/admin/trips/${tripId}/bulk-refund`,
          { reason: refundReason },
          {
            headers: {
              Authorization: req.headers.authorization, // Pass admin JWT token
              'Content-Type': 'application/json',
            },
            timeout: 30000, // 30 second timeout for bulk operations
          }
        );

        console.log(
          `[TripController] Bulk refund completed for trip ${tripId}:`,
          refundResponse.data
        );

        res.json({
          success: true,
          data: {
            trip,
            refundResult: refundResponse.data.data,
          },
          message: 'Trip cancelled successfully. All confirmed bookings have been refunded.',
        });
      } catch (refundError) {
        console.error(
          `[TripController] Bulk refund failed for trip ${tripId}:`,
          refundError.message
        );

        // Trip is cancelled but refund failed - return partial success
        res.status(207).json({
          success: true,
          data: {
            trip,
            refundError: refundError.message,
          },
          message:
            'Trip cancelled successfully, but bulk refund processing failed. Please check booking service logs.',
        });
      }
    } catch (err) {
      console.error('[TripController] Error cancelling trip:', err);
      res.status(500).json({
        success: false,
        error: { code: 'SYS_ERROR', message: 'Failed to cancel trip' },
      });
    }
  }

  // ========== ALTERNATIVE TRIP SUGGESTIONS ==========

  /**
   * Get alternative trip suggestions when no trips found
   * GET /alternatives?origin=...&destination=...&date=...&flexibleDays=...
   */
  async getAlternatives(req, res) {
    try {
      const { origin, destination, date, flexibleDays, page } = req.query;
      const days = parseInt(flexibleDays) || 7; // Default to 7 days
      const pageNum = parseInt(page) || 1; // Default to page 1

      if (!origin || !date) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_PARAMS', message: 'Origin and date are required' },
        });
      }

      const alternatives = await tripService.getAlternativeTrips(
        origin,
        destination,
        date,
        days,
        pageNum
      );

      console.log('[TripController] Alternatives response:', JSON.stringify(alternatives, null, 2));

      res.json({
        success: true,
        data: alternatives,
      });
    } catch (err) {
      console.error('[TripController] Error getting alternatives:', err);
      res.status(500).json({
        success: false,
        error: { code: 'SYS_ERROR', message: 'Failed to get alternative suggestions' },
      });
    }
  }

  /**
   * Get alternative dates for same route
   * GET /alternatives/dates?origin=...&destination=...&date=...
   */
  async getAlternativeDates(req, res) {
    try {
      const { origin, destination, date } = req.query;

      if (!origin || !destination || !date) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_PARAMS', message: 'Origin, destination, and date are required' },
        });
      }

      const alternativeDates = await tripService.getAlternativeDates(origin, destination, date);

      res.json({
        success: true,
        data: alternativeDates,
      });
    } catch (err) {
      console.error('[TripController] Error getting alternative dates:', err);
      res.status(500).json({
        success: false,
        error: { code: 'SYS_ERROR', message: 'Failed to get alternative dates' },
      });
    }
  }

  /**
   * Get alternative destinations from origin
   * GET /alternatives/destinations?origin=...&exclude=...&date=...
   */
  async getAlternativeDestinations(req, res) {
    try {
      const { origin, exclude, date } = req.query;

      if (!origin) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_PARAMS', message: 'Origin is required' },
        });
      }

      if (!date) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_PARAMS', message: 'Date is required' },
        });
      }

      const alternativeDestinations = await tripService.getAlternativeDestinations(
        origin,
        exclude,
        date
      );

      res.json({
        success: true,
        data: alternativeDestinations,
      });
    } catch (err) {
      console.error('[TripController] Error getting alternative destinations:', err);
      res.status(500).json({
        success: false,
        error: { code: 'SYS_ERROR', message: 'Failed to get alternative destinations' },
      });
    }
  }

  /**
   * Get passenger list for a trip (Admin only)
   * GET /:id/passengers
   */
  async getPassengers(req, res) {
    try {
      const { id: tripId } = req.params;

      const passengers = await tripService.getBookingsForTrip(tripId);

      if (!passengers) {
        return res.status(404).json({
          success: false,
          error: { code: 'TRIP_NOT_FOUND', message: 'Trip not found' },
        });
      }

      res.json({
        success: true,
        data: {
          trip_id: tripId,
          total_passengers: passengers.reduce(
            (sum, booking) => sum + (booking.passengers?.length || 0),
            0
          ),
          total_bookings: passengers.length,
          bookings: passengers.map((booking) => ({
            booking_id: booking.booking_id,
            booking_reference: booking.booking_reference,
            contact_email: booking.contact_email,
            contact_phone: booking.contact_phone,
            passengers: booking.passengers || [],
            passenger_count: booking.passengers?.length || 0,
          })),
        },
      });
    } catch (err) {
      console.error('[TripController] Error getting passengers:', err);
      res.status(500).json({
        success: false,
        error: { code: 'SYS_ERROR', message: 'Failed to get passenger list' },
      });
    }
  }
}

module.exports = new TripController();
