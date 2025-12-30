import { request as apiRequest, requestFormData } from '@/api/auth'

export interface TripSearchParams {
  origin: string
  destination: string
  date: string
  passengers?: number
  busType?: string[]
  departureTime?: string[]
  minPrice?: number
  maxPrice?: number
  operator?: string[]
  amenities?: string[]
  page?: number
  limit?: number
}

export interface Amenity {
  id: string
  name: string
  icon?: string
}

export interface Bus {
  bus_id: string
  bus_type: string
  license_plate: string
  total_seats: number
  amenities: Amenity[]
}

export interface Operator {
  operator_id: string
  name: string
  rating?: number
  logo?: string
}

export interface Route {
  route_id: string
  origin: string
  destination: string
  distance: number
  estimated_duration: number
}

export interface Schedule {
  schedule_id: string
  departure_time: string
  arrival_time: string
  frequency: string
}

export interface Pricing {
  base_price: number
  currency: string
  discounts?: {
    type: string
    amount: number
  }[]
}

export interface Trip {
  trip_id: string
  route: Route
  operator: Operator
  bus: Bus
  schedule: Schedule
  pricing: Pricing
  availability: {
    available_seats: number
    total_seats: number
  }
}

export interface TripSearchResponse {
  success: boolean
  data: {
    trips: Trip[]
    totalCount: number
    page: number
    limit: number
  }
  timestamp: string
}

// ============================================================================
// RATING API INTERFACES AND FUNCTIONS
// ============================================================================

export interface RatingSubmission {
  bookingId: string
  tripId: string
  ratings: Record<string, number>
  review?: string
  photos?: File[] // File objects for upload
}

export interface RatingAPIRequest {
  bookingId: string
  tripId: string
  ratings: Record<string, number>
  review?: string
  photos?: string[] // base64 encoded images for API
}

export interface RatingResponse {
  success: boolean
  data: {
    ratingId: string
    message: string
  }
  timestamp: string
}

export interface OperatorRatingStats {
  averages: {
    overall: number
    cleanliness: number
    driver_behavior: number
    punctuality: number
    comfort: number
    value_for_money: number
  }
  distribution: Record<string, string> // "5": "40.0", etc.
  totalRatings: number
  reviewsCount: number
}

export interface OperatorRatingResponse {
  operatorId: string
  stats: OperatorRatingStats | null
  message?: string
}

export interface ReviewData {
  id: string
  authorName: string
  authorEmail?: string
  rating: number
  categoryRatings: Record<string, number>
  reviewText?: string
  photos?: string[]
  route?: string
  seatType?: string
  createdAt: Date | string
  updatedAt?: Date | string
  helpfulCount?: number
  userHelpful?: boolean
  isAuthor?: boolean
  canEdit?: boolean
  canDelete?: boolean
}

/**
 * Fetch rating statistics for an operator
 * Public endpoint - no authentication required
 */
export async function getOperatorRatings(
  operatorId: string
): Promise<OperatorRatingResponse> {
  try {
    const response = await apiRequest(
      `/trips/operators/${operatorId}/ratings`,
      {
        method: 'GET',
      }
    )
    return response
  } catch (error) {
    console.error('Failed to fetch operator ratings:', error)
    throw error
  }
}

/**
 * Submit a rating for a completed trip/booking
 * Requires authentication
 */
