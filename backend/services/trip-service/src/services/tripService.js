// services/tripService.js
const tripRepository = require('../repositories/tripRepository');
const routeRepository = require('../repositories/routeRepository');
const busRepository = require('../repositories/busRepository');
const seatRepository = require('../repositories/seatRepository');
const seatLockService = require('./seatLockService');

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

  async updateTrip(id, tripData) {
    const existing = await tripRepository.findById(id);
    if (!existing) throw new Error('Trip not found');

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

    return await tripRepository.update(id, updatedTripData);
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

  async deleteTrip(id) {
    // Check xem có booking active không
    // (Giả sử logic này nằm trong repo hoặc gọi bookingService)
    /* 
    const hasBookings = await bookingRepository.hasActiveBookingsForTrip(id);
    if (hasBookings) throw new Error('Cannot delete trip with active bookings');
    */

    return await tripRepository.softDelete(id);
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
}

module.exports = new TripService();
