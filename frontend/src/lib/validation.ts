export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const vietnamPhonePattern = /^\+84\d{8,9}$/
export const strongPasswordPattern =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/

type LoginPayload = {
  identifier: string
  password: string
}

type RegisterPayload = {
  email: string
  phone: string
  password: string
  fullName: string
  role: string
}

const between = (value: string, min: number, max: number) => {
  const length = value.trim().length
  return length >= min && length <= max
}

const isValidEmail = (value: string) => emailPattern.test(value)

export function validateLogin(payload: LoginPayload) {
  const errors: Record<string, string> = {
    identifier: '',
    password: '',
  }

  if (!isValidEmail(payload.identifier)) {
    errors.identifier = 'Enter a valid email address.'
  }

  if (!payload.password.trim()) {
    errors.password = 'Password is required.'
  }

  return errors
}

export function validateRegister(payload: RegisterPayload) {
  const errors: Record<string, string> = {
    email: '',
    phone: '',
    password: '',
    fullName: '',
    role: '',
  }

  if (!emailPattern.test(payload.email)) {
    errors.email = 'Enter a valid email address.'
  }

  if (!vietnamPhonePattern.test(payload.phone)) {
    errors.phone = 'Phone must follow the +84XXXXXXXXX format.'
  }

  if (!strongPasswordPattern.test(payload.password)) {
    errors.password =
      'Password must include upper, lower, number, special char, min 8 chars.'
  }

  if (!between(payload.fullName, 2, 100)) {
    errors.fullName = 'Full name must be between 2 and 100 characters.'
  }

  if (payload.role !== 'passenger') {
    errors.role = 'Role must be passenger.'
  }

  return errors
}

export function hasErrors(errors: Record<string, string>) {
  return Object.values(errors).some((message) => Boolean(message))
}

// Route validation
type RoutePointPayload = {
  point_id?: string
  route_id?: string
  name: string
  address?: string
  sequence?: number
  arrival_offset_minutes?: number
  departure_offset_minutes?: number
  is_pickup?: boolean
  is_dropoff?: boolean
}

type RouteStopPayload = {
  stop_name: string
  address?: string
  sequence: number
  arrival_offset_minutes?: number
}

type CreateRoutePayload = {
  origin: string
  destination: string
  distance_km: number
  estimated_minutes: number
  pickup_points: RoutePointPayload[]
  dropoff_points: RoutePointPayload[]
  route_stops?: RouteStopPayload[]
}

type UpdateRoutePayload = Partial<CreateRoutePayload>

// const isValidUUID = (value: string) => {
//   const uuidPattern =
//     /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/
//   return uuidPattern.test(value)
// }

export function validateCreateRoute(payload: CreateRoutePayload) {
  const errors: Record<string, string> = {}

  // origin validation
  if (!payload.origin || !between(payload.origin, 2, 100)) {
    errors['origin'] = 'Origin must be between 2 and 100 characters'
  }

  // destination validation
  if (!payload.destination || !between(payload.destination, 2, 100)) {
    errors['destination'] = 'Destination must be between 2 and 100 characters'
  }

  // Check origin !== destination
  if (
    payload.origin?.toLowerCase().trim() ===
    payload.destination?.toLowerCase().trim()
  ) {
    errors['destination'] = 'Origin and destination cannot be the same'
  }

  // distance_km validation
  if (
    !payload.distance_km ||
    payload.distance_km < 1 ||
    payload.distance_km > 5000
  ) {
    errors['distance_km'] = 'Distance_km must be between 1 and 5000'
  }

  // estimated_minutes validation
  if (
    !payload.estimated_minutes ||
    payload.estimated_minutes < 10 ||
    payload.estimated_minutes > 10080
  ) {
    errors['estimated_minutes'] =
      'Estimated_minutes must be between 10 and 10080'
  }

  // pickup_points validation
  if (!payload.pickup_points || payload.pickup_points.length === 0) {
    errors['pickup_points'] = 'At least one pickup point is required'
  } else {
    payload.pickup_points.forEach((point, idx) => {
      if (!point.name || !between(point.name, 1, 100)) {
        errors[`pickup_points.${idx}.name`] =
          'Point name must be between 1 and 100 characters'
      }
      if (point.address && point.address.length > 255) {
        errors[`pickup_points.${idx}.address`] =
          'Address must not exceed 255 characters'
      }
    })
  }

  // dropoff_points validation
  if (!payload.dropoff_points || payload.dropoff_points.length === 0) {
    errors['dropoff_points'] = 'At least one dropoff point is required'
  } else {
    payload.dropoff_points.forEach((point, idx) => {
      if (!point.name || !between(point.name, 1, 100)) {
        errors[`dropoff_points.${idx}.name`] =
          'Point name must be between 1 and 100 characters'
      }
      if (point.address && point.address.length > 255) {
        errors[`dropoff_points.${idx}.address`] =
          'Address must not exceed 255 characters'
      }
    })
  }

  // route_stops validation
  if (payload.route_stops) {
    payload.route_stops.forEach((stop, idx) => {
      if (!stop.stop_name || !between(stop.stop_name, 1, 100)) {
        errors[`route_stops.${idx}.stop_name`] =
          'Stop name must be between 1 and 100 characters'
      }
      if (stop.address && stop.address.length > 255) {
        errors[`route_stops.${idx}.address`] =
          'Address must not exceed 255 characters'
      }
      if (!stop.sequence || stop.sequence < 1) {
        errors[`route_stops.${idx}.sequence`] = 'Sequence must be at least 1'
      }
      if (
        stop.arrival_offset_minutes !== undefined &&
        (typeof stop.arrival_offset_minutes !== 'number' ||
          stop.arrival_offset_minutes < 0)
      ) {
        errors[`route_stops.${idx}.arrival_offset_minutes`] =
          'arrival_offset_minutes must be positive (≥ 0)'
      }
    })
  }

  return errors
}

