// controllers/routeController.js
const routeService = require('../services/routeService');
const { mapToRouteStop } = require('../utils/mappers');
const {
  createRouteSchema,
  updateRouteSchema,
  addStopSchema,
} = require('../validators/routeValidators');
const routeStopRepository = require('../repositories/routeStopRepository');
class RouteController {
  async create(req, res) {
    try {
      console.log('Route creation request body:', JSON.stringify(req.body, null, 2));
      const { error, value } = createRouteSchema.validate(req.body);
      if (error) {
        console.log('=== VALIDATION ERROR ===');
        console.log('Error message:', error.message);
        console.log('Number of errors:', error.details.length);
        error.details.forEach((detail, idx) => {
          console.log(`Error ${idx + 1}:`, {
            path: detail.path.join('.'),
            message: detail.message,
            type: detail.type,
          });
        });

        // Format validation errors for better frontend consumption
        const formattedErrors = error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value,
        }));

        console.log('Formatted errors:', JSON.stringify(formattedErrors, null, 2));
        return res.status(422).json({
          success: false,
          error: {
            code: 'VAL_001',
            message: 'Validation failed',
            details: formattedErrors,
          },
        });
      }

      const newRoute = await routeService.createRoute(value);
      res.status(201).json({
        success: true,
        data: newRoute,
        message: 'Route created successfully',
      });
    } catch (err) {
      console.error('Error creating route:', err);
      let message = err.message || "Can't create route";
      if (err.code === 'DUPLICATE_ROUTE') {
        message = err.message;
      }
      res.status(409).json({
        success: false,
        error: { code: 'ROUTE_001', message: message },
      });
    }
  }

  async getById(req, res) {
    try {
      const route = await routeService.getRouteWithStops(req.params.id);
      if (!route) {
        return res.status(404).json({
          success: false,
          error: { code: 'ROUTE_002', message: 'Route not found' },
        });
      }
      res.json({
        success: true,
        data: route,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: { code: 'SYS_001', message: err.message },
      });
    }
  }

  async update(req, res) {
    try {
      console.log('Route update request body:', JSON.stringify(req.body, null, 2));
      const { error, value } = updateRouteSchema.validate(req.body);
      if (error) {
        console.log('=== VALIDATION ERROR ===');
        console.log('Error message:', error.message);
        console.log('Number of errors:', error.details.length);
        error.details.forEach((detail, idx) => {
          console.log(`Error ${idx + 1}:`, {
            path: detail.path.join('.'),
            message: detail.message,
            type: detail.type,
          });
        });

        // Format validation errors for better frontend consumption
        const formattedErrors = error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value,
        }));

        console.log('Formatted errors:', JSON.stringify(formattedErrors, null, 2));
        return res.status(422).json({
          success: false,
          error: {
            code: 'VAL_001',
            message: 'Validation failed',
            details: formattedErrors,
          },
        });
      }

      const route = await routeService.updateRoute(req.params.id, value);
      if (!route) {
        return res.status(404).json({
          success: false,
          error: { code: 'ROUTE_002', message: 'Route not found' },
        });
      }

      res.json({
        success: true,
        data: route,
        message: 'Route updated successfully',
      });
    } catch (err) {
      console.error('Error updating route:', err);
      res.status(409).json({
        success: false,
        error: { code: 'ROUTE_003', message: err.message },
      });
    }
  }

  async delete(req, res) {
    try {
      const route = await routeService.deleteRoute(req.params.id);
      if (!route) {
        return res.status(404).json({
          success: false,
          error: { code: 'ROUTE_002', message: 'Route not found' },
        });
      }
      res.json({ success: true, message: 'Route deleted successfully' });
    } catch (err) {
      console.error('Error deleting route:', err);
      let message = 'Internal server error';
      if (err.code === '23503') {
        message =
          'Cannot delete route because it is referenced by existing trips. Please delete the trips first.';
      }
      res.status(500).json({
        success: false,
        error: { code: 'SYS_001', message: message },
      });
    }
  }

  async addStop(req, res) {
    try {
      const { error, value } = addStopSchema.validate(req.body);
      if (error) {
        return res.status(422).json({
          success: false,
          error: { code: 'VAL_001', message: error.details },
        });
      }

      const stop = await routeService.addStopToRoute(req.params.id, value);
      res.status(201).json({
        success: true,
        data: stop,
        message: 'Stop added successfully',
      });
    } catch (err) {
      res.status(409).json({
        success: false,
        error: { code: 'ROUTE_004', message: err.message },
      });
    }
  }

  async getAll(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const search = req.query.search ? decodeURIComponent(req.query.search) : undefined;
      const min_distance = req.query.min_distance ? parseFloat(req.query.min_distance) : undefined;
      const max_distance = req.query.max_distance ? parseFloat(req.query.max_distance) : undefined;
      const min_duration = req.query.min_duration ? parseFloat(req.query.min_duration) : undefined;
      const max_duration = req.query.max_duration ? parseFloat(req.query.max_duration) : undefined;
      const origin = req.query.origin ? decodeURIComponent(req.query.origin) : undefined;
      const destination = req.query.destination
        ? decodeURIComponent(req.query.destination)
        : undefined;

      // Validate pagination parameters
      if (page < 1 || limit < 1 || limit > 100) {
        return res.status(400).json({
          success: false,
          error: { code: 'VAL_002', message: 'Invalid pagination parameters' },
        });
      }

      const offset = (page - 1) * limit;

      const result = await routeService.getAllRoutes({
        limit,
        offset,
        search,
        min_distance,
        max_distance,
        min_duration,
        max_duration,
        origin,
        destination,
      });

      const totalPages = Math.ceil(result.total / limit);

      res.json({
        success: true,
        data: result.data,
        pagination: {
          currentPage: page,
          totalPages: totalPages,
          totalItems: result.total,
          itemsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: { code: 'SYS_001', message: 'Internal server error' },
      });
    }
  }

  async getPopularRoutes(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      if (limit < 1 || limit > 50) {
        return res.status(400).json({
          success: false,
          error: { code: 'VAL_002', message: 'Limit must be between 1 and 50' },
        });
      }

      const routes = await routeService.getPopularRoutes(limit);

      res.json({
        success: true,
        data: routes,
        meta: {
          count: routes.length,
          limit,
        },
      });
    } catch (err) {
      console.error('Error in getPopularRoutes:', err);
      let message = 'Internal server error';
      if (err.code === '23503') {
        message =
          'Cannot delete route because it is referenced by existing trips. Please delete the trips first.';
      } else if (err.code === 'DUPLICATE_ROUTE') {
        message = err.message;
      }
      res.status(500).json({
        success: false,
        error: { code: 'SYS_001', message: message },
      });
    }
  }
}

module.exports = new RouteController();
