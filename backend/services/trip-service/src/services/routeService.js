// services/routeService.js
const routeRepository = require('../repositories/routeRepository');
const { mapToRouteAdminData, mapToRouteStop } = require('../utils/mappers');
class RouteService {
  async getRouteWithStops(id) {
    const route = await routeRepository.findById(id);
    if (!route) return null;

    const stops = await routeRepository.getStopsWithTypes(id) || [];

    return mapToRouteAdminData(route, stops);
  }

  async createRoute(routeData) {
    const newRoute = await routeRepository.create(routeData);
    return mapToRouteAdminData(newRoute);
  }

  async updateRoute(id, routeData) {
    const updatedRoute = await routeRepository.update(id, routeData);
    if (!updatedRoute) return null;
    const stops = await routeRepository.getStopsWithTypes(id) || [];
    return mapToRouteAdminData(updatedRoute, stops);
  }

  async deleteRoute(id) {
    return await routeRepository.delete(id);
  }

  async addStopToRoute(routeId, stopData) {
    const newStop = await routeRepository.upsertStop(routeId, stopData);

    await routeRepository.updateOriginDestinationFromStops(routeId);

    return mapToRouteStop(newStop);
  }

  async getAllRoutes() {
    const routes = await routeRepository.findAll();
    const fullRoutes = [];
    for (const r of routes) {
      const stops = await routeRepository.getStopsWithTypes(r.route_id) || [];
      fullRoutes.push(mapToRouteAdminData(r, stops));
    }
    return fullRoutes;
  }

  async getPopularRoutes(limit = 10) {
    const routes = await routeRepository.getPopularRoutes(limit);
    const fullRoutes = [];
    for (const r of routes) {
      const stops = await routeRepository.getStopsWithTypes(r.route_id) || [];
      fullRoutes.push(mapToRouteAdminData(r, stops)); // Omit total_trips/starting_price
    }
    return fullRoutes;
  }
}

module.exports = new RouteService();