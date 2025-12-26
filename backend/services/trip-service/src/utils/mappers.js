const mapToRouteAdminData = (routeData, stops = []) => {
  const mappedStops = stops.map((stop) => ({
    stop_id: stop.stop_id,
    route_id: stop.route_id,
    stop_name: stop.stop_name,
    sequence: stop.sequence,
    arrival_offset_minutes: stop.arrival_offset_minutes,
    departure_offset_minutes: stop.departure_offset_minutes,
    address: stop.address || '',
  }));

  const pickup_points = mappedStops.filter(
    (s) => stops.find((orig) => orig.stop_id === s.stop_id)?.is_pickup ?? true
  );
  const dropoff_points = mappedStops.filter(
    (s) => stops.find((orig) => orig.stop_id === s.stop_id)?.is_dropoff ?? true
  );

  return {
    route_id: routeData.route_id,
    operator_id: routeData.operator_id,
    origin: routeData.origin,
    destination: routeData.destination,
    distance_km: Number(routeData.distance_km),
    estimated_minutes: Number(routeData.estimated_minutes),
    pickup_points,
    dropoff_points,
    route_stops: mappedStops.length > 0 ? mappedStops : undefined,
    created_at: routeData.created_at?.toISOString() || undefined,
  };
};

const mapToRouteStop = (stopData) => ({
  stop_id: stopData.stop_id,
  route_id: stopData.route_id,
  stop_name: stopData.stop_name,
  sequence: Number(stopData.sequence),
  arrival_offset_minutes:
    stopData.arrival_offset_minutes !== undefined
      ? Number(stopData.arrival_offset_minutes)
      : undefined,
  departure_offset_minutes:
    stopData.departure_offset_minutes !== undefined
      ? Number(stopData.departure_offset_minutes)
      : undefined,
  address: stopData.address || undefined,
});

const mapToBusAdminData = (busData) => {
  // Handle image_url as JSONB array
  let image_urls = [];
  let image_url = null;

  if (busData.image_url) {
    // If it's already an array (parsed from JSONB)
    if (Array.isArray(busData.image_url)) {
      image_urls = busData.image_url.filter((url) => url); // Filter out empty strings
      image_url = image_urls[0] || null;
    } else if (typeof busData.image_url === 'string') {
      // If it's a string, try to parse as JSON
      try {
        const parsed = JSON.parse(busData.image_url);
        if (Array.isArray(parsed)) {
          image_urls = parsed.filter((url) => url);
          image_url = image_urls[0] || null;
        } else {
          image_url = busData.image_url;
          image_urls = [busData.image_url];
        }
      } catch {
        // If not JSON, treat as single URL
        image_url = busData.image_url;
        image_urls = [busData.image_url];
      }
    }
  }

  return {
    operator_id: busData.operator_id ? busData.operator_id.toString() : null,
    bus_id: busData.bus_id ? busData.bus_id.toString() : undefined,
    name: busData.model_name
      ? `${busData.model_name} (${busData.license_plate})`
      : busData.license_plate,
    model: busData.model_name || '',
    plate_number: busData.license_plate || busData.plate_number || '',
    type: busData.type || 'standard',
    capacity: Number(busData.seat_capacity || busData.total_seats || 0),
    amenities: busData.amenities
      ? Array.isArray(busData.amenities)
        ? busData.amenities
        : (() => {
            try {
              return JSON.parse(busData.amenities || '[]');
            } catch {
              return [];
            }
          })()
      : [],
    status: busData.status === 'active' ? 'active' : 'inactive',
    image_url: image_url,
    image_urls: image_urls,
    created_at: busData.created_at ? busData.created_at.toISOString() : undefined,
  };
};

module.exports = { mapToRouteAdminData, mapToRouteStop, mapToBusAdminData };