export function validateUpdateRoute(payload: UpdateRoutePayload) {
  const errors: Record<string, string> = {}

  // origin validation (if provided)
  if (payload.origin !== undefined && !between(payload.origin || '', 2, 100)) {
    errors['origin'] = 'origin must be between 2 and 100 characters'
  }

  // destination validation (if provided)
  if (
    payload.destination !== undefined &&
    !between(payload.destination || '', 2, 100)
  ) {
    errors['destination'] = 'destination must be between 2 and 100 characters'
  }

  // Check origin !== destination (if both provided)
  if (
    payload.origin &&
    payload.destination &&
    payload.origin.toLowerCase().trim() ===
      payload.destination.toLowerCase().trim()
  ) {
    errors['destination'] = 'Origin and destination cannot be the same'
  }

  // distance_km validation (if provided)
  if (
    payload.distance_km !== undefined &&
    (payload.distance_km < 1 || payload.distance_km > 5000)
  ) {
    errors['distance_km'] = 'distance_km must be between 1 and 5000'
  }

  // estimated_minutes validation (if provided)
  if (
    payload.estimated_minutes !== undefined &&
    (payload.estimated_minutes < 10 || payload.estimated_minutes > 10080)
  ) {
    errors['estimated_minutes'] =
      'estimated_minutes must be between 10 and 10080'
  }

  // pickup_points validation (if provided)
  if (payload.pickup_points) {
    if (payload.pickup_points.length === 0) {
      errors['pickup_points'] = 'At least one pickup point is required'
    } else {
      payload.pickup_points.forEach((point, idx) => {
        if (!point.name || !between(point.name, 1, 100)) {
          errors[`pickup_points.${idx}.name`] =
            'Point name must be between 1 and 100 characters'
        }
        if (point.address && point.address.length > 255) {
          errors[`pickup_points.${idx}.address`] =
            'Address must not exceed 255 characters'
        }
      })
    }
  }

  // dropoff_points validation (if provided)
  if (payload.dropoff_points) {
    if (payload.dropoff_points.length === 0) {
      errors['dropoff_points'] = 'At least one dropoff point is required'
    } else {
      payload.dropoff_points.forEach((point, idx) => {
        if (!point.name || !between(point.name, 1, 100)) {
          errors[`dropoff_points.${idx}.name`] =
            'Point name must be between 1 and 100 characters'
        }
        if (point.address && point.address.length > 255) {
          errors[`dropoff_points.${idx}.address`] =
            'Address must not exceed 255 characters'
        }
      })
    }
  }

  // route_stops validation (if provided)
  if (payload.route_stops) {
    payload.route_stops.forEach((stop, idx) => {
      if (!stop.stop_name || !between(stop.stop_name, 1, 100)) {
        errors[`route_stops.${idx}.stop_name`] =
          'Stop name must be between 1 and 100 characters'
      }
      if (stop.address && stop.address.length > 255) {
        errors[`route_stops.${idx}.address`] =
          'Address must not exceed 255 characters'
      }
      if (!stop.sequence || stop.sequence < 1) {
        errors[`route_stops.${idx}.sequence`] = 'Sequence must be at least 1'
      }
      if (
        stop.arrival_offset_minutes !== undefined &&
        (typeof stop.arrival_offset_minutes !== 'number' ||
          stop.arrival_offset_minutes < 0)
      ) {
        errors[`route_stops.${idx}.arrival_offset_minutes`] =
          'arrival_offset_minutes must be positive (≥ 0)'
      }
    })
  }

  return errors
}
