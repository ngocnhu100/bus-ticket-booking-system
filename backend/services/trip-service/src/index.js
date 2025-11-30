const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const tripController = require('./controllers/tripController');
const routeController = require('./controllers/routeController');
const busModelController = require('./controllers/busModelController');
const busController = require('./controllers/busController');
const { authenticate, authorize } = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Health check
app.get('/health', (req, res) => res.json({ status: 'healthy' }));

// --- Public routes ---
app.get('/search', tripController.search);

// **Các route cụ thể phải đứng trước `/:id`**
app.get('/routes', routeController.getAll);
app.get('/bus-models', busModelController.getAll);
app.get('/buses', authenticate, authorize(['admin']), busController.getAll);

// --- Dynamic trip route ---
app.get('/:id', tripController.getById);

// --- Admin: Trip management ---
app.post('/', authenticate, authorize(['admin']), tripController.create);
app.put('/:id', authenticate, authorize(['admin']), tripController.update);
app.delete('/:id', authenticate, authorize(['admin']), tripController.delete);

// --- Admin: Route management ---
app.post('/routes', authenticate, authorize(['admin']), routeController.create);
app.get('/routes/:id', authenticate, authorize(['admin']), routeController.getById);
app.put('/routes/:id', authenticate, authorize(['admin']), routeController.update);
app.delete('/routes/:id', authenticate, authorize(['admin']), routeController.delete);
app.post('/routes/:id/stops', authenticate, authorize(['admin']), routeController.addStop);

// --- Admin: Bus model management ---
app.post('/bus-models', authenticate, authorize(['admin']), busModelController.create);
app.put('/bus-models/:id', authenticate, authorize(['admin']), busModelController.update);
app.post('/bus-models/:id/seat-layout', authenticate, authorize(['admin']), busModelController.setSeatLayout);
app.get('/bus-models/:id', authenticate, authorize(['admin']), busModelController.getById);

// --- Admin: Bus management ---
app.post('/buses', authenticate, authorize(['admin']), busController.create);
app.get('/buses/:id', authenticate, authorize(['admin']), busController.getById);
app.put('/buses/:id', authenticate, authorize(['admin']), busController.update);
app.delete('/buses/:id', authenticate, authorize(['admin']), busController.delete);

// API kiểm tra xe có trống không (rất quan trọng khi tạo chuyến)
app.get('/buses/:id/availability', authenticate, authorize(['admin']), busController.checkAvailability);

// --- Error handling ---
app.use((err, req, res, next) => { 
    console.error('Trip Service Error:', err);
    res.status(500).json({ error: 'Internal Trip Service Error', details: err.message });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => console.log(`Trip Service running on ${PORT}`));
}

module.exports = app;
