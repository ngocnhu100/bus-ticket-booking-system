// services/tripService.js
const tripRepository = require('../repositories/tripRepository');
const routeRepository = require('../repositories/routeRepository');
const busRepository = require('../repositories/busRepository');
const seatRepository = require('../repositories/seatRepository');
const seatLockService = require('./seatLockService');
const axios = require('axios');

class TripService {
  async createTrip(tripData) {
    // 1. Fetch Route & Bus to validate and get info
    const route = await routeRepository.findById(tripData.route_id);
    if (!route) throw new Error('Route not found');

    const bus = await busRepository.findById(tripData.bus_id);
    if (!bus) throw new Error('Bus not found');

    // 2. Calculate arrival_time if not provided (based on route duration)
    let arrivalTime = tripData.arrival_time;
    if (!arrivalTime && route.estimated_minutes) {
      const departureTime = new Date(tripData.departure_time);
      departureTime.setMinutes(departureTime.getMinutes() + parseInt(route.estimated_minutes));
      arrivalTime = departureTime.toISOString();
    }

    if (!arrivalTime) {
      throw new Error(
        'Could not calculate arrival time - please provide it explicitly or ensure route has estimated_minutes'
      );
    }

    // 3. Validate logic thời gian
    if (new Date(tripData.departure_time) >= new Date(arrivalTime)) {
      throw new Error('Departure time must be before arrival time');
    }

    // 4. Check trùng lịch xe (Overlap)
    const hasOverlap = await tripRepository.checkOverlap(
      tripData.bus_id,
      tripData.departure_time,
      arrivalTime
    );
    if (hasOverlap) throw new Error('Bus schedule overlap');

    // 5. Create & Return
    return await tripRepository.create({
      ...tripData,
      arrival_time: arrivalTime,
    });
  }

  async updateTrip(id, tripData, authorizationHeader) {
    const existing = await tripRepository.findById(id);
    if (!existing) throw new Error('Trip not found');

    // Validate status transition
    if (tripData.status && tripData.status !== existing.status) {
      const validTransitions = {
        inactive: ['scheduled'],
        scheduled: ['in_progress', 'cancelled'],
        in_progress: ['completed', 'cancelled'],
        completed: [],
        cancelled: [],
      };
      if (!validTransitions[existing.status]?.includes(tripData.status)) {
        throw new Error(`Invalid status transition from ${existing.status} to ${tripData.status}`);
      }
    }

    // Prepare updated trip data with auto-calculation of arrival_time
    let updatedTripData = { ...tripData };

    // If departure_time is being updated and arrival_time is not provided, calculate it
    if (tripData.departure_time && !tripData.arrival_time) {
      // Get route info (either from existing trip or updated route_id)
      const routeId = tripData.route_id || existing.route.route_id;
      const route = await routeRepository.findById(routeId);
      if (!route) throw new Error('Route not found');

      // Calculate arrival_time based on route duration
      if (route.estimated_minutes) {
        const departureTime = new Date(tripData.departure_time);
        departureTime.setMinutes(departureTime.getMinutes() + parseInt(route.estimated_minutes));
        updatedTripData.arrival_time = departureTime.toISOString();
      }
    }

    // Nếu update thời gian, check tính hợp lệ
    if (updatedTripData.departure_time || updatedTripData.arrival_time) {
      const dep = updatedTripData.departure_time || existing.schedule.departure_time;
      const arr = updatedTripData.arrival_time || existing.schedule.arrival_time;
      if (new Date(dep) >= new Date(arr))
        throw new Error('Invalid times: Departure must be before Arrival');
    }

    // Nếu update Bus hoặc Thời gian, check overlap
    const busChanged = tripData.bus_id && tripData.bus_id !== existing.bus.bus_id;
    const depChanged =
      tripData.departure_time &&
      new Date(tripData.departure_time).getTime() !==
        new Date(existing.schedule.departure_time).getTime();
    const arrChanged =
      tripData.arrival_time &&
      new Date(tripData.arrival_time).getTime() !==
        new Date(existing.schedule.arrival_time).getTime();

    console.log('Changes detected:', { busChanged, depChanged, arrChanged });

    if (busChanged || depChanged || arrChanged) {
      const busId = updatedTripData.bus_id || existing.bus.bus_id;
      const dep = updatedTripData.departure_time || existing.schedule.departure_time;
      const arr = updatedTripData.arrival_time || existing.schedule.arrival_time;

      const hasOverlap = await tripRepository.checkOverlap(busId, dep, arr, id);
      if (hasOverlap) throw new Error('Bus schedule overlap');
    }

    const updatedTrip = await tripRepository.update(id, updatedTripData);

    // Send notifications if schedule changed or status changed to cancelled
    if (depChanged) {
      try {
        await this._sendTripUpdateNotifications(id, existing, updatedTrip, authorizationHeader);
      } catch (error) {
        console.error('Failed to send trip update notifications:', error);
        // Don't fail the update if notifications fail
      }
    }

    // Send cancellation notifications if status changed to cancelled
    if (tripData.status === 'cancelled' && existing.status !== 'cancelled') {
      try {
        await this._sendTripCancellationNotifications(
          id,
          existing,
          updatedTrip,
          authorizationHeader
        );
      } catch (error) {
        console.error('Failed to send trip cancellation notifications:', error);
        // Don't fail the update if notifications fail
      }
    }

    return updatedTrip;
  }

