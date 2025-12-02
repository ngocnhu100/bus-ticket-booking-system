// controllers/routeController.js
const routeService = require('../services/routeService');
const {
  createRouteSchema,
  updateRouteSchema,
  addStopSchema
} = require('../validators/routeValidators');

class RouteController {
  async create(req, res) {
    try {
      const { error, value } = createRouteSchema.validate(req.body);
      if (error) {
        return res.status(422).json({
          success: false,
          error: { code: 'VAL_001', message: error.details }
        });
      }

      const route = await routeService.createRoute(value);
      res.status(201).json({
        success: true,
        data: route,
        message: 'Route created successfully'
      });
    } catch (err) {
      res.status(409).json({
        success: false,
        error: { code: 'ROUTE_001', message: err.message }
      });
    }
  }

  async getById(req, res) {
  try {
    const route = await routeService.getRouteWithStops(req.params.id);
    if (!route) {
      return res.status(404).json({
        success: false,
        error: { code: 'ROUTE_002', message: 'Route not found' }
      });
    }
    res.json({ 
      success: true, 
      data: route 
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: 'SYS_001', message: err.message }
    });
  }
}

  async update(req, res) {
    try {
      const { error, value } = updateRouteSchema.validate(req.body);
      if (error) {
        return res.status(422).json({
          success: false,
          error: { code: 'VAL_001', message: error.details }
        });
      }

      const route = await routeService.updateRoute(req.params.id, value);
      if (!route) {
        return res.status(404).json({
          success: false,
          error: { code: 'ROUTE_002', message: 'Route not found' }
        });
      }

      res.json({
        success: true,
        data: route,
        message: 'Route updated successfully'
      });
    } catch (err) {
      res.status(409).json({
        success: false,
        error: { code: 'ROUTE_003', message: err.message }
      });
    }
  }

  async delete(req, res) {
    try {
      const route = await routeService.deleteRoute(req.params.id);
      if (!route) {
        return res.status(404).json({
          success: false,
          error: { code: 'ROUTE_002', message: 'Route not found' }
        });
      }
      res.json({ success: true, message: 'Route deleted successfully' });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: { code: 'SYS_001', message: 'Internal server error' }
      });
    }
  }

  async addStop(req, res) {
    try {
      const { error, value } = addStopSchema.validate(req.body);
      if (error) {
        return res.status(422).json({
          success: false,
          error: { code: 'VAL_001', message: error.details }
        });
      }

      const stop = await routeService.addStopToRoute(req.params.id, value);
      res.status(201).json({
        success: true,
        data: stop,
        message: 'Stop added successfully'
      });
    } catch (err) {
      res.status(409).json({
        success: false,
        error: { code: 'ROUTE_004', message: err.message }
      });
    }
  }

  async getAll(req, res) {
    try {
      const routes = await routeService.getAllRoutes();
      res.json({ success: true, data: routes });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: { code: 'SYS_001', message: 'Internal server error' }
      });
    }
  }
}

module.exports = new RouteController();