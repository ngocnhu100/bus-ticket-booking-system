// Mock data for trips with detailed information
const mockTrips = [
  {
    tripId: 'TRIP001',
    route: {
      routeId: 'ROUTE001',
      origin: 'Ho Chi Minh City',
      destination: 'Hanoi',
      distance: 1720,
      estimatedDuration: 720 // minutes
    },
    operator: {
      operatorId: 'OP001',
      name: 'Futa Bus Lines',
      rating: 4.5,
      logo: 'https://via.placeholder.com/100x100?text=Futa'
    },
    bus: {
      busId: 'BUS001',
      busType: 'limousine',
      licensePlate: '59A-12345',
      totalSeats: 40,
      amenities: [
        { id: 'wifi', name: 'WiFi' },
        { id: 'ac', name: 'Air Conditioning' },
        { id: 'entertainment', name: 'Entertainment' }
      ]
    },
    schedule: {
      scheduleId: 'SCH001',
      departureTime: '08:00',
      arrivalTime: '20:00',
      frequency: 'daily'
    },
    pricing: {
      basePrice: 450000,
      currency: 'VND',
      discounts: []
    },
    availability: {
      availableSeats: 15,
      totalSeats: 40
    }
  },
  {
    tripId: 'TRIP002',
    route: {
      routeId: 'ROUTE001',
      origin: 'Ho Chi Minh City',
      destination: 'Hanoi',
      distance: 1720,
      estimatedDuration: 750
    },
    operator: {
      operatorId: 'OP002',
      name: 'Phuong Trang Express',
      rating: 4.8,
      logo: 'https://via.placeholder.com/100x100?text=PT'
    },
    bus: {
      busId: 'BUS002',
      busType: 'sleeper',
      licensePlate: '59B-67890',
      totalSeats: 36,
      amenities: [
        { id: 'wifi', name: 'WiFi' },
        { id: 'ac', name: 'Air Conditioning' },
        { id: 'toilet', name: 'Toilet' },
        { id: 'entertainment', name: 'Entertainment' }
      ]
    },
    schedule: {
      scheduleId: 'SCH002',
      departureTime: '14:00',
      arrivalTime: '02:30',
      frequency: 'daily'
    },
    pricing: {
      basePrice: 550000,
      currency: 'VND',
      discounts: []
    },
    availability: {
      availableSeats: 8,
      totalSeats: 36
    }
  },
  {
    tripId: 'TRIP003',
    route: {
      routeId: 'ROUTE001',
      origin: 'Ho Chi Minh City',
      destination: 'Hanoi',
      distance: 1720,
      estimatedDuration: 720
    },
    operator: {
      operatorId: 'OP003',
      name: 'Hoang Long Bus',
      rating: 4.2,
      logo: 'https://via.placeholder.com/100x100?text=HL'
    },
    bus: {
      busId: 'BUS003',
      busType: 'standard',
      licensePlate: '59C-11111',
      totalSeats: 45,
      amenities: [
        { id: 'ac', name: 'Air Conditioning' }
      ]
    },
    schedule: {
      scheduleId: 'SCH003',
      departureTime: '20:00',
      arrivalTime: '08:00',
      frequency: 'daily'
    },
    pricing: {
      basePrice: 320000,
      currency: 'VND',
      discounts: []
    },
    availability: {
      availableSeats: 25,
      totalSeats: 45
    }
  },
  {
    tripId: 'TRIP004',
    route: {
      routeId: 'ROUTE001',
      origin: 'Ho Chi Minh City',
      destination: 'Hanoi',
      distance: 1720,
      estimatedDuration: 690
    },
    operator: {
      operatorId: 'OP001',
      name: 'Futa Bus Lines',
      rating: 4.5,
      logo: 'https://via.placeholder.com/100x100?text=Futa'
    },
    bus: {
      busId: 'BUS004',
      busType: 'limousine',
      licensePlate: '59A-22222',
      totalSeats: 40,
      amenities: [
        { id: 'wifi', name: 'WiFi' },
        { id: 'ac', name: 'Air Conditioning' },
        { id: 'toilet', name: 'Toilet' }
      ]
    },
    schedule: {
      scheduleId: 'SCH004',
      departureTime: '06:30',
      arrivalTime: '18:00',
      frequency: 'daily'
    },
    pricing: {
      basePrice: 480000,
      currency: 'VND',
      discounts: []
    },
    availability: {
      availableSeats: 12,
      totalSeats: 40
    }
  },
  {
    tripId: 'TRIP005',
    route: {
      routeId: 'ROUTE001',
      origin: 'Ho Chi Minh City',
      destination: 'Hanoi',
      distance: 1720,
      estimatedDuration: 780
    },
    operator: {
      operatorId: 'OP004',
      name: 'Mai Linh Express',
      rating: 4.3,
      logo: 'https://via.placeholder.com/100x100?text=ML'
    },
    bus: {
      busId: 'BUS005',
      busType: 'standard',
      licensePlate: '59D-33333',
      totalSeats: 45,
      amenities: [
        { id: 'ac', name: 'Air Conditioning' },
        { id: 'wifi', name: 'WiFi' }
      ]
    },
    schedule: {
      scheduleId: 'SCH005',
      departureTime: '16:00',
      arrivalTime: '05:00',
      frequency: 'daily'
    },
    pricing: {
      basePrice: 380000,
      currency: 'VND',
      discounts: []
    },
    availability: {
      availableSeats: 30,
      totalSeats: 45
    }
  },
  {
    tripId: 'TRIP006',
    route: {
      routeId: 'ROUTE001',
      origin: 'Ho Chi Minh City',
      destination: 'Hanoi',
      distance: 1720,
      estimatedDuration: 720
    },
    operator: {
      operatorId: 'OP002',
      name: 'Phuong Trang Express',
      rating: 4.8,
      logo: 'https://via.placeholder.com/100x100?text=PT'
    },
    bus: {
      busId: 'BUS006',
      busType: 'sleeper',
      licensePlate: '59B-44444',
      totalSeats: 36,
      amenities: [
        { id: 'wifi', name: 'WiFi' },
        { id: 'ac', name: 'Air Conditioning' },
        { id: 'toilet', name: 'Toilet' },
        { id: 'entertainment', name: 'Entertainment' }
      ]
    },
    schedule: {
      scheduleId: 'SCH006',
      departureTime: '22:00',
      arrivalTime: '10:00',
      frequency: 'daily'
    },
    pricing: {
      basePrice: 580000,
      currency: 'VND',
      discounts: []
    },
    availability: {
      availableSeats: 5,
      totalSeats: 36
    }
  },
  {
    tripId: 'TRIP007',
    route: {
      routeId: 'ROUTE002',
      origin: 'Ho Chi Minh City',
      destination: 'Da Nang',
      distance: 964,
      estimatedDuration: 480
    },
    operator: {
      operatorId: 'OP001',
      name: 'Futa Bus Lines',
      rating: 4.5,
      logo: 'https://via.placeholder.com/100x100?text=Futa'
    },
    bus: {
      busId: 'BUS007',
      busType: 'limousine',
      licensePlate: '59A-55555',
      totalSeats: 40,
      amenities: [
        { id: 'wifi', name: 'WiFi' },
        { id: 'ac', name: 'Air Conditioning' },
        { id: 'entertainment', name: 'Entertainment' }
      ]
    },
    schedule: {
      scheduleId: 'SCH007',
      departureTime: '09:00',
      arrivalTime: '17:00',
      frequency: 'daily'
    },
    pricing: {
      basePrice: 350000,
      currency: 'VND',
      discounts: []
    },
    availability: {
      availableSeats: 18,
      totalSeats: 40
    }
  },
  {
    tripId: 'TRIP008',
    route: {
      routeId: 'ROUTE002',
      origin: 'Ho Chi Minh City',
      destination: 'Da Nang',
      distance: 964,
      estimatedDuration: 500
    },
    operator: {
      operatorId: 'OP002',
      name: 'Phuong Trang Express',
      rating: 4.8,
      logo: 'https://via.placeholder.com/100x100?text=PT'
    },
    bus: {
      busId: 'BUS008',
      busType: 'sleeper',
      licensePlate: '59B-66666',
      totalSeats: 36,
      amenities: [
        { id: 'wifi', name: 'WiFi' },
        { id: 'ac', name: 'Air Conditioning' },
        { id: 'toilet', name: 'Toilet' }
      ]
    },
    schedule: {
      scheduleId: 'SCH008',
      departureTime: '13:30',
      arrivalTime: '22:00',
      frequency: 'daily'
    },
    pricing: {
      basePrice: 420000,
      currency: 'VND',
      discounts: []
    },
    availability: {
      availableSeats: 10,
      totalSeats: 36
    }
  },
  {
    tripId: 'TRIP009',
    route: {
      routeId: 'ROUTE002',
      origin: 'Ho Chi Minh City',
      destination: 'Da Nang',
      distance: 964,
      estimatedDuration: 470
    },
    operator: {
      operatorId: 'OP003',
      name: 'Hoang Long Bus',
      rating: 4.2,
      logo: 'https://via.placeholder.com/100x100?text=HL'
    },
    bus: {
      busId: 'BUS009',
      busType: 'standard',
      licensePlate: '59C-77777',
      totalSeats: 45,
      amenities: [
        { id: 'ac', name: 'Air Conditioning' }
      ]
    },
    schedule: {
      scheduleId: 'SCH009',
      departureTime: '18:30',
      arrivalTime: '02:20',
      frequency: 'daily'
    },
    pricing: {
      basePrice: 290000,
      currency: 'VND',
      discounts: []
    },
    availability: {
      availableSeats: 35,
      totalSeats: 45
    }
  },
  {
    tripId: 'TRIP010',
    route: {
      routeId: 'ROUTE002',
      origin: 'Ho Chi Minh City',
      destination: 'Da Nang',
      distance: 964,
      estimatedDuration: 490
    },
    operator: {
      operatorId: 'OP004',
      name: 'Mai Linh Express',
      rating: 4.3,
      logo: 'https://via.placeholder.com/100x100?text=ML'
    },
    bus: {
      busId: 'BUS010',
      busType: 'limousine',
      licensePlate: '59D-88888',
      totalSeats: 40,
      amenities: [
        { id: 'wifi', name: 'WiFi' },
        { id: 'ac', name: 'Air Conditioning' },
        { id: 'toilet', name: 'Toilet' },
        { id: 'entertainment', name: 'Entertainment' }
      ]
    },
    schedule: {
      scheduleId: 'SCH010',
      departureTime: '21:00',
      arrivalTime: '05:10',
      frequency: 'daily'
    },
    pricing: {
      basePrice: 400000,
      currency: 'VND',
      discounts: []
    },
    availability: {
      availableSeats: 22,
      totalSeats: 40
    }
  },
  {
    tripId: 'TRIP011',
    route: {
      routeId: 'ROUTE002',
      origin: 'Ho Chi Minh City',
      destination: 'Da Nang',
      distance: 964,
      estimatedDuration: 480
    },
    operator: {
      operatorId: 'OP001',
      name: 'Futa Bus Lines',
      rating: 4.5,
      logo: 'https://via.placeholder.com/100x100?text=Futa'
    },
    bus: {
      busId: 'BUS011',
      busType: 'standard',
      licensePlate: '59A-99999',
      totalSeats: 45,
      amenities: [
        { id: 'ac', name: 'Air Conditioning' },
        { id: 'wifi', name: 'WiFi' }
      ]
    },
    schedule: {
      scheduleId: 'SCH011',
      departureTime: '07:00',
      arrivalTime: '15:00',
      frequency: 'daily'
    },
    pricing: {
      basePrice: 310000,
      currency: 'VND',
      discounts: []
    },
    availability: {
      availableSeats: 28,
      totalSeats: 45
    }
  },
  {
    tripId: 'TRIP012',
    route: {
      routeId: 'ROUTE003',
      origin: 'Hanoi',
      destination: 'Da Nang',
      distance: 763,
      estimatedDuration: 600
    },
    operator: {
      operatorId: 'OP002',
      name: 'Phuong Trang Express',
      rating: 4.8,
      logo: 'https://via.placeholder.com/100x100?text=PT'
    },
    bus: {
      busId: 'BUS012',
      busType: 'sleeper',
      licensePlate: '29A-11111',
      totalSeats: 36,
      amenities: [
        { id: 'wifi', name: 'WiFi' },
        { id: 'ac', name: 'Air Conditioning' },
        { id: 'toilet', name: 'Toilet' },
        { id: 'entertainment', name: 'Entertainment' }
      ]
    },
    schedule: {
      scheduleId: 'SCH012',
      departureTime: '10:00',
      arrivalTime: '20:00',
      frequency: 'daily'
    },
    pricing: {
      basePrice: 480000,
      currency: 'VND',
      discounts: []
    },
    availability: {
      availableSeats: 12,
      totalSeats: 36
    }
  },
  {
    tripId: 'TRIP013',
    route: {
      routeId: 'ROUTE003',
      origin: 'Hanoi',
      destination: 'Da Nang',
      distance: 763,
      estimatedDuration: 580
    },
    operator: {
      operatorId: 'OP001',
      name: 'Futa Bus Lines',
      rating: 4.5,
      logo: 'https://via.placeholder.com/100x100?text=Futa'
    },
    bus: {
      busId: 'BUS013',
      busType: 'limousine',
      licensePlate: '29A-22222',
      totalSeats: 40,
      amenities: [
        { id: 'wifi', name: 'WiFi' },
        { id: 'ac', name: 'Air Conditioning' },
        { id: 'entertainment', name: 'Entertainment' }
      ]
    },
    schedule: {
      scheduleId: 'SCH013',
      departureTime: '15:00',
      arrivalTime: '00:40',
      frequency: 'daily'
    },
    pricing: {
      basePrice: 440000,
      currency: 'VND',
      discounts: []
    },
    availability: {
      availableSeats: 20,
      totalSeats: 40
    }
  },
  {
    tripId: 'TRIP014',
    route: {
      routeId: 'ROUTE003',
      origin: 'Hanoi',
      destination: 'Da Nang',
      distance: 763,
      estimatedDuration: 620
    },
    operator: {
      operatorId: 'OP003',
      name: 'Hoang Long Bus',
      rating: 4.2,
      logo: 'https://via.placeholder.com/100x100?text=HL'
    },
    bus: {
      busId: 'BUS014',
      busType: 'standard',
      licensePlate: '29C-33333',
      totalSeats: 45,
      amenities: [
        { id: 'ac', name: 'Air Conditioning' }
      ]
    },
    schedule: {
      scheduleId: 'SCH014',
      departureTime: '19:00',
      arrivalTime: '05:20',
      frequency: 'daily'
    },
    pricing: {
      basePrice: 360000,
      currency: 'VND',
      discounts: []
    },
    availability: {
      availableSeats: 30,
      totalSeats: 45
    }
  },
  {
    tripId: 'TRIP015',
    route: {
      routeId: 'ROUTE001',
      origin: 'Ho Chi Minh City',
      destination: 'Hanoi',
      distance: 1720,
      estimatedDuration: 710
    },
    operator: {
      operatorId: 'OP001',
      name: 'Futa Bus Lines',
      rating: 4.5,
      logo: 'https://via.placeholder.com/100x100?text=Futa'
    },
    bus: {
      busId: 'BUS015',
      busType: 'sleeper',
      licensePlate: '59A-10101',
      totalSeats: 36,
      amenities: [
        { id: 'wifi', name: 'WiFi' },
        { id: 'ac', name: 'Air Conditioning' },
        { id: 'toilet', name: 'Toilet' },
        { id: 'entertainment', name: 'Entertainment' }
      ]
    },
    schedule: {
      scheduleId: 'SCH015',
      departureTime: '12:00',
      arrivalTime: '23:50',
      frequency: 'daily'
    },
    pricing: {
      basePrice: 560000,
      currency: 'VND',
      discounts: []
    },
    availability: {
      availableSeats: 7,
      totalSeats: 36
    }
  },
  {
    tripId: 'TRIP016',
    route: {
      routeId: 'ROUTE001',
      origin: 'Ho Chi Minh City',
      destination: 'Hanoi',
      distance: 1720,
      estimatedDuration: 730
    },
    operator: {
      operatorId: 'OP004',
      name: 'Mai Linh Express',
      rating: 4.3,
      logo: 'https://via.placeholder.com/100x100?text=ML'
    },
    bus: {
      busId: 'BUS016',
      busType: 'limousine',
      licensePlate: '59D-20202',
      totalSeats: 40,
      amenities: [
        { id: 'wifi', name: 'WiFi' },
        { id: 'ac', name: 'Air Conditioning' },
        { id: 'toilet', name: 'Toilet' }
      ]
    },
    schedule: {
      scheduleId: 'SCH016',
      departureTime: '23:00',
      arrivalTime: '11:10',
      frequency: 'daily'
    },
    pricing: {
      basePrice: 490000,
      currency: 'VND',
      discounts: []
    },
    availability: {
      availableSeats: 16,
      totalSeats: 40
    }
  },
  {
    tripId: 'TRIP017',
    route: {
      routeId: 'ROUTE001',
      origin: 'Ho Chi Minh City',
      destination: 'Hanoi',
      distance: 1720,
      estimatedDuration: 700
    },
    operator: {
      operatorId: 'OP003',
      name: 'Hoang Long Bus',
      rating: 4.2,
      logo: 'https://via.placeholder.com/100x100?text=HL'
    },
    bus: {
      busId: 'BUS017',
      busType: 'standard',
      licensePlate: '59C-30303',
      totalSeats: 45,
      amenities: [
        { id: 'ac', name: 'Air Conditioning' },
        { id: 'wifi', name: 'WiFi' }
      ]
    },
    schedule: {
      scheduleId: 'SCH017',
      departureTime: '10:30',
      arrivalTime: '22:10',
      frequency: 'daily'
    },
    pricing: {
      basePrice: 340000,
      currency: 'VND',
      discounts: []
    },
    availability: {
      availableSeats: 40,
      totalSeats: 45
    }
  },
  {
    tripId: 'TRIP018',
    route: {
      routeId: 'ROUTE002',
      origin: 'Ho Chi Minh City',
      destination: 'Da Nang',
      distance: 964,
      estimatedDuration: 485
    },
    operator: {
      operatorId: 'OP002',
      name: 'Phuong Trang Express',
      rating: 4.8,
      logo: 'https://via.placeholder.com/100x100?text=PT'
    },
    bus: {
      busId: 'BUS018',
      busType: 'sleeper',
      licensePlate: '59B-40404',
      totalSeats: 36,
      amenities: [
        { id: 'wifi', name: 'WiFi' },
        { id: 'ac', name: 'Air Conditioning' },
        { id: 'toilet', name: 'Toilet' },
        { id: 'entertainment', name: 'Entertainment' }
      ]
    },
    schedule: {
      scheduleId: 'SCH018',
      departureTime: '05:30',
      arrivalTime: '13:35',
      frequency: 'daily'
    },
    pricing: {
      basePrice: 430000,
      currency: 'VND',
      discounts: []
    },
    availability: {
      availableSeats: 14,
      totalSeats: 36
    }
  },
  {
    tripId: 'TRIP019',
    route: {
      routeId: 'ROUTE002',
      origin: 'Ho Chi Minh City',
      destination: 'Da Nang',
      distance: 964,
      estimatedDuration: 475
    },
    operator: {
      operatorId: 'OP004',
      name: 'Mai Linh Express',
      rating: 4.3,
      logo: 'https://via.placeholder.com/100x100?text=ML'
    },
    bus: {
      busId: 'BUS019',
      busType: 'standard',
      licensePlate: '59D-50505',
      totalSeats: 45,
      amenities: [
        { id: 'ac', name: 'Air Conditioning' }
      ]
    },
    schedule: {
      scheduleId: 'SCH019',
      departureTime: '11:00',
      arrivalTime: '18:55',
      frequency: 'daily'
    },
    pricing: {
      basePrice: 300000,
      currency: 'VND',
      discounts: []
    },
    availability: {
      availableSeats: 32,
      totalSeats: 45
    }
  },
  {
    tripId: 'TRIP020',
    route: {
      routeId: 'ROUTE002',
      origin: 'Ho Chi Minh City',
      destination: 'Da Nang',
      distance: 964,
      estimatedDuration: 495
    },
    operator: {
      operatorId: 'OP001',
      name: 'Futa Bus Lines',
      rating: 4.5,
      logo: 'https://via.placeholder.com/100x100?text=Futa'
    },
    bus: {
      busId: 'BUS020',
      busType: 'limousine',
      licensePlate: '59A-60606',
      totalSeats: 40,
      amenities: [
        { id: 'wifi', name: 'WiFi' },
        { id: 'ac', name: 'Air Conditioning' }
      ]
    },
    schedule: {
      scheduleId: 'SCH020',
      departureTime: '23:30',
      arrivalTime: '07:45',
      frequency: 'daily'
    },
    pricing: {
      basePrice: 370000,
      currency: 'VND',
      discounts: []
    },
    availability: {
      availableSeats: 24,
      totalSeats: 40
    }
  }
];

module.exports = mockTrips;