  async _sendTripUpdateNotifications(tripId, oldTrip, newTrip, authorizationHeader) {
    try {
      // Get bookings for this trip from repository
      const bookings = await tripRepository.getBookingsForTrip(tripId);

      if (bookings.length === 0) {
        console.log(`No bookings found for trip ${tripId}, skipping notifications`);
        return;
      }

      // Use API Gateway for notifications
      const apiGatewayUrl = process.env.API_GATEWAY_URL || 'http://localhost:3000';

      // Send notification for each booking via API Gateway
      for (const booking of bookings) {
        try {
          const updateData = {
            bookingReference: booking.booking_reference,
            updateType: 'schedule_change',
            reason: 'Trip schedule updated by operator',
            originalDepartureTime: oldTrip.schedule.departure_time,
            newDepartureTime: newTrip.schedule.departure_time,
            originalArrivalTime: oldTrip.schedule.arrival_time,
            newArrivalTime: newTrip.schedule.arrival_time,
            fromLocation: newTrip.route.origin,
            toLocation: newTrip.route.destination,
            seats: booking.passengers?.map((p) => p.seat_code) || [],
            passengers: booking.passengers?.map((p) => ({ full_name: p.full_name })) || [],
            operatorName: newTrip.operator.name,
            busModel: newTrip.bus.model,
            nextSteps: [
              'Check your updated e-ticket',
              'Contact operator if you cannot make the new schedule',
              'Refund available if cancelled within policy',
            ],
          };

          console.log(
            '🚍 [TRIP SERVICE] Final updateData being sent:',
            JSON.stringify(updateData, null, 2)
          );

          await axios.post(
            `${apiGatewayUrl}/notification/send-trip-update`,
            {
              email: booking.contact_email,
              updateData,
            },
            {
              headers: {
                Authorization: authorizationHeader,
                'Content-Type': 'application/json',
              },
              timeout: 10000,
            }
          );

          console.log(`Trip update notification sent for booking ${booking.booking_reference}`);
        } catch (error) {
          console.error(
            `Failed to send notification for booking ${booking.booking_reference}:`,
            error.message
          );
        }
      }
    } catch (error) {
      console.error('Error sending trip update notifications:', error.message);
      throw error;
    }
  }

  async getTripWithDetails(id) {
    return await tripRepository.findById(id);
  }

  async searchTrips(filters) {
    // Có thể thêm logic business ở đây nếu cần (ví dụ filter khuyến mãi)
    return await tripRepository.search(filters);
  }

  async getAllTrips(filters) {
    // Get all trips with admin filters
    return await tripRepository.findAll(filters);
  }

