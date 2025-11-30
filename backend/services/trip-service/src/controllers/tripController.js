// controllers/tripController.js
const tripService = require('../services/tripService');
const { createTripSchema, updateTripSchema, searchTripSchema } = require('../validators/tripValidators');

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
        message: 'Chuyến xe được tạo thành công'
      });
    } catch (err) {
      // Xử lý lỗi business rõ ràng
      const code = err.message.includes('overlap')
        ? 'TRIP_OVERLAP'
        : err.message.includes('Route')
        ? 'ROUTE_NOT_FOUND'
        : err.message.includes('Bus')
        ? 'BUS_NOT_FOUND'
        : 'TRIP_CREATE_FAILED';

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
          error: { code: 'TRIP_002', message: 'Không tìm thấy chuyến xe' }
        });
      }
      res.json({ success: true, data: trip });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: { code: 'SYS_001', message: 'Lỗi hệ thống' }
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
      if (!trip) {
        return res.status(404).json({
          success: false,
          error: { code: 'TRIP_002', message: 'Không tìm thấy chuyến xe' }
        });
      }

      res.json({
        success: true,
        data: trip,
        message: 'Cập nhật chuyến xe thành công'
      });
    } catch (err) {
      const code = err.message.includes('overlap') ? 'TRIP_OVERLAP' : 'TRIP_UPDATE_FAILED';
      res.status(409).json({
        success: false,
        error: { code, message: err.message }
      });
    }
  }

  async delete(req, res) {
    try {
      const deleted = await tripService.deleteTrip(req.params.id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: { 
            code: 'TRIP_002', message: 'Không tìm thấy chuyến xe' }
        });
      }
      res.json({ success: true, message: 'Xóa chuyến xe thành công' });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: { code: 'SYS_001', message: err.message }
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
          limit: parseInt(value.limit || 20),
          offset: parseInt(value.offset || 0),
          total: trips.length // có thể cải thiện bằng COUNT(*) riêng nếu cần
        }
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: { code: 'SYS_001', message: 'Lỗi tìm kiếm chuyến xe' }
      });
    }
  }
}

module.exports = new TripController();