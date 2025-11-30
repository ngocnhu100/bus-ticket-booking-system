// services/routeService.js
const routeRepository = require('../repositories/routeRepository');

class RouteService {
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
    const route = await routeRepository.findById(routeId);
    if (!route) throw new Error('Route not found');

    const stops = await routeRepository.getStops(routeId);

    // Validate sequence UNIQUE
    if (stops.some(s => s.sequence === stopData.sequence)) {
      throw new Error('Sequence already exists');
    }

    const newStop = await routeRepository.addStop(routeId, stopData);

    // Update origin/destination
    const updatedStops = [...stops, newStop].sort((a, b) => a.sequence - b.sequence);

    if (updatedStops.length < 2) {
      throw new Error('Route must have at least 2 stops');
    }

    await routeRepository.update(routeId, {
      origin: updatedStops[0].stop_name,
      destination: updatedStops[updatedStops.length - 1].stop_name,
    });

    return newStop;
  }

  async getAllRoutes() {
    return await routeRepository.findAll();
  }

  async getRouteWithStops(id) {
    const route = await routeRepository.findById(id);
    if (!route) return null;

    const stops = await routeRepository.getStops(id);
    return { ...route, stops };
  }
}

module.exports = new RouteService();