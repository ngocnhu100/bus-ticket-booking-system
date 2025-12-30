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
          error: { code: 'VAL_001', message: error.details[0].message },
        });
      }

      // Kiểm tra operator tồn tại
      const operator = await operatorRepository.findById(value.operator_id);
      if (!operator) {
        return res.status(404).json({
          success: false,
          error: { code: 'OPERATOR_NOT_FOUND', message: 'Operator not found' },
        });
      }

      // Kiểm tra biển số trùng
      const existingBus = await busRepository.findByLicensePlate(value.plate_number);
      if (existingBus) {
        return res.status(409).json({
          success: false,
          error: { code: 'BUS_001', message: 'This license plate already exists' },
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
            error: {
              code: 'BUS_MODEL_NOT_FOUND',
              message: 'Bus model not found',
            },
          });
        }
        if (err.message === 'CAPACITY_MISMATCH') {
          return res.status(400).json({
            success: false,
            error: { code: 'CAPACITY_MISMATCH', message: 'Capacity does not match the bus model' },
          });
        }
        throw err;
      }

      // Lấy đầy đủ thông tin (model_name, total_seats…) để mapper
      const fullBus = await busRepository.findById(bus.bus_id);

      res.status(201).json({
        success: true,
        data: mapToBusAdminData(fullBus),
        message: 'Create bus successfully',
      });
    } catch (err) {
      console.error('Create bus error:', err);
      res.status(500).json({
        success: false,
        error: { code: 'SYS_001', message: 'System error when creating bus' },
      });
    }
  }

  // GET /buses - Lấy danh sách xe
  async getAll(req, res) {
    try {
      // Support both page-based and offset-based pagination
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const status = req.query.status;
      const search = req.query.search;
      const type = req.query.type;
      const operator_id = req.query.operator_id;
      const has_seat_layout = req.query.has_seat_layout;

      // Convert page to offset
      const offset = (page - 1) * limit;

      const result = await busRepository.findAll({
        limit: limit,
        offset: offset,
        status,
        search,
        type,
        operator_id,
        has_seat_layout,
      });

      // Calculate total pages
      const totalPages = Math.ceil(result.total / limit);

      const mappedBuses = result.data.map(mapToBusAdminData);
      res.json({
        success: true,
        data: mappedBuses,
        pagination: {
          page: page,
          limit: limit,
          total: result.total,
          totalPages: totalPages,
        },
      });
    } catch (err) {
      console.error('Error in getAll buses:', err);
      res.status(500).json({
        success: false,
        error: { code: 'SYS_001', message: 'Error fetching bus list' },
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
          error: { code: 'BUS_002', message: 'Bus not found' },
        });
      }
      res.json({ success: true, data: mapToBusAdminData(bus) });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: { code: 'SYS_001', message: 'Server error' },
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
          error: { code: 'VAL_001', message: error.details[0].message },
        });
      }

      // Convert 'inactive' status to 'maintenance' (normalize frontend status to valid DB values)
      if (value.status === 'inactive') {
        value.status = 'maintenance';
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
            error: { code: 'BUS_MODEL_NOT_FOUND', message: 'Bus model not found' },
          });
        }
        const modelRow = modelResult.rows[0];
        // Note: Capacity validation removed - capacity is now auto-calculated from actual seats in layout
        // if (value.capacity && Number(value.capacity) !== Number(modelRow.total_seats)) {
        //   return res.status(400).json({
        //     success: false,
        //     error: { code: 'CAPACITY_MISMATCH', message: 'Capacity must match the bus model' },
        //   });
        // }

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
          error: { code: 'BUS_002', message: 'Bus not found' },
        });
      }

      const fullBus = await busRepository.findById(req.params.id);

      res.json({
        success: true,
        data: mapToBusAdminData(fullBus),
        message: 'Cập nhật xe thành công',
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        error: { code: 'SYS_001', message: 'Error updating bus' },
      });
    }
  }

  // DELETE /buses/:id - Xóa mềm (maintenance)
  async delete(req, res) {
    try {
      const bus = await busRepository.delete(req.params.id);
      if (!bus) {
        return res.status(404).json({
          success: false,
          error: { code: 'BUS_002', message: 'Bus not found for deletion' },
        });
      }
      res.json({
        success: true,
        message: 'Bus has been successfully set to maintenance',
        data: mapToBusAdminData(bus),
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: { code: 'SYS_001', message: 'Lỗi khi xóa xe' },
      });
    }
  }

  // PUT /buses/:id/deactivate - Deactivate bus (set status to maintenance)
  async deactivate(req, res) {
    try {
      const busId = req.params.id;

      // Check if bus has any active trips using repository method
      const activeTripsCount = await busRepository.hasActiveTrips(busId);
      if (activeTripsCount > 0) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'BUS_HAS_ACTIVE_TRIPS',
            message: `Cannot deactivate bus. It has ${activeTripsCount} active trip(s). Please wait until all trips are completed.`,
          },
        });
      }

      const bus = await busRepository.deactivate(busId);
      if (!bus) {
        return res.status(404).json({
          success: false,
          error: { code: 'BUS_002', message: 'Bus not found for deactivation' },
        });
      }
      res.json({
        success: true,
        message: 'Bus has been successfully set to maintenance',
        data: mapToBusAdminData(bus),
      });
    } catch (err) {
      console.error('Deactivate bus error:', err);
      res.status(500).json({
        success: false,
        error: { code: 'SYS_001', message: 'Error deactivating bus' },
      });
    }
  }

  // PUT /buses/:id/activate - Activate bus (set status to active)
  async activate(req, res) {
    try {
      const bus = await busRepository.activate(req.params.id);
      if (!bus) {
        return res.status(404).json({
          success: false,
          error: { code: 'BUS_002', message: 'Bus not found for activation' },
        });
      }
      res.json({
        success: true,
        message: 'Bus has been successfully activated',
        data: mapToBusAdminData(bus),
      });
    } catch (err) {
      console.error('Activate bus error:', err);
      res.status(500).json({
        success: false,
        error: { code: 'SYS_001', message: 'Error activating bus' },
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
          error: { code: 'MISSING_PARAMS', message: 'Missing departure_time or arrival_time' },
        });
      }

      const isBusy = await busRepository.isBusy(req.params.id, departure_time, arrival_time);

      res.json({
        success: true,
        data: {
          bus_id: parseInt(req.params.id),
          available: !isBusy,
          message: isBusy
            ? 'Xe đang chạy trong khoảng thời gian này'
            : 'Xe trống – có thể xếp lịch',
        },
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: { code: 'SYS_001', message: 'Error checking bus availability' },
      });
    }
  }

  // POST /buses/:id/seat-layout - Set seat layout for a specific bus
  async setSeatLayout(req, res) {
    try {
      const { layout_json } = req.body;
      if (!layout_json) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_LAYOUT', message: 'layout_json is required' },
        });
      }

      // Verify bus exists
      const bus = await busRepository.findById(req.params.id);
      if (!bus) {
        return res.status(404).json({
          success: false,
          error: { code: 'BUS_002', message: 'Bus not found' },
        });
      }

      // Business rule: Only allow seat layout changes when bus is inactive or in maintenance
      if (bus.status !== 'inactive' && bus.status !== 'maintenance') {
        return res.status(409).json({
          success: false,
          error: {
            code: 'BUS_STATUS_INVALID',
            message:
              'Seat layout can only be changed when bus is inactive or in maintenance status',
          },
        });
      }

      const layout = await busModelRepository.setSeatLayout(req.params.id, layout_json);

      // Regenerate seats from layout
      await busModelRepository.regenerateSeatsFromLayout(req.params.id);

      res.json({
        success: true,
        data: layout,
        message: 'Seat layout set successfully for bus',
      });
    } catch (err) {
      console.error('Set seat layout error:', err);
      res.status(500).json({
        success: false,
        error: { code: 'SYS_001', message: 'Error setting seat layout' },
      });
    }
  }

  // GET /buses/:id/seat-layout - Get seat layout for a specific bus
  async getSeatLayout(req, res) {
    try {
      // Verify bus exists
      const bus = await busRepository.findById(req.params.id);
      if (!bus) {
        return res.status(404).json({
          success: false,
          error: { code: 'BUS_002', message: 'Bus not found' },
        });
      }

      const layout = await busModelRepository.getSeatLayout(req.params.id);
      res.json({
        success: true,
        data: layout,
        message: layout ? 'Seat layout retrieved' : 'No seat layout found for this bus',
      });
    } catch (err) {
      console.error('Get seat layout error:', err);
      res.status(500).json({
        success: false,
        error: { code: 'SYS_001', message: 'Error getting seat layout' },
      });
    }
  }

  // DELETE /buses/:id/seat-layout - Delete seat layout for a specific bus
  async deleteSeatLayout(req, res) {
    try {
      // Verify bus exists
      const bus = await busRepository.findById(req.params.id);
      if (!bus) {
        return res.status(404).json({
          success: false,
          error: { code: 'BUS_002', message: 'Bus not found' },
        });
      }

      // Business rule: Only allow seat layout changes when bus is inactive or in maintenance
      if (bus.status !== 'inactive' && bus.status !== 'maintenance') {
        return res.status(409).json({
          success: false,
          error: {
            code: 'BUS_STATUS_INVALID',
            message:
              'Seat layout can only be changed when bus is inactive or in maintenance status',
          },
        });
      }

      const result = await busModelRepository.deleteSeatLayout(req.params.id);

      res.json({
        success: true,
        message: 'Seat layout deleted successfully',
      });
    } catch (err) {
      console.error('Delete seat layout error:', err);
      res.status(500).json({
        success: false,
        error: { code: 'SYS_001', message: 'Error deleting seat layout' },
      });
    }
  }
}

module.exports = new BusController();
