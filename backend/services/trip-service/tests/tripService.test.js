const request = require('supertest');
const app = require('../src/index');

describe('Trip Service - Search Endpoint', () => {
  describe('GET /search', () => {
    it('should return trips when valid search parameters are provided', async () => {
      const response = await request(app)
        .get('/search')
        .query({
          origin: 'Ho Chi Minh City',
          destination: 'Hanoi',
          date: '2024-12-15',
          passengers: 2
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('trips');
      expect(response.body.data).toHaveProperty('totalCount');
      expect(response.body.data).toHaveProperty('page');
      expect(response.body.data).toHaveProperty('limit');
      expect(Array.isArray(response.body.data.trips)).toBe(true);
    });

    it('should filter trips by bus type', async () => {
      const response = await request(app)
        .get('/search')
        .query({
          origin: 'Ho Chi Minh City',
          destination: 'Hanoi',
          date: '2024-12-15',
          busType: 'limousine'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      response.body.data.trips.forEach(trip => {
        expect(trip.bus.busType).toBe('limousine');
      });
    });

    it('should filter trips by multiple bus types', async () => {
      const response = await request(app)
        .get('/search')
        .query({
          origin: 'Ho Chi Minh City',
          destination: 'Hanoi',
          date: '2024-12-15',
          busType: ['limousine', 'sleeper']
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      response.body.data.trips.forEach(trip => {
        expect(['limousine', 'sleeper']).toContain(trip.bus.busType);
      });
    });

    it('should filter trips by departure time', async () => {
      const response = await request(app)
        .get('/search')
        .query({
          origin: 'Ho Chi Minh City',
          destination: 'Hanoi',
          date: '2024-12-15',
          departureTime: 'morning'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      response.body.data.trips.forEach(trip => {
        const hour = parseInt(trip.schedule.departureTime.split(':')[0]);
        expect(hour).toBeGreaterThanOrEqual(6);
        expect(hour).toBeLessThan(12);
      });
    });

    it('should filter trips by price range', async () => {
      const response = await request(app)
        .get('/search')
        .query({
          origin: 'Ho Chi Minh City',
          destination: 'Hanoi',
          date: '2024-12-15',
          minPrice: 400000,
          maxPrice: 500000
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      response.body.data.trips.forEach(trip => {
        expect(trip.pricing.basePrice).toBeGreaterThanOrEqual(400000);
        expect(trip.pricing.basePrice).toBeLessThanOrEqual(500000);
      });
    });

    it('should filter trips by amenities', async () => {
      const response = await request(app)
        .get('/search')
        .query({
          origin: 'Ho Chi Minh City',
          destination: 'Hanoi',
          date: '2024-12-15',
          amenities: ['wifi', 'toilet']
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      response.body.data.trips.forEach(trip => {
        const amenityIds = trip.bus.amenities.map(a => a.id);
        expect(amenityIds).toContain('wifi');
        expect(amenityIds).toContain('toilet');
      });
    });

    it('should paginate results correctly', async () => {
      const response = await request(app)
        .get('/search')
        .query({
          origin: 'Ho Chi Minh City',
          destination: 'Hanoi',
          date: '2024-12-15',
          page: 1,
          limit: 5
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.limit).toBe(5);
      expect(response.body.data.trips.length).toBeLessThanOrEqual(5);
    });

    it('should return 400 when required parameters are missing', async () => {
      const response = await request(app)
        .get('/search')
        .query({
          origin: 'Ho Chi Minh City'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when invalid bus type is provided', async () => {
      const response = await request(app)
        .get('/search')
        .query({
          origin: 'Ho Chi Minh City',
          destination: 'Hanoi',
          date: '2024-12-15',
          busType: 'invalid-type'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when minPrice is greater than maxPrice', async () => {
      const response = await request(app)
        .get('/search')
        .query({
          origin: 'Ho Chi Minh City',
          destination: 'Hanoi',
          date: '2024-12-15',
          minPrice: 500000,
          maxPrice: 300000
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /:tripId', () => {
    it('should return trip details when valid trip ID is provided', async () => {
      const response = await request(app).get('/TRIP001');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('tripId', 'TRIP001');
      expect(response.body.data).toHaveProperty('route');
      expect(response.body.data).toHaveProperty('operator');
      expect(response.body.data).toHaveProperty('bus');
      expect(response.body.data).toHaveProperty('schedule');
    });

    it('should return 404 when trip ID is not found', async () => {
      const response = await request(app).get('/TRIP999');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('GET /operators', () => {
    it('should return list of all operators', async () => {
      const response = await request(app).get('/operators');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('operatorId');
      expect(response.body.data[0]).toHaveProperty('name');
    });
  });

  describe('GET /routes', () => {
    it('should return list of all routes', async () => {
      const response = await request(app).get('/routes');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('routeId');
      expect(response.body.data[0]).toHaveProperty('origin');
      expect(response.body.data[0]).toHaveProperty('destination');
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('service', 'trip-service-test');
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
    });
  });
});
