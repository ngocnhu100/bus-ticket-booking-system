// controllers/routeStopController.js
const routeStopRepository = require('../repositories/routeStopRepository');
const routeRepository = require('../repositories/routeRepository');

const { addStopSchema, updateStopSchema } = require('../validators/routeValidators');

class RouteStopController {
  async create(req, res) {
    try {
      const { error, value } = addStopSchema.validate(req.body);
      if (error) {
        return res.status(422).json({
          success: false,
          error: { code: 'VAL_001', message: error.details[0].message },
        });
      }

      const routeId = req.params.id;
      const routeExists = await routeRepository.findById(routeId);
      if (!routeExists) {
        return res.status(404).json({
          success: false,
          error: { code: 'ROUTE_002', message: 'Không tìm thấy tuyến đường' },
        });
      }

      const sequenceTaken = await routeStopRepository.isSequenceTaken(routeId, value.sequence);
      if (sequenceTaken) {
        return res.status(409).json({
          success: false,
          error: { code: 'STOP_001', message: 'Thứ tự điểm dừng đã tồn tại trong tuyến này' },
        });
      }

      const stop = await routeStopRepository.create(routeId, value);
      return res.status(201).json({
        success: true,
        data: stop,
        message: 'Thêm điểm dừng thành công',
      });
    } catch (err) {
      console.error('Error creating route stop:', err);
      return res.status(500).json({
        success: false,
        error: { code: 'SYS_001', message: 'Lỗi hệ thống khi thêm điểm dừng' },
      });
    }
  }

  async getByRouteId(req, res) {
    try {
      const stops = await routeStopRepository.findByRouteId(req.params.id);
      return res.json({ success: true, data: stops });
    } catch (err) {
      console.error('Error fetching stops:', err);
      return res.status(500).json({
        success: false,
        error: { code: 'SYS_001', message: 'Lỗi lấy danh sách điểm dừng' },
      });
    }
  }

  async update(req, res) {
    try {
      const { error, value } = updateStopSchema.validate(req.body);
      if (error) {
        return res.status(422).json({
          success: false,
          error: { code: 'VAL_001', message: error.details[0].message },
        });
      }

      const sequenceTaken = await routeStopRepository.isSequenceTaken(
        req.params.routeId,
        value.sequence,
        req.params.stopId
      );
      if (sequenceTaken) {
        return res.status(409).json({
          success: false,
          error: { code: 'STOP_001', message: 'Thứ tự điểm dừng đã được sử dụng' },
        });
      }

      const stop = await routeStopRepository.update(req.params.stopId, value);
      if (!stop) {
        return res.status(404).json({
          success: false,
          error: { code: 'STOP_002', message: 'Không tìm thấy điểm dừng' },
        });
      }

      return res.json({
        success: true,
        data: stop,
        message: 'Cập nhật điểm dừng thành công',
      });
    } catch (err) {
      console.error('Error updating stop:', err);
      return res.status(500).json({
        success: false,
        error: { code: 'SYS_001', message: 'Lỗi hệ thống khi cập nhật' },
      });
    }
  }

  async delete(req, res) {
    try {
      const stop = await routeStopRepository.delete(req.params.stopId);
      if (!stop) {
        return res.status(404).json({
          success: false,
          error: { code: 'STOP_002', message: 'Không tìm thấy điểm dừng để xóa' },
        });
      }

      return res.json({
        success: true,
        message: 'Xóa điểm dừng thành công',
      });
    } catch (err) {
      console.error('Error deleting stop:', err);
      return res.status(500).json({
        success: false,
        error: { code: 'SYS_001', message: 'Lỗi hệ thống khi xóa' },
      });
    }
  }
}

module.exports = new RouteStopController();