export async function submitRating(
  ratingData: RatingSubmission
): Promise<RatingResponse> {
  try {
    console.log(
      '🚀 [SUBMIT_RATING] Starting rating submission with photos:',
      ratingData.photos?.length || 0
    )

    // Handle photo uploads first if there are new photos
    const uploadedPhotoUrls: string[] = []
    if (ratingData.photos && ratingData.photos.length > 0) {
      console.log(
        '📸 [SUBMIT_RATING] Uploading',
        ratingData.photos.length,
        'photos'
      )
      for (const photo of ratingData.photos) {
        console.log(
          '📸 [SUBMIT_RATING] Uploading photo:',
          photo.name,
          photo.size
        )
        const formData = new FormData()
        formData.append('file', photo)

        const uploadResponse = await requestFormData('/trips/upload/image', {
          method: 'POST',
          body: formData,
        })

        console.log(
          '✅ [SUBMIT_RATING] Photo uploaded:',
          uploadResponse.data.url
        )
        uploadedPhotoUrls.push(uploadResponse.data.url.trim())
      }
      console.log(
        '📸 [SUBMIT_RATING] All photos uploaded:',
        uploadedPhotoUrls.length
      )
    } else {
      console.log('📸 [SUBMIT_RATING] No photos to upload')
    }

    const apiData: RatingAPIRequest = {
      bookingId: ratingData.bookingId,
      tripId: ratingData.tripId,
      ratings: ratingData.ratings,
      review: ratingData.review,
      photos: uploadedPhotoUrls, // Always send photos array, even if empty
    }

    console.log('📤 [SUBMIT_RATING] Sending to API:', {
      ...apiData,
      photos: apiData.photos?.length,
      photosContent: apiData.photos,
    })

    const response = await apiRequest('/trips/ratings', {
      method: 'POST',
      body: apiData,
    })
    return response
  } catch (error: unknown) {
    // Re-throw with more context
    if (
      error &&
      typeof error === 'object' &&
      'status' in error &&
      'code' in error &&
      ((error as unknown).status === 401 ||
        (error as unknown).code === 'AUTH_001' ||
        (error as unknown).code === 'AUTH_002')
    ) {
      console.error('🔐 Authentication failed for ratings submission', error)
      throw new Error('Please log in again to submit your review')
    }
    throw error
  }
}

/**
 * Fetch reviews for an operator
 * Public endpoint - no authentication required
 */
export async function getOperatorReviews(
  operatorId: string,
  params?: {
    page?: number
    limit?: number
    sortBy?: 'recent' | 'helpful' | 'rating-high' | 'rating-low'
    rating?: number
  }
): Promise<{
  success: boolean
  data: ReviewData[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  message?: string
}> {
  try {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.sortBy) queryParams.append('sort', params.sortBy)
    if (params?.rating) queryParams.append('rating', params.rating.toString())

    const queryString = queryParams.toString()
    const url = queryString
      ? `/trips/operators/${operatorId}/reviews?${queryString}`
      : `/trips/operators/${operatorId}/reviews`

    const response = await apiRequest(url, {
      method: 'GET',
    })
    return response
  } catch (error) {
    console.error('Failed to fetch operator reviews:', error)
    throw error
  }
}

/**
 * Fetch reviews for a specific trip
 * Public endpoint - no authentication required
 */
export async function getTripReviews(
  tripId: string,
  params?: {
    page?: number
    limit?: number
    sortBy?: 'recent' | 'helpful' | 'rating-high' | 'rating-low'
    rating?: number
  }
): Promise<{
  success: boolean
  data: ReviewData[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  message?: string
}> {
  try {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.sortBy) queryParams.append('sort', params.sortBy)
    if (params?.rating) queryParams.append('rating', params.rating.toString())

    const queryString = queryParams.toString()
    const url = queryString
      ? `/trips/${tripId}/reviews?${queryString}`
      : `/trips/${tripId}/reviews`

    const response = await apiRequest(url, {
      method: 'GET',
    })
    return response
  } catch (error) {
    console.error('Failed to fetch trip reviews:', error)
    throw error
  }
}

export async function searchTrips(
  params: TripSearchParams
): Promise<TripSearchResponse> {
  const queryParams = new URLSearchParams()

  // Required parameters
  queryParams.append('origin', params.origin)
  queryParams.append('destination', params.destination)
  queryParams.append('date', params.date)

  // Optional parameters
  if (params.passengers) {
    queryParams.append('passengers', params.passengers.toString())
  }

  if (params.busType && params.busType.length > 0) {
    params.busType.forEach((type) => queryParams.append('busType', type))
  }

  if (params.departureTime && params.departureTime.length > 0) {
    params.departureTime.forEach((time) =>
      queryParams.append('departureTime', time)
    )
  }

  if (params.minPrice !== undefined) {
    queryParams.append('minPrice', params.minPrice.toString())
  }

  if (params.maxPrice !== undefined) {
    queryParams.append('maxPrice', params.maxPrice.toString())
  }

  if (params.operator && params.operator.length > 0) {
    params.operator.forEach((op) => queryParams.append('operator', op))
  }

  if (params.amenities && params.amenities.length > 0) {
    params.amenities.forEach((amenity) =>
      queryParams.append('amenities', amenity)
    )
  }

  if (params.page) {
    queryParams.append('page', params.page.toString())
  }

  if (params.limit) {
    queryParams.append('limit', params.limit.toString())
  }

  const data = await apiRequest(`/trips/search?${queryParams.toString()}`, {
    method: 'GET',
  })

  return data
}

