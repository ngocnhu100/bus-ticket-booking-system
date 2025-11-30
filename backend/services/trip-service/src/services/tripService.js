// services/tripService.js
const tripRepository = require('../repositories/tripRepository');
const routeRepository = require('../repositories/routeRepository');
const busRepository = require('../repositories/busRepository');

class TripService {
  async createTrip(tripData) {
    // Validate departure < arrival
    if (new Date(tripData.departure_time) >= new Date(tripData.arrival_time)) {
      throw new Error('Departure time must be before arrival time');
    }

    // Check route exists
    const route = await routeRepository.findById(tripData.route_id);
    if (!route) throw new Error('Route not found');

    // Check bus exists
    const bus = await busRepository.findById(tripData.bus_id);
    if (!bus) throw new Error('Bus not found');

    // Check overlap
    const hasOverlap = await tripRepository.checkOverlap(
      tripData.bus_id,
      tripData.departure_time,
      tripData.arrival_time
    );
    if (hasOverlap) throw new Error('Bus schedule overlap');

    return await tripRepository.create(tripData);
  }

  async updateTrip(id, tripData) {
    const existing = await tripRepository.findById(id);
    if (!existing) throw new Error('Trip not found');

    // Validate times if updated
    if (tripData.departure_time || tripData.arrival_time) {
      const dep = tripData.departure_time || existing.departure_time;
      const arr = tripData.arrival_time || existing.arrival_time;
      if (new Date(dep) >= new Date(arr)) throw new Error('Invalid times');
    }

    // Check overlap if bus/time changed
    if (tripData.bus_id || tripData.departure_time || tripData.arrival_time) {
      const busId = tripData.bus_id || existing.bus_id;
      const dep = tripData.departure_time || existing.departure_time;
      const arr = tripData.arrival_time || existing.arrival_time;

      const hasOverlap = await tripRepository.checkOverlap(busId, dep, arr, id);
      if (hasOverlap) throw new Error('Bus schedule overlap');
    }

    return await tripRepository.update(id, tripData);
  }

  async searchTrips(filters) {
    return await tripRepository.search(filters);
  }

  async getTripWithAvailableSeats(id) {
    const trip = await tripRepository.findById(id);
    if (!trip) return null;

    // TODO: thêm logic tính available seats nếu bạn muốn
    return trip;
  }

  async getTripWithDetails(id) {
  const trip = await tripRepository.findById(id);
  if (!trip) return null;

  // Lấy thêm thông tin chi tiết
  const route = await routeRepository.findById(trip.route_id);
  const stops = await routeRepository.getStops(trip.route_id);

  // // Tính ghế trống (giả sử bạn đã có bảng bookings)
  // const bookedSeats = await tripRepository.countBookedSeats(id);
  // const bus = await busRepository.findById(trip.bus_id);
  // const totalSeats = bus?.total_seats || 45;

  return {
    ...trip,
    route_name: route.name,
    origin: route.origin,
    destination: route.destination,
    stops,
    remaining_seats: totalSeats - bookedSeats,
    bus_plate: bus?.license_plate
  };
}

async deleteTrip(id) {
  // Kiểm tra có booking confirmed không
  const hasConfirmedBooking = await tripRepository.hasConfirmedBooking(id);
  if (hasConfirmedBooking) {
    throw new Error('Không thể xóa chuyến có vé đã xác nhận');
  }
  return await tripRepository.softDelete(id); // hoặc hard delete tùy bạn
}
}

module.exports = new TripService();