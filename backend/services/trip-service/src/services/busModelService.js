// services/busModelService.js
const busModelRepository = require('../repositories/busModelRepository');

class BusModelService {
  async createBusModel(modelData) {
    return await busModelRepository.create(modelData);
  }

  async updateBusModel(id, modelData) {
    return await busModelRepository.update(id, modelData);
  }

  async setSeatLayout(busModelId, layoutJson) {
    const model = await busModelRepository.findById(busModelId);
    if (!model) throw new Error('Bus model not found');

    if (!layoutJson || typeof layoutJson !== 'object') {
      throw new Error('layout_json must be a valid object');
    }

    if (!Array.isArray(layoutJson.rows) || layoutJson.rows.length === 0) {
      throw new Error('layout_json must have "rows" array');
    }

    let totalSeats = 0;

    for (const row of layoutJson.rows) {
      if (!Array.isArray(row.seats)) {
        throw new Error('Each row must have "seats" array');
      }
      totalSeats += row.seats.filter(s => s !== null).length;
    }

    if (totalSeats !== model.total_seats) {
      console.warn(
        `Warning: Layout has ${totalSeats} seats but model declares ${model.total_seats}`
      );
    }

    return await busModelRepository.setSeatLayout(busModelId, layoutJson);
  }

  async getAllBusModels() {
    return await busModelRepository.findAll();
  }

  async getBusModelWithLayout(id) {
    return await busModelRepository.findById(id);
  }
}

module.exports = new BusModelService();