// ============================================================================
// SEAT LOCKING API FUNCTIONS
// ============================================================================

export interface SeatLockRequest {
  tripId: string
  seatCodes: string[]
  userId: string
  sessionId?: string
}

export interface SeatLockApiRequest {
  tripId: string
  seatCodes: string[]
  sessionId?: string
  isGuest?: boolean
}

export interface SeatLockResponse {
  success: boolean
  data: {
    locked_seats?: string[]
    transferred_seats?: string[]
    rejected_seats?: string[]
    expires_at: string
  }
  message?: string
}

export interface SeatLockExtendResponse {
  success: boolean
  data: {
    extended_seats: string[]
    expires_at: string
  }
  message?: string
}

export interface SeatLockReleaseResponse {
  success: boolean
  data: {
    released_seats: string[]
  }
  message?: string
}

export interface UserLocksResponse {
  success: boolean
  data: {
    trip_id: string
    user_id: string
    locked_seats: {
      seat_code: string
      locked_at: string
      expires_at: string
    }[]
  }
}

/**
 * Lock seats for a user during checkout process
 */
export async function lockSeats(
  request: SeatLockApiRequest
): Promise<SeatLockResponse> {
  const body: { seatCodes: string[]; sessionId?: string; isGuest?: boolean } = {
    seatCodes: request.seatCodes,
  }
  if (request.sessionId !== undefined) {
    body.sessionId = request.sessionId
  }
  if (request.isGuest !== undefined) {
    body.isGuest = request.isGuest
  }
  return await apiRequest(`/trips/${request.tripId}/seats/lock`, {
    method: 'POST',
    body,
  })
}

/**
 * Extend existing seat locks
 */
export async function extendSeatLocks(
  request: SeatLockApiRequest
): Promise<SeatLockExtendResponse> {
  const body: { seatCodes: string[]; sessionId?: string; isGuest?: boolean } = {
    seatCodes: request.seatCodes,
  }
  if (request.sessionId !== undefined) {
    body.sessionId = request.sessionId
  }
  if (request.isGuest !== undefined) {
    body.isGuest = request.isGuest
  }
  return await apiRequest(`/trips/${request.tripId}/seats/extend`, {
    method: 'POST',
    body,
  })
}

/**
 * Release specific seat locks
 */
export async function releaseSeatLocks(
  request: SeatLockApiRequest
): Promise<SeatLockReleaseResponse> {
  const body: { seatCodes: string[]; sessionId?: string; isGuest?: boolean } = {
    seatCodes: request.seatCodes,
  }
  if (request.sessionId !== undefined) {
    body.sessionId = request.sessionId
  }
  if (request.isGuest !== undefined) {
    body.isGuest = request.isGuest
  }
  return await apiRequest(`/trips/${request.tripId}/seats/release`, {
    method: 'POST',
    body,
  })
}

/**
 * Release all locks for a user
 */
export async function releaseAllSeatLocks(
  tripId: string,
  sessionId?: string,
  isGuest?: boolean
): Promise<SeatLockReleaseResponse> {
  const body: { sessionId?: string; isGuest?: boolean } = {}
  if (sessionId !== undefined) {
    body.sessionId = sessionId
  }
  if (isGuest !== undefined) {
    body.isGuest = isGuest
  }
  return await apiRequest(`/trips/${tripId}/seats/release-all`, {
    method: 'POST',
    body,
  })
}

/**
 * Get all active locks for a user for a specific trip
 */
