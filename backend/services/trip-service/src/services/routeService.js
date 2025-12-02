// services/routeService.js
const routeRepository = require('../repositories/routeRepository');

class RouteService {
  async getRouteWithStops(id) {
    const route = await routeRepository.findById(id);
    if (!route) return null;

    const stops = await routeRepository.getStopsWithTypes(id) || [];

    const pickup_points = stops.filter(s => s.is_pickup);
    const dropoff_points = stops.filter(s => s.is_dropoff);

    const sortedStops = [...stops].sort((a, b) => a.sequence - b.sequence);
    const origin = sortedStops[0]?.stop_name || route.origin;
    const destination = sortedStops[sortedStops.length - 1]?.stop_name || route.destination;

    return {
      route_id: route.route_id,
      operator_id: route.operator_id,
      origin,
      destination,
      distance_km: route.distance_km,
      estimated_minutes: route.estimated_minutes,
      pickup_points,
      dropoff_points,
      route_stops: stops,
      created_at: route.created_at,
      updated_at: route.updated_at
    };
  }

  async createRoute(routeData) {
    return await routeRepository.create(routeData);
  }

  async updateRoute(id, routeData) {
    return await routeRepository.update(id, routeData);
  }

  async deleteRoute(id) {
    return await routeRepository.delete(id);
  }

  async addStopToRoute(routeId, stopData) {
    const newStop = await routeRepository.upsertStop(routeId, stopData);

    await routeRepository.updateOriginDestinationFromStops(routeId);

    return newStop;
  }

  async getAllRoutes() {
    const routes = await routeRepository.findAll();
    return routes.map(r => ({
      route_id: r.route_id,
      operator_id: r.operator_id,
      origin: r.origin,
      destination: r.destination,
      distance_km: r.distance_km,
      estimated_minutes: r.estimated_minutes,
      total_stops: 0, 
      created_at: r.created_at
    }));
  }
}

module.exports = new RouteService();