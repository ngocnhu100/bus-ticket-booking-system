const mapToRouteAdminData = (routeData, stops = []) => {
  const mappedStops = stops.map(stop => ({
    stop_id: stop.stop_id,
    route_id: stop.route_id,
    stop_name: stop.stop_name,
    sequence: stop.sequence,
    arrival_offset_minutes: stop.arrival_offset_minutes,
    departure_offset_minutes: stop.departure_offset_minutes,
    address: stop.address || '', 
  }));

  const pickup_points = mappedStops.filter(s => stops.find(orig => orig.stop_id === s.stop_id)?.is_pickup ?? true);
  const dropoff_points = mappedStops.filter(s => stops.find(orig => orig.stop_id === s.stop_id)?.is_dropoff ?? true);

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
  arrival_offset_minutes: stopData.arrival_offset_minutes !== undefined ? Number(stopData.arrival_offset_minutes) : undefined,
  departure_offset_minutes: stopData.departure_offset_minutes !== undefined ? Number(stopData.departure_offset_minutes) : undefined,
  address: stopData.address || undefined, 
});

module.exports = { mapToRouteAdminData, mapToRouteStop };