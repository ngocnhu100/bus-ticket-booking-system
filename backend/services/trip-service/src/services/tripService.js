// services/tripService.js
const tripRepository = require('../repositories/tripRepository');
const routeRepository = require('../repositories/routeRepository'); 
const busRepository = require('../repositories/busRepository');
const seatRepository = require('../repositories/seatRepository');
const seatLockService = require('./seatLockService');

class TripService {
  async createTrip(tripData) {
    // 1. Validate logic thời gian
    if (new Date(tripData.departure_time) >= new Date(tripData.arrival_time)) {
      throw new Error('Departure time must be before arrival time');
    }

    // 2. Validate Route & Bus tồn tại (Nếu không có constraint FK trong DB thì bắt buộc phải check)
    const route = await routeRepository.findById(tripData.route_id);
    if (!route) throw new Error('Route not found');

    const bus = await busRepository.findById(tripData.bus_id);
    if (!bus) throw new Error('Bus not found');

    // 3. Check trùng lịch xe (Overlap)
    const hasOverlap = await tripRepository.checkOverlap(
      tripData.bus_id,
      tripData.departure_time,
      tripData.arrival_time
    );
    if (hasOverlap) throw new Error('Bus schedule overlap');

    // 4. Create & Return
    return await tripRepository.create(tripData);
  }

  async updateTrip(id, tripData) {
    const existing = await tripRepository.findById(id);
    if (!existing) throw new Error('Trip not found');

    // Nếu update thời gian, check tính hợp lệ
    if (tripData.departure_time || tripData.arrival_time) {
      const dep = tripData.departure_time || existing.schedule.departure_time;
      const arr = tripData.arrival_time || existing.schedule.arrival_time;
      if (new Date(dep) >= new Date(arr)) throw new Error('Invalid times: Departure must be before Arrival');
    }

    // Nếu update Bus hoặc Thời gian, check overlap
    if (tripData.bus_id || tripData.departure_time || tripData.arrival_time) {
      const busId = tripData.bus_id || existing.bus.bus_id;
      const dep = tripData.departure_time || existing.schedule.departure_time;
      const arr = tripData.arrival_time || existing.schedule.arrival_time;

      const hasOverlap = await tripRepository.checkOverlap(busId, dep, arr, id);
      if (hasOverlap) throw new Error('Bus schedule overlap');
    }

    return await tripRepository.update(id, tripData);
  }

  async getTripWithDetails(id) {
    return await tripRepository.findById(id);
  }

  async searchTrips(filters) {
    // Có thể thêm logic business ở đây nếu cần (ví dụ filter khuyến mãi)
    return await tripRepository.search(filters);
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
    
    // Update seat statuses based on locks
    seatMapData.seats.forEach(seat => {
      if (lockedSeats[seat.seat_code]) {
        seat.status = 'locked';
      }
    });
    
    return seatMapData;
  }
}

module.exports = new TripService();