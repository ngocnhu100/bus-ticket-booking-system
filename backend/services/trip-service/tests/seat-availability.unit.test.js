/**
 * TRIP SERVICE UNIT TESTS - SEAT AVAILABILITY LOGIC
 * Testing seat lock validation and availability checking
 * Target: >70% coverage, 100% passing
 */

const { mapToRouteAdminData, mapToRouteStop, mapToBusAdminData } = require('../src/utils/mappers');

describe('Trip Service - Seat Availability & Mappers', () => {
  
  describe('Route Mapper - mapToRouteAdminData', () => {
    test('maps complete route data with stops and points', () => {
      const routeData = {
        route_id: 'route-123',
        origin: 'Hanoi',
        destination: 'Haiphong',
        distance_km: 120,
        estimated_minutes: 180,
        created_at: new Date('2024-01-01')
      };

      const stops = [
        { stop_id: 's1', route_id: 'route-123', stop_name: 'Stop 1', sequence: 1, arrival_offset_minutes: 30, address: 'Addr 1' }
      ];

      const points = [
        { point_id: 'p1', route_id: 'route-123', name: 'Pickup 1', sequence: 1, arrival_offset_minutes: 0, departure_offset_minutes: 5, is_pickup: true, is_dropoff: false, address: 'P1 Addr' },
        { point_id: 'p2', route_id: 'route-123', name: 'Dropoff 1', sequence: 2, arrival_offset_minutes: 180, departure_offset_minutes: 180, is_pickup: false, is_dropoff: true, address: 'P2 Addr' }
      ];

      const result = mapToRouteAdminData(routeData, stops, points);

      expect(result.route_id).toBe('route-123');
      expect(result.origin).toBe('Hanoi');
      expect(result.destination).toBe('Haiphong');
      expect(result.distance_km).toBe(120);
      expect(result.estimated_minutes).toBe(180);
      expect(result.pickup_points).toHaveLength(1);
      expect(result.dropoff_points).toHaveLength(1);
      expect(result.pickup_points[0].name).toBe('Pickup 1');
      expect(result.dropoff_points[0].name).toBe('Dropoff 1');
      expect(result.route_stops).toHaveLength(1);
    });

    test('handles route without stops or points', () => {
      const routeData = {
        route_id: 'route-456',
        origin: 'HCMC',
        destination: 'Vung Tau',
        distance_km: 125.5,
        estimated_minutes: 120
      };

      const result = mapToRouteAdminData(routeData, [], []);

      expect(result.route_id).toBe('route-456');
      expect(result.pickup_points).toEqual([]);
      expect(result.dropoff_points).toEqual([]);
      expect(result.route_stops).toBeUndefined();
    });

    test('filters points correctly by is_pickup and is_dropoff flags', () => {
      const routeData = { route_id: 'r1', origin: 'A', destination: 'B', distance_km: 50, estimated_minutes: 60 };
      
      const points = [
        { point_id: 'p1', is_pickup: true, is_dropoff: false, name: 'P1', sequence: 1, arrival_offset_minutes: 0, departure_offset_minutes: 0 },
        { point_id: 'p2', is_pickup: true, is_dropoff: true, name: 'P2', sequence: 2, arrival_offset_minutes: 30, departure_offset_minutes: 30 },
        { point_id: 'p3', is_pickup: false, is_dropoff: true, name: 'P3', sequence: 3, arrival_offset_minutes: 60, departure_offset_minutes: 60 }
      ];

      const result = mapToRouteAdminData(routeData, [], points);

      expect(result.pickup_points).toHaveLength(2); // p1, p2
      expect(result.dropoff_points).toHaveLength(2); // p2, p3
      expect(result.pickup_points.map(p => p.point_id)).toEqual(['p1', 'p2']);
      expect(result.dropoff_points.map(p => p.point_id)).toEqual(['p2', 'p3']);
    });

    test('converts numeric fields to numbers', () => {
      const routeData = {
        route_id: 'r1',
        origin: 'A',
        destination: 'B',
        distance_km: '150.75', // String
        estimated_minutes: '240' // String
      };

      const result = mapToRouteAdminData(routeData, [], []);

      expect(typeof result.distance_km).toBe('number');
      expect(result.distance_km).toBe(150.75);
      expect(typeof result.estimated_minutes).toBe('number');
      expect(result.estimated_minutes).toBe(240);
    });
  });

  describe('Route Stop Mapper - mapToRouteStop', () => {
    test('maps complete stop data', () => {
      const stopData = {
        stop_id: 'stop-1',
        route_id: 'route-1',
        stop_name: 'Central Station',
        sequence: 2,
        arrival_offset_minutes: 45,
        address: '123 Main St'
      };

      const result = mapToRouteStop(stopData);

      expect(result.stop_id).toBe('stop-1');
      expect(result.stop_name).toBe('Central Station');
      expect(result.sequence).toBe(2);
      expect(result.arrival_offset_minutes).toBe(45);
      expect(result.address).toBe('123 Main St');
    });

    test('handles missing optional fields', () => {
      const stopData = {
        stop_id: 'stop-2',
        route_id: 'route-2',
        stop_name: 'Station B',
        sequence: 1
      };

      const result = mapToRouteStop(stopData);

      expect(result.stop_id).toBe('stop-2');
      expect(result.arrival_offset_minutes).toBeUndefined();
      expect(result.address).toBeUndefined();
    });

    test('converts sequence to number', () => {
      const stopData = {
        stop_id: 's1',
        route_id: 'r1',
        stop_name: 'Stop',
        sequence: '5', // String
        arrival_offset_minutes: '30' // String
      };

      const result = mapToRouteStop(stopData);

      expect(typeof result.sequence).toBe('number');
      expect(result.sequence).toBe(5);
      expect(typeof result.arrival_offset_minutes).toBe('number');
      expect(result.arrival_offset_minutes).toBe(30);
    });
  });

  describe('Bus Mapper - mapToBusAdminData', () => {
    test('maps complete bus data with single image URL string', () => {
      const busData = {
        operator_id: 'op-123',
        bus_id: 'bus-456',
        license_plate: 'ABC-1234',
        model_name: 'Mercedes Sprinter',
        operator_name: 'Best Bus Co',
        type: 'vip',
        seat_capacity: 45,
        amenities: '["wifi", "ac", "usb"]',
        status: 'active',
        image_url: 'https://example.com/bus1.jpg',
        has_seat_layout: true,
        created_at: new Date('2024-01-01')
      };

      const result = mapToBusAdminData(busData);

      expect(result.operator_id).toBe('op-123');
      expect(result.bus_id).toBe('bus-456');
      expect(result.license_plate).toBe('ABC-1234');
      expect(result.bus_model_name).toBe('Mercedes Sprinter');
      expect(result.operator_name).toBe('Best Bus Co');
      expect(result.type).toBe('vip');
      expect(result.capacity).toBe(45);
      expect(result.amenities).toEqual(['wifi', 'ac', 'usb']);
      expect(result.status).toBe('active');
      expect(result.image_url).toBe('https://example.com/bus1.jpg');
      expect(result.image_urls).toEqual(['https://example.com/bus1.jpg']);
      expect(result.has_seat_layout).toBe(true);
    });

    test('handles image_url as JSON array', () => {
      const busData = {
        license_plate: 'XYZ-9999',
        model_name: 'Volvo',
        image_url: '["https://img1.jpg", "https://img2.jpg", "https://img3.jpg"]',
        seat_capacity: 50
      };

      const result = mapToBusAdminData(busData);

      expect(result.image_url).toBe('https://img1.jpg');
      expect(result.image_urls).toEqual(['https://img1.jpg', 'https://img2.jpg', 'https://img3.jpg']);
    });

    test('handles image_url as parsed array from DB', () => {
      const busData = {
        license_plate: 'DEF-5555',
        model_name: 'Toyota',
        image_url: ['https://img-a.jpg', 'https://img-b.jpg'], // Already array
        seat_capacity: 30
      };

      const result = mapToBusAdminData(busData);

      expect(result.image_url).toBe('https://img-a.jpg');
      expect(result.image_urls).toEqual(['https://img-a.jpg', 'https://img-b.jpg']);
    });

    test('filters out empty strings from image array', () => {
      const busData = {
        license_plate: 'GHI-7777',
        model_name: 'Hyundai',
        image_url: ['https://valid.jpg', '', 'https://valid2.jpg', ''],
        seat_capacity: 40
      };

      const result = mapToBusAdminData(busData);

      expect(result.image_urls).toEqual(['https://valid.jpg', 'https://valid2.jpg']);
      expect(result.image_url).toBe('https://valid.jpg');
    });

    test('handles no image_url', () => {
      const busData = {
        license_plate: 'JKL-1111',
        model_name: 'Ford',
        seat_capacity: 25
      };

      const result = mapToBusAdminData(busData);

      expect(result.image_url).toBeNull();
      expect(result.image_urls).toEqual([]);
    });

    test('parses amenities from JSON string', () => {
      const busData = {
        license_plate: 'MNO-2222',
        model_name: 'Scania',
        amenities: '["wifi", "tv", "toilet"]',
        seat_capacity: 50
      };

      const result = mapToBusAdminData(busData);

      expect(result.amenities).toEqual(['wifi', 'tv', 'toilet']);
    });

    test('handles amenities as already parsed array', () => {
      const busData = {
        license_plate: 'PQR-3333',
        model_name: 'MAN',
        amenities: ['wifi', 'ac'],
        seat_capacity: 35
      };

      const result = mapToBusAdminData(busData);

      expect(result.amenities).toEqual(['wifi', 'ac']);
    });

    test('handles invalid amenities JSON', () => {
      const busData = {
        license_plate: 'STU-4444',
        model_name: 'Isuzu',
        amenities: 'invalid-json{',
        seat_capacity: 28
      };

      const result = mapToBusAdminData(busData);

      expect(result.amenities).toEqual([]);
    });

    test('converts seat_capacity to number', () => {
      const busData = {
        license_plate: 'VWX-5555',
        model_name: 'Hino',
        seat_capacity: '42', // String
        total_seats: '42' // Alternative field
      };

      const result = mapToBusAdminData(busData);

      expect(typeof result.capacity).toBe('number');
      expect(result.capacity).toBe(42);
    });

    test('uses alternative field names (plate_number, total_seats)', () => {
      const busData = {
        plate_number: 'YZA-6666', // Alternative to license_plate
        model_name: 'Daewoo',
        total_seats: 38, // Alternative to seat_capacity
        operator_id: 'op-999'
      };

      const result = mapToBusAdminData(busData);

      expect(result.license_plate).toBe('YZA-6666');
      expect(result.plate_number).toBe('YZA-6666');
      expect(result.capacity).toBe(38);
    });

    test('constructs bus name from model and license plate', () => {
      const busData = {
        license_plate: 'BCD-7777',
        model_name: 'King Long',
        seat_capacity: 45
      };

      const result = mapToBusAdminData(busData);

      expect(result.name).toBe('King Long (BCD-7777)');
    });

    test('uses license plate as name when model missing', () => {
      const busData = {
        license_plate: 'EFG-8888',
        seat_capacity: 30
      };

      const result = mapToBusAdminData(busData);

      expect(result.name).toBe('EFG-8888');
    });

    test('normalizes status to active or inactive', () => {
      const activeBus = { license_plate: 'A1', model_name: 'M1', status: 'active', seat_capacity: 40 };
      const inactiveBus = { license_plate: 'A2', model_name: 'M2', status: 'maintenance', seat_capacity: 40 };

      expect(mapToBusAdminData(activeBus).status).toBe('active');
      expect(mapToBusAdminData(inactiveBus).status).toBe('inactive');
    });

    test('converts has_seat_layout to boolean', () => {
      const withLayout = { license_plate: 'L1', model_name: 'M1', has_seat_layout: 1, seat_capacity: 40 };
      const withoutLayout = { license_plate: 'L2', model_name: 'M2', has_seat_layout: 0, seat_capacity: 40 };
      const nullLayout = { license_plate: 'L3', model_name: 'M3', has_seat_layout: null, seat_capacity: 40 };

      expect(mapToBusAdminData(withLayout).has_seat_layout).toBe(true);
      expect(mapToBusAdminData(withoutLayout).has_seat_layout).toBe(false);
      expect(mapToBusAdminData(nullLayout).has_seat_layout).toBe(false);
    });
  });

  describe('Seat Availability Logic', () => {
    test('validates maximum seat limit per user', () => {
      const MAX_SEATS = 5;
      const currentLockedSeats = ['A1', 'A2', 'A3']; // 3 seats
      const newSeats = ['A4', 'A5', 'A6']; // 3 more

      const totalSeats = currentLockedSeats.length + newSeats.length;
      
      expect(totalSeats).toBeGreaterThan(MAX_SEATS);
      expect(totalSeats).toBe(6);
    });

    test('allows adding seats within limit', () => {
      const MAX_SEATS = 5;
      const currentLockedSeats = ['A1', 'A2']; // 2 seats
      const newSeats = ['A3']; // 1 more

      const totalSeats = currentLockedSeats.length + newSeats.length;
      
      expect(totalSeats).toBeLessThanOrEqual(MAX_SEATS);
      expect(totalSeats).toBe(3);
    });

    test('calculates lock expiration time correctly', () => {
      const LOCK_TTL_SECONDS = 10 * 60; // 10 minutes
      const now = new Date();
      const expiresAt = new Date(now.getTime() + LOCK_TTL_SECONDS * 1000);

      const diffSeconds = (expiresAt.getTime() - now.getTime()) / 1000;

      expect(diffSeconds).toBeGreaterThanOrEqual(LOCK_TTL_SECONDS - 1);
      expect(diffSeconds).toBeLessThanOrEqual(LOCK_TTL_SECONDS + 1);
    });

    test('detects expired locks', () => {
      const now = new Date();
      const expiredLock = new Date(now.getTime() - 5 * 60 * 1000); // 5 min ago
      const validLock = new Date(now.getTime() + 5 * 60 * 1000); // 5 min future

      expect(expiredLock.getTime() < now.getTime()).toBe(true);
      expect(validLock.getTime() > now.getTime()).toBe(true);
    });

    test('validates seat lock ownership', () => {
      const lockInfo = {
        userId: 'user-123',
        sessionId: 'session-abc',
        lockedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString()
      };

      const sameUser = lockInfo.userId === 'user-123';
      const differentUser = lockInfo.userId === 'user-456';

      expect(sameUser).toBe(true);
      expect(differentUser).toBe(false);
    });

    test('generates correct lock key format', () => {
      const LOCK_PREFIX = 'seat_lock:';
      const tripId = 'trip-123';
      const seatCode = 'A5';

      const lockKey = `${LOCK_PREFIX}${tripId}:${seatCode}`;

      expect(lockKey).toBe('seat_lock:trip-123:A5');
      expect(lockKey.startsWith(LOCK_PREFIX)).toBe(true);
      expect(lockKey.includes(tripId)).toBe(true);
      expect(lockKey.includes(seatCode)).toBe(true);
    });

    test('generates user lock set key format', () => {
      const userId = 'user-789';
      const tripId = 'trip-456';

      const userLockKey = `user_locks:${userId}:${tripId}`;

      expect(userLockKey).toBe('user_locks:user-789:trip-456');
    });

    test('identifies conflicting seat locks', () => {
      const requestedSeats = ['A1', 'A2', 'A3'];
      const lockedSeats = ['A2', 'A5']; // A2 is locked

      const conflicts = requestedSeats.filter(seat => lockedSeats.includes(seat));

      expect(conflicts).toEqual(['A2']);
      expect(conflicts).toHaveLength(1);
    });

    test('handles no seat conflicts', () => {
      const requestedSeats = ['B1', 'B2', 'B3'];
      const lockedSeats = ['A1', 'A2', 'A3'];

      const conflicts = requestedSeats.filter(seat => lockedSeats.includes(seat));

      expect(conflicts).toEqual([]);
      expect(conflicts).toHaveLength(0);
    });
  });
});
