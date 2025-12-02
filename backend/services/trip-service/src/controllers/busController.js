// controllers/busController.js
const busRepository = require('../repositories/busRepository');
const operatorRepository = require('../repositories/operatorRepository');
const busModelRepository = require('../repositories/busModelRepository');
const { createBusSchema, updateBusSchema } = require('../validators/busValidators');
const { mapToBusAdminData } = require('../utils/mappers'); // New import
const pool = require('../database');
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

      // Kiểm tra operator tồn tại
      const operator = await operatorRepository.findById(value.operator_id);
      if (!operator) {
        return res.status(404).json({
          success: false,
          error: { code: 'OPERATOR_NOT_FOUND', message: 'Không tìm thấy nhà xe' }
        });
      }

      // Kiểm tra biển số trùng
      const existingBus = await busRepository.findByLicensePlate(value.plate_number);
      if (existingBus) {
        return res.status(409).json({
          success: false,
          error: { code: 'BUS_001', message: 'Biển số xe đã tồn tại' }
        });
      }

      // Tạo xe (repository sẽ tự tìm bus_model_id từ tên model)
      let bus;
      try {
        bus = await busRepository.create(value);
      } catch (err) {
        if (err.message === 'BUS_MODEL_NOT_FOUND') {
          return res.status(404).json({
            success: false,
            error: { code: 'BUS_MODEL_NOT_FOUND', message: 'Không tìm thấy mẫu xe với tên đã nhập' }
          });
        }
        if (err.message === 'CAPACITY_MISMATCH') {
          return res.status(400).json({
            success: false,
            error: { code: 'CAPACITY_MISMATCH', message: 'Sức chứa không khớp với mẫu xe' }
          });
        }
        throw err;
      }

      // Lấy đầy đủ thông tin (model_name, total_seats…) để mapper
      const fullBus = await busRepository.findById(bus.bus_id);

      res.status(201).json({
        success: true,
        data: mapToBusAdminData(fullBus),
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
      const mappedBuses = buses.map(mapToBusAdminData);
      res.json({
        success: true,
        data: mappedBuses,
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
      res.json({ success: true, data: mapToBusAdminData(bus) });
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

      let updatedBus;
      if (value.model || value.capacity !== undefined) {
        // Nếu thay model → cần lấy lại bus_model_id và kiểm tra capacity
        const modelResult = await pool.query(
          'SELECT bus_model_id, total_seats FROM bus_models WHERE name ILIKE $1',
          [value.model || (await busRepository.findById(req.params.id)).model_name]
        );
        if (modelResult.rows.length === 0) {
          return res.status(404).json({
            success: false,
            error: { code: 'BUS_MODEL_NOT_FOUND', message: 'Mẫu xe không tồn tại' }
          });
        }
        const modelRow = modelResult.rows[0];
        if (value.capacity && Number(value.capacity) !== Number(modelRow.total_seats)) {
          return res.status(400).json({
            success: false,
            error: { code: 'CAPACITY_MISMATCH', message: 'Sức chứa phải khớp với mẫu xe' }
          });
        }

        // Cập nhật bus_model_id + các field khác
        await pool.query(
          `UPDATE buses SET bus_model_id = $1, updated_at = CURRENT_TIMESTAMP WHERE bus_id = $2`,
          [modelRow.bus_model_id, req.params.id]
        );
        delete value.model; // không để vào update thông thường
      }

      // Cập nhật các field còn lại
      if (Object.keys(value).length > 0) {
        // plate_number → license_plate
        if (value.plate_number) {
          value.license_plate = value.plate_number;
          delete value.plate_number;
        }
        updatedBus = await busRepository.update(req.params.id, value);
      } else {
        updatedBus = await busRepository.findById(req.params.id);
      }

      if (!updatedBus) {
        return res.status(404).json({
          success: false,
          error: { code: 'BUS_002', message: 'Không tìm thấy xe' }
        });
      }

      const fullBus = await busRepository.findById(req.params.id);

      res.json({
        success: true,
        data: mapToBusAdminData(fullBus),
        message: 'Cập nhật xe thành công'
      });
    } catch (err) {
      console.error(err);
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
        data: mapToBusAdminData(bus)
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