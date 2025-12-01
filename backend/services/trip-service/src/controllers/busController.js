// controllers/busController.js
const busRepository = require('../repositories/busRepository');
const operatorRepository = require('../repositories/operatorRepository');
const busModelRepository = require('../repositories/busModelRepository');
const {
  createBusSchema,
  updateBusSchema
} = require('../validators/busValidators');

class BusController {
  // POST /buses - Tạo xe mới
  async create(req, res) {
  try {
    const { error, value } = createBusSchema.validate(req.body);
    if (error) {
      return res.status(422).json({
        success: false,
        error: { code: 'VAL_001', message: error.details[0].message }
      });
    }

    // Thêm check FK tồn tại
    const operator = await operatorRepository.findById(value.operator_id);
    if (!operator) {
      return res.status(404).json({
        success: false,
        error: { code: 'OPERATOR_NOT_FOUND', message: 'Không tìm thấy nhà xe (operator_id không tồn tại)' }
      });
    }

    const busModel = await busModelRepository.findById(value.bus_model_id);
    if (!busModel) {
      return res.status(404).json({
        success: false,
        error: { code: 'BUS_MODEL_NOT_FOUND', message: 'Không tìm thấy mẫu xe (bus_model_id không tồn tại)' }
      });
    }

    const existingBus = await busRepository.findByLicensePlate(value.license_plate);
    if (existingBus) {
      return res.status(409).json({
        success: false,
        error: { code: 'BUS_001', message: 'Biển số xe đã tồn tại' }
      });
    }

    const bus = await busRepository.create(value);
    res.status(201).json({
      success: true,
      data: bus,
      message: 'Tạo xe buýt thành công'
    });
  } catch (err) {
    console.error('Create bus error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SYS_001', message: 'Lỗi hệ thống khi tạo xe' }
    });
  }
}

  // GET /buses - Lấy danh sách xe
  async getAll(req, res) {
    try {
      const { limit = 50, offset = 0, status } = req.query;
      const buses = await busRepository.findAll({
        limit: parseInt(limit),
        offset: parseInt(offset),
        status
      });
      res.json({
        success: true,
        data: buses,
        pagination: { limit: parseInt(limit), offset: parseInt(offset) }
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: { code: 'SYS_001', message: 'Lỗi khi lấy danh sách xe' }
      });
    }
  }

  // GET /buses/:id - Lấy chi tiết xe + layout ghế
  async getById(req, res) {
    try {
      const bus = await busRepository.findById(req.params.id);
      if (!bus) {
        return res.status(404).json({
          success: false,
          error: { code: 'BUS_002', message: 'Không tìm thấy xe' }
        });
      }
      res.json({ success: true, data: bus });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: { code: 'SYS_001', message: 'Lỗi server' }
      });
    }
  }

  // PUT /buses/:id - Cập nhật xe
  async update(req, res) {
    try {
      const { error, value } = updateBusSchema.validate(req.body);
      if (error) {
        return res.status(422).json({
          success: false,
          error: { code: 'VAL_001', message: error.details[0].message }
        });
      }

      // Kiểm tra biển số trùng (trừ xe hiện tại)
      if (value.license_plate) {
        const existing = await busRepository.findByLicensePlate(value.license_plate);
        if (existing && existing.bus_id !== parseInt(req.params.id)) {
          return res.status(409).json({
            success: false,
            error: { code: 'BUS_001', message: 'Biển số đã được sử dụng bởi xe khác' }
          });
        }
      }

      const bus = await busRepository.update(req.params.id, value);
      if (!bus) {
        return res.status(404).json({
          success: false,
          error: { code: 'BUS_002', message: 'Không tìm thấy xe' }
        });
      }

      res.json({
        success: true,
        data: bus,
        message: 'Cập nhật xe thành công'
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: { code: 'SYS_001', message: 'Lỗi khi cập nhật xe' }
      });
    }
  }

  // DELETE /buses/:id - Xóa mềm (inactive)
  async delete(req, res) {
    try {
      const bus = await busRepository.delete(req.params.id);
      if (!bus) {
        return res.status(404).json({
          success: false,
          error: { code: 'BUS_002', message: 'Không tìm thấy xe để xóa' }
        });
      }
      res.json({
        success: true,
        message: 'Đã vô hiệu hóa xe thành công',
        data: bus
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: { code: 'SYS_001', message: 'Lỗi khi xóa xe' }
      });
    }
  }

  // GET /buses/:id/availability - API kiểm tra xe có đang chạy không
  async checkAvailability(req, res) {
    try {
      const { departure_time, arrival_time } = req.query;
      if (!departure_time || !arrival_time) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_PARAMS', message: 'Thiếu departure_time hoặc arrival_time' }
        });
      }

      const isBusy = await busRepository.isBusy(
        req.params.id,
        departure_time,
        arrival_time
      );

      res.json({
        success: true,
        data: {
          bus_id: parseInt(req.params.id),
          available: !isBusy,
          message: isBusy ? 'Xe đang chạy trong khoảng thời gian này' : 'Xe trống – có thể xếp lịch'
        }
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: { code: 'SYS_001', message: 'Lỗi kiểm tra lịch xe' }
      });
    }
  }
}

module.exports = new BusController();