// controllers/tripController.js
const tripService = require('../services/tripService');
const { 
  create_trip_schema: createTripSchema, 
  update_trip_schema: updateTripSchema, 
  search_trip_schema: searchTripSchema 
} = require('../validators/tripValidators');

class TripController {
  async create(req, res) {
    try {
      const { error, value } = createTripSchema.validate(req.body);
      if (error) {
        return res.status(422).json({
          success: false,
          error: { code: 'VAL_001', message: error.details[0].message }
        });
      }

      const trip = await tripService.createTrip(value);
      res.status(201).json({
        success: true,
        data: trip,
        message: 'Trip created successfully'
      });
    } catch (err) {
      const code = err.message.includes('overlap') ? 'TRIP_OVERLAP' : 
                   err.message.includes('not found') ? 'RESOURCE_NOT_FOUND' : 'TRIP_CREATE_FAILED';
      
      res.status(409).json({
        success: false,
        error: { code, message: err.message }
      });
    }
  }

  async getById(req, res) {
    try {
      const trip = await tripService.getTripWithDetails(req.params.id);
      if (!trip) {
        return res.status(404).json({
          success: false,
          error: { code: 'TRIP_NOT_FOUND', message: 'Trip not found' }
        });
      }
      res.json({ success: true, data: trip });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        error: { code: 'SYS_ERROR', message: 'Internal Server Error' }
      });
    }
  }

  async update(req, res) {
    try {
      const { error, value } = updateTripSchema.validate(req.body);
      if (error) {
        return res.status(422).json({
          success: false,
          error: { code: 'VAL_001', message: error.details[0].message }
        });
      }

      const trip = await tripService.updateTrip(req.params.id, value);
      res.json({
        success: true,
        data: trip,
        message: 'Trip updated successfully'
      });
    } catch (err) {
      if (err.message === 'Trip not found') {
        return res.status(404).json({ success: false, error: { code: 'TRIP_NOT_FOUND', message: err.message }});
      }
      const code = err.message.includes('overlap') ? 'TRIP_OVERLAP' : 'TRIP_UPDATE_FAILED';
      res.status(409).json({
        success: false,
        error: { code, message: err.message }
      });
    }
  }

  async delete(req, res) {
    try {
      const result = await tripService.deleteTrip(req.params.id);
      if (!result) {
        return res.status(404).json({
          success: false,
          error: { code: 'TRIP_NOT_FOUND', message: 'Trip not found' }
        });
      }
      res.json({ success: true, message: 'Trip cancelled successfully' });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: { code: 'SYS_ERROR', message: err.message }
      });
    }
  }

  async search(req, res) {
    try {
      const { error, value } = searchTripSchema.validate(req.query);
      if (error) {
        return res.status(422).json({
          success: false,
          error: { code: 'VAL_001', message: error.details[0].message }
        });
      }

      const trips = await tripService.searchTrips(value);
      
      res.json({
        success: true,
        data: trips,
        meta: {
          limit: value.limit,
          page: value.page,
          count: trips.length
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        error: { code: 'SYS_ERROR', message: 'Error searching trips' }
      });
    }
  }
}

module.exports = new TripController();