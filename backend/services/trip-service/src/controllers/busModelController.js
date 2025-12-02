// controllers/busModelController.js
const busModelService = require('../services/busModelService');
const {
  createBusModelSchema,
  updateBusModelSchema,
  setSeatLayoutSchema
} = require('../validators/busModelValidators');
const busModelRepository = require('../repositories/busModelRepository');

class BusModelController {
  async create(req, res) {
    try {
      const { error, value } = createBusModelSchema.validate(req.body);
      if (error) {
        return res.status(422).json({
          success: false,
          error: { code: 'VAL_001', message: error.details }
        });
      }

      const model = await busModelService.createBusModel(value);
      res.status(201).json({ success: true, data: model, message: 'Bus model created' });
    } catch (err) {
      res.status(409).json({
        success: false,
        error: { code: 'BUSM_001', message: err.message }
      });
    }
  }

  async update(req, res) {
    try {
      const { error, value } = updateBusModelSchema.validate(req.body);
      if (error) {
        return res.status(422).json({
          success: false,
          error: { code: 'VAL_001', message: error.details }
        });
      }

      const model = await busModelService.updateBusModel(req.params.id, value);
      if (!model) {
        return res.status(404).json({
          success: false,
          error: { code: 'BUSM_002', message: 'Bus model not found' }
        });
      }

      res.json({ success: true, data: model, message: 'Bus model updated' });
    } catch (err) {
      res.status(409).json({
        success: false,
        error: { code: 'BUSM_003', message: err.message }
      });
    }
  }

  async setSeatLayout(req, res) {
    try {
      const { error, value } = setSeatLayoutSchema.validate(req.body);
      if (error) {
        return res.status(422).json({
          success: false,
          error: { code: 'VAL_001', message: error.details }
        });
      }

      const layout = await busModelService.setSeatLayout(
        req.params.id,
        value.layout_json
      );
      res.json({ success: true, data: layout, message: 'Seat layout set' });
    } catch (err) {
      res.status(409).json({
        success: false,
        error: { code: 'BUSM_004', message: err.message }
      });
    }
  }

  async getAll(req, res) {
    try {
      const models = await busModelService.getAllBusModels();
      res.json({ success: true, data: models });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: { code: 'SYS_001', message: 'Internal error' }
      });
    }
  }

  async getById(req, res) {
    try {
      const model = await busModelService.getBusModelWithLayout(
        req.params.id
      );
      if (!model) {
        return res.status(404).json({
          success: false,
          error: { code: 'BUSM_002', message: 'Bus model not found' }
        });
      }
      res.json({ success: true, data: model });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: { code: 'SYS_001', message: 'Internal error' }
      });
    }
  }
}

module.exports = new BusModelController();