  async getAllTripsAdmin({
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
  }) {
    // Get all trips with admin filtering, searching, sorting, and pagination
    const result = await tripRepository.findAll({
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

    return result;
  }

  async deleteTrip(id) {
    // Check xem có booking active không
    // (Giả sử logic này nằm trong repo hoặc gọi bookingService)
    /* 
    const hasBookings = await bookingRepository.hasActiveBookingsForTrip(id);
    if (hasBookings) throw new Error('Cannot delete trip with active bookings');
    */

    return await tripRepository.softDelete(id);
  }

  async getBookingsForTrip(tripId) {
    return await tripRepository.getBookingsForTrip(tripId);
  }

  async getSeatMap(tripId) {
    const seatMapData = await seatRepository.getSeatMapForTrip(tripId);

    // Get locked seats from Redis
    const lockedSeats = await seatLockService.getLockedSeats(tripId);

    // Update seat statuses based on locks - but only for available seats
    seatMapData.seats.forEach((seat) => {
      // Only apply Redis locks to available seats
      // Occupied seats should stay occupied regardless of Redis locks
      if (seat.status === 'available' && lockedSeats[seat.seat_code]) {
        seat.status = 'locked';
        seat.locked_until = new Date(lockedSeats[seat.seat_code].expiresAt);
        seat.locked_by = lockedSeats[seat.seat_code].userId;
      }
    });

    return seatMapData;
  }

  async _sendTripCancellationNotifications(tripId, oldTrip, newTrip, authorizationHeader) {
    try {
      // Get bookings for this trip from repository
      const bookings = await tripRepository.getBookingsForTrip(tripId);

      if (bookings.length === 0) {
        console.log(`No bookings found for trip ${tripId}, skipping cancellation notifications`);
        return;
      }

      // Get alternative trips
      const alternatives = await tripRepository.getAlternativeTrips(tripId);

      // Use API Gateway for notifications
      const apiGatewayUrl = process.env.API_GATEWAY_URL || 'http://localhost:3000';

      // Send notification for each booking via API Gateway
      for (const booking of bookings) {
        try {
          const updateData = {
            bookingReference: booking.booking_reference,
            updateType: 'cancellation',
            reason: 'Trip cancelled by operator',
            originalDepartureTime: oldTrip.schedule.departure_time,
            newDepartureTime: null,
            originalArrivalTime: oldTrip.schedule.arrival_time,
            newArrivalTime: null,
            fromLocation: newTrip.route.origin,
            toLocation: newTrip.route.destination,
            seats: booking.passengers?.map((p) => p.seat_code) || [],
            contactEmail: 'support@quad-n.me',
            contactPhone: '+84-1800-TICKET',
            customerEmail: booking.contact_email,
            customerPhone: booking.contact_phone,
            passengers: booking.passengers || [],
            operatorName: newTrip.operator.name,
            busModel: newTrip.bus.model,
            alternatives: alternatives, // Add alternative trips
            nextSteps: [
              'Contact customer support for refund',
              'Look for alternative trips',
              'Check refund policy',
            ],
          };

          console.log(
            '🚍 [TRIP SERVICE] Cancellation updateData being sent:',
            JSON.stringify(updateData, null, 2)
          );

          await axios.post(
            `${apiGatewayUrl}/notification/send-trip-update`,
            {
              email: booking.contact_email,
              updateData,
            },
            {
              headers: {
                Authorization: authorizationHeader,
                'Content-Type': 'application/json',
              },
              timeout: 10000,
            }
          );

          console.log(
            `Trip cancellation notification sent for booking ${booking.booking_reference}`
          );
        } catch (error) {
          console.error(
            `Failed to send cancellation notification for booking ${booking.booking_reference}:`,
            error.message
          );
        }
      }
    } catch (error) {
      console.error('Error sending trip cancellation notifications:', error.message);
      throw error;
    }
  }

  // ========== ALTERNATIVE TRIP SUGGESTIONS ==========

  /**
   * Get comprehensive alternative trip suggestions
   */
  async getAlternativeTrips(origin, destination, date) {
    const alternatives = {
      alternativeDates: [],
      alternativeDestinations: [],
      flexibleSearch: null,
    };

    try {
      // Get alternative dates for same route
      if (destination) {
        alternatives.alternativeDates = await this.getAlternativeDates(origin, destination, date);
      }

      // Get alternative destinations from origin
      alternatives.alternativeDestinations = await this.getAlternativeDestinations(
        origin,
        destination
      );

      // Get flexible search option (next 7 days)
      const flexibleDate = new Date(date);
      flexibleDate.setDate(flexibleDate.getDate() + 3); // Middle of 7-day range
      alternatives.flexibleSearch = {
        date: flexibleDate.toISOString().split('T')[0],
        description: 'Search next 7 days',
      };

      return alternatives;
    } catch (error) {
      console.error('Error getting alternative trips:', error);
      // Return empty alternatives on error
      return alternatives;
    }
  }

  /**
   * Get alternative dates for the same route (next 3 days)
   */
  async getAlternativeDates(origin, destination, date) {
    const alternativeDates = [];
    const baseDate = new Date(date);

    // Check next 3 days for available trips
    for (let i = 1; i <= 3; i++) {
      const checkDate = new Date(baseDate);
      checkDate.setDate(baseDate.getDate() + i);

      try {
        // Check if there are trips available for this date
        const trips = await tripRepository.search({
          origin,
          destination,
          date: checkDate.toISOString().split('T')[0],
          limit: 1, // Just check if any trips exist
        });

        if (trips.trips && trips.trips.length > 0) {
          alternativeDates.push({
            date: checkDate.toISOString().split('T')[0],
            dayName: checkDate.toLocaleDateString('en-US', { weekday: 'short' }),
            monthDay: checkDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            daysAhead: i,
            tripCount: trips.totalCount,
          });
        }
      } catch (error) {
        console.error(
          `Error checking trips for date ${checkDate.toISOString().split('T')[0]}:`,
          error
        );
      }
    }

    return alternativeDates;
  }

  /**
   * Get alternative destinations from origin city
   */
  async getAlternativeDestinations(origin, excludeDestination = null) {
    // Popular destinations from major cities in Vietnam
    const destinationMap = {
      'Ho Chi Minh City': ['Da Nang', 'Nha Trang', 'Can Tho', 'Vung Tau', 'Da Lat'],
      Hanoi: ['Hai Phong', 'Halong', 'Ninh Binh', 'Sa Pa', 'Quang Ninh'],
      'Da Nang': ['Hoi An', 'Hue', 'Quang Nam', 'Tam Ky', 'Nha Trang'],
      'Nha Trang': ['Da Lat', 'Phan Rang', 'Cam Ranh', 'Da Nang', 'Ho Chi Minh City'],
      'Can Tho': ['Chau Doc', 'Long Xuyen', 'Rach Gia', 'Soc Trang', 'Ho Chi Minh City'],
      'Hai Phong': ['Hanoi', 'Halong', 'Quang Ninh', 'Nam Dinh', 'Thai Binh'],
      'Da Lat': ['Nha Trang', 'Ho Chi Minh City', 'Phan Thiet', 'Bao Loc', 'Duc Trong'],
    };

    // Find matching origin (case-insensitive partial match)
    const originKey = Object.keys(destinationMap).find((key) =>
      origin.toLowerCase().includes(key.toLowerCase().replace(' City', ''))
    );

    let destinations = [];
    if (originKey) {
      destinations = destinationMap[originKey];
    } else {
      // Default destinations for unknown origins
      destinations = ['Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Nha Trang', 'Can Tho'];
    }

    // Filter out the excluded destination and limit to 3
    const filteredDestinations = destinations
      .filter((dest) => dest !== excludeDestination)
      .slice(0, 3);

    // Check which destinations have actual trips available
    const availableDestinations = [];
    for (const dest of filteredDestinations) {
      try {
        const trips = await tripRepository.search({
          origin,
          destination: dest,
          limit: 1,
        });

        if (trips.trips && trips.trips.length > 0) {
          availableDestinations.push({
            destination: dest,
            tripCount: trips.totalCount,
          });
        }
      } catch (error) {
        console.error(`Error checking trips to ${dest}:`, error);
      }
    }

    return availableDestinations;
  }
}

module.exports = new TripService();