export async function getUserLocks(
  tripId: string,
  sessionId?: string,
  isGuest?: boolean
): Promise<UserLocksResponse> {
  const queryParams = new URLSearchParams()
  if (sessionId !== undefined) {
    queryParams.append('sessionId', sessionId)
  }
  if (isGuest !== undefined) {
    queryParams.append('isGuest', isGuest.toString())
  }
  const queryString = queryParams.toString()
  const url = queryString
    ? `/trips/${encodeURIComponent(tripId)}/seats/my-locks?${queryString}`
    : `/trips/${encodeURIComponent(tripId)}/seats/my-locks`

  return await apiRequest(url, {
    method: 'GET',
  })
}

/**
 * Transfer guest locks to authenticated user
 */
export async function transferGuestLocks(
  tripId: string,
  guestSessionId: string,
  maxSeats: number = 5
): Promise<SeatLockResponse> {
  return await apiRequest(`/trips/${tripId}/seats/transfer-guest-locks`, {
    method: 'POST',
    body: { guestSessionId, maxSeats },
  })
}

/**
 * Update a review
 * Requires authentication
 */
export async function updateReview(
  ratingId: string,
  data: {
    review?: string
    photos?: string[]
    removedPhotos?: string[]
    newPhotos?: File[]
  }
): Promise<{
  success: boolean
  message: string
  rating?: {
    rating_id: string
    review_text?: string
    photos?: string[]
    updated_at: string
  }
}> {
  try {
    // Handle photo uploads first if there are new photos
    const uploadedPhotoUrls: string[] = []
    if (data.newPhotos && data.newPhotos.length > 0) {
      for (const photo of data.newPhotos) {
        const formData = new FormData()
        formData.append('file', photo)

        const uploadResponse = await requestFormData('/trips/upload/image', {
          method: 'POST',
          body: formData,
        })

        uploadedPhotoUrls.push(uploadResponse.data.url.trim())
      }
    }

    // Prepare update data
    const updateData: {
      review?: string
      photos?: string[]
    } = {}
    if (data.review !== undefined) updateData.review = data.review
    if (data.photos || uploadedPhotoUrls.length > 0) {
      const existingPhotos = (data.photos || []).map((url) => url.trim())
      updateData.photos = [...existingPhotos, ...uploadedPhotoUrls]
    }

    const response = await apiRequest(`/trips/ratings/${ratingId}`, {
      method: 'PATCH',
      body: updateData,
    })

    // Delete removed photos
    if (data.removedPhotos && data.removedPhotos.length > 0) {
      for (const photoUrl of data.removedPhotos) {
        const trimmedUrl = photoUrl.trim()
        // Extract public_id from Cloudinary URL
        const publicIdMatch = trimmedUrl.match(/\/v\d+\/(.+)\.[a-z]+$/i)
        if (publicIdMatch) {
          const publicId = publicIdMatch[1]
          try {
            await apiRequest(
              `/trips/upload/image?publicId=${encodeURIComponent(publicId)}`,
              {
                method: 'DELETE',
              }
            )
          } catch (deleteError) {
            console.warn('Failed to delete photo:', photoUrl, deleteError)
            // Don't fail the whole update if photo deletion fails
          }
        }
      }
    }

    return response
  } catch (error) {
    console.error('Failed to update review:', error)
    throw error
  }
}

/**
 * Delete a review
 * Requires authentication
 */
export async function deleteReview(ratingId: string): Promise<{
  success: boolean
  message: string
}> {
  try {
    const response = await apiRequest(`/trips/ratings/${ratingId}`, {
      method: 'DELETE',
    })
    return response
  } catch (error) {
    console.error('Failed to delete review:', error)
    throw error
  }
}

/**
 * Get review for a specific booking
 * Requires authentication
 */
export async function getBookingReview(bookingId: string): Promise<{
  success: boolean
  data: ReviewData | null
  message?: string
}> {
  try {
    const response = await apiRequest(`/trips/ratings/booking/${bookingId}`, {
      method: 'GET',
    })
    return response
  } catch (error) {
    console.error('Failed to get booking review:', error)
    throw error
  }
}
