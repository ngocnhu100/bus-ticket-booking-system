const db = require('../database');

/**
 * Submit a rating for a completed booking
 * POST /api/ratings
 * Body: { bookingId, tripId, ratings: { overall, cleanliness, driver_behavior, punctuality, comfort, value_for_money }, review?, photos? }
 */
const submitRating = async (req, res) => {
  try {
    console.log('🔍 [RATING] Starting rating submission');
    console.log('🔍 [RATING] Request body:', JSON.stringify(req.body, null, 2));
    console.log('🔍 [RATING] User info:', req.user);

    const { v4: uuid } = await import('uuid');
    const userId = req.user?.userId;
    console.log('🔍 [RATING] Extracted userId:', userId);

    if (!userId) {
      console.log('❌ [RATING] Authentication failed - no userId');
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { bookingId, tripId, ratings, review, photos } = req.body;
    console.log('🔍 [RATING] Extracted fields:', {
      bookingId,
      tripId,
      ratings,
      review,
      photos: photos,
      photosType: typeof photos,
      photosLength: photos?.length,
    });

    // Validate required fields
    if (!bookingId || !tripId || !ratings) {
      console.log('❌ [RATING] Validation failed - missing required fields:', {
        bookingId,
        tripId,
        ratings,
      });
      return res.status(400).json({ error: 'Missing required fields' });
    }
    console.log('✅ [RATING] Required fields validation passed');

    // Validate all category ratings
    const requiredCategories = [
      'overall',
      'cleanliness',
      'driver_behavior',
      'punctuality',
      'comfort',
      'value_for_money',
    ];
    for (const category of requiredCategories) {
      if (!ratings[category] || ratings[category] < 1 || ratings[category] > 5) {
        console.log(
          '❌ [RATING] Validation failed - invalid rating for category:',
          category,
          'value:',
          ratings[category]
        );
        return res.status(400).json({ error: `Invalid ${category} rating. Must be 1-5.` });
      }
    }
    console.log('✅ [RATING] Category ratings validation passed');

    // Validate review text if provided
    if (review && review.length > 500) {
      console.log('❌ [RATING] Validation failed - review too long:', review.length, 'characters');
      return res.status(400).json({ error: 'Review text must be 500 characters or less' });
    }
    // Parse photos if provided
    let parsedPhotos = [];
    if (photos) {
      if (Array.isArray(photos)) {
        // Photos is already an array from frontend
        parsedPhotos = photos;
        console.log('🔍 [RATING] Photos is array:', parsedPhotos);
      } else if (typeof photos === 'string') {
        // Photos is a JSON string
        try {
          parsedPhotos = JSON.parse(photos);
          console.log('🔍 [RATING] Parsed photos from string:', parsedPhotos);
        } catch (error) {
          console.error('❌ [RATING] Error parsing photos string:', error);
          return res.status(400).json({ error: 'Invalid photos format' });
        }
      } else {
        console.error('❌ [RATING] Photos has invalid type:', typeof photos);
        return res.status(400).json({ error: 'Invalid photos format' });
      }
    }

    // Check if booking exists and belongs to user
    console.log('🔍 [RATING] Checking booking existence with:', { bookingId, userId });
    const bookingResult = await db.query(
      `SELECT b.*, t.departure_time, bus.operator_id
             FROM bookings b
             JOIN trips t ON b.trip_id = t.trip_id
             JOIN buses bus ON t.bus_id = bus.bus_id
             WHERE b.booking_id = $1 AND b.user_id = $2`,
      [bookingId, userId]
    );
    console.log('🔍 [RATING] Booking query result:', {
      rowCount: bookingResult.rows.length,
      firstRow: bookingResult.rows[0],
    });

    if (bookingResult.rows.length === 0) {
      console.log('❌ [RATING] Booking not found for user');
      return res.status(404).json({ error: 'Booking not found' });
    }
    console.log('✅ [RATING] Booking found and belongs to user');

    const booking = bookingResult.rows[0];
    const operatorId = booking.operator_id;
    console.log('🔍 [RATING] Booking details:', {
      status: booking.status,
      operatorId,
      departureTime: booking.departure_time,
    });

    // Check if booking is completed
    if (booking.status !== 'completed') {
      console.log('❌ [RATING] Booking not completed - status:', booking.status);
      return res.status(400).json({ error: 'Only completed bookings can be rated' });
    }
    console.log('✅ [RATING] Booking is completed');

    // Check if within 60 days of trip completion
    const tripDate = new Date(booking.departure_time);
    const now = new Date();
    const daysSince = (now - tripDate) / (1000 * 60 * 60 * 24);
    console.log('🔍 [RATING] Date validation:', { tripDate, now, daysSince });

    if (daysSince > 60) {
      console.log('❌ [RATING] Rating window expired - days since trip:', daysSince);
      return res.status(400).json({
        error: 'Rating window has expired. You can only rate within 60 days of trip completion.',
      });
    }
    console.log('✅ [RATING] Within rating window');

    // Check if already rated
    console.log('🔍 [RATING] Checking for existing rating with bookingId:', bookingId);
    const existingRating = await db.query('SELECT rating_id FROM ratings WHERE booking_id = $1', [
      bookingId,
    ]);
    console.log('🔍 [RATING] Existing rating check result:', {
      rowCount: existingRating.rows.length,
    });

    if (existingRating.rows.length > 0) {
      console.log(
        '❌ [RATING] Booking already rated - ratingId:',
        existingRating.rows[0].rating_id
      );
      return res.status(400).json({ error: 'This booking has already been rated' });
    }
    console.log('✅ [RATING] No existing rating found');

    // Insert rating
    const ratingId = uuid();
    console.log('🔍 [RATING] Inserting rating with data:', {
      ratingId,
      bookingId,
      tripId,
      operatorId,
      userId,
      ratings,
      photos: parsedPhotos,
    });

    const result = await db.query(
      `INSERT INTO ratings (
                rating_id, booking_id, trip_id, operator_id, user_id,
                overall_rating, cleanliness_rating, driver_behavior_rating,
                punctuality_rating, comfort_rating, value_for_money_rating,
                review_text, photos
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING *`,
      [
        ratingId,
        bookingId,
        tripId,
        operatorId,
        userId,
        ratings.overall,
        ratings.cleanliness,
        ratings.driver_behavior,
        ratings.punctuality,
        ratings.comfort,
        ratings.value_for_money,
        review || null,
        photos ? JSON.stringify(parsedPhotos) : '[]',
      ]
    );

    console.log('✅ [RATING] Rating submitted successfully - ratingId:', ratingId);
    res.status(201).json({
      message: 'Rating submitted successfully',
      rating: result.rows[0],
    });
  } catch (error) {
    console.error('❌ [RATING] Error submitting rating:', error);
    console.error('❌ [RATING] Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });
    res.status(500).json({ error: 'Failed to submit rating' });
  }
};

/**
 * Get rating stats for a trip
 * GET /api/trips/:tripId/ratings
 */
const getTripRatings = async (req, res) => {
  try {
    const { tripId } = req.params;

    // Get all approved ratings for the trip
    const ratingsResult = await db.query(
      `SELECT 
                AVG(overall_rating) as avg_overall,
                AVG(cleanliness_rating) as avg_cleanliness,
                AVG(driver_behavior_rating) as avg_driver_behavior,
                AVG(punctuality_rating) as avg_punctuality,
                AVG(comfort_rating) as avg_comfort,
                AVG(value_for_money_rating) as avg_value_for_money,
                COUNT(*) as total_ratings,
                COUNT(CASE WHEN overall_rating = 5 THEN 1 END) as rating_5,
                COUNT(CASE WHEN overall_rating = 4 THEN 1 END) as rating_4,
                COUNT(CASE WHEN overall_rating = 3 THEN 1 END) as rating_3,
                COUNT(CASE WHEN overall_rating = 2 THEN 1 END) as rating_2,
                COUNT(CASE WHEN overall_rating = 1 THEN 1 END) as rating_1,
                COUNT(CASE WHEN review_text IS NOT NULL THEN 1 END) as reviews_count
            FROM ratings
            WHERE trip_id = $1 AND is_approved = TRUE`,
      [tripId]
    );

    if (ratingsResult.rows.length === 0) {
      return res.json({
        tripId,
        stats: null,
        message: 'No ratings found for this trip',
      });
    }

    const stats = ratingsResult.rows[0];

    // Calculate distribution percentages
    const totalRatings = parseInt(stats.total_ratings) || 0;
    const distribution = {
      5: totalRatings > 0 ? ((parseInt(stats.rating_5) / totalRatings) * 100).toFixed(1) : 0,
      4: totalRatings > 0 ? ((parseInt(stats.rating_4) / totalRatings) * 100).toFixed(1) : 0,
      3: totalRatings > 0 ? ((parseInt(stats.rating_3) / totalRatings) * 100).toFixed(1) : 0,
      2: totalRatings > 0 ? ((parseInt(stats.rating_2) / totalRatings) * 100).toFixed(1) : 0,
      1: totalRatings > 0 ? ((parseInt(stats.rating_1) / totalRatings) * 100).toFixed(1) : 0,
    };

    res.json({
      tripId,
      stats: {
        averages: {
          overall: parseFloat(stats.avg_overall) || 0,
          cleanliness: parseFloat(stats.avg_cleanliness) || 0,
          driver_behavior: parseFloat(stats.avg_driver_behavior) || 0,
          punctuality: parseFloat(stats.avg_punctuality) || 0,
          comfort: parseFloat(stats.avg_comfort) || 0,
          value_for_money: parseFloat(stats.avg_value_for_money) || 0,
        },
        distribution,
        totalRatings: parseInt(stats.total_ratings),
        reviewsCount: parseInt(stats.reviews_count),
      },
    });
  } catch (error) {
    console.error('Error getting trip ratings:', error);
    res.status(500).json({ error: 'Failed to get trip ratings' });
  }
};

/**
 * Get reviews for a trip with pagination
 * GET /api/trips/:tripId/reviews?page=1&limit=10&sort=recent
 */
const getTripReviews = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { tripId } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const sort = req.query.sort || 'recent'; // recent, helpful, rating-high, rating-low

    const offset = (page - 1) * limit;

    // Determine sort order
    let orderBy = 'r.created_at DESC';
    switch (sort) {
      case 'helpful':
        orderBy = 'r.helpful_count DESC, r.created_at DESC';
        break;
      case 'rating-high':
        orderBy = 'r.overall_rating DESC, r.created_at DESC';
        break;
      case 'rating-low':
        orderBy = 'r.overall_rating ASC, r.created_at DESC';
        break;
      case 'recent':
      default:
        orderBy = 'r.created_at DESC';
    }

    // Get total count
    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM ratings 
             WHERE trip_id = $1 AND is_approved = TRUE AND review_text IS NOT NULL`,
      [tripId]
    );
    const total = parseInt(countResult.rows[0].total);

    // Get paginated reviews
    const reviewsResult = await db.query(
      `SELECT 
                r.rating_id,
                r.booking_id,
                r.trip_id,
                r.user_id,
                r.overall_rating,
                r.cleanliness_rating,
                r.driver_behavior_rating,
                r.punctuality_rating,
                r.comfort_rating,
                r.value_for_money_rating,
                r.review_text,
                r.photos,
                r.helpful_count,
                r.unhelpful_count,
                r.created_at,
                r.updated_at,
                u.full_name as author_name,
                u.email as author_email
            FROM ratings r
            LEFT JOIN users u ON r.user_id = u.user_id
            WHERE r.trip_id = $1 AND r.is_approved = TRUE AND r.review_text IS NOT NULL
            ORDER BY ${orderBy}
            LIMIT $2 OFFSET $3`,
      [tripId, limit, offset]
    );

    const reviews = reviewsResult.rows.map((review) => {
      let photos = [];
      try {
        if (review.photos && typeof review.photos === 'string' && review.photos.trim()) {
          photos = JSON.parse(review.photos);
        } else if (Array.isArray(review.photos)) {
          photos = review.photos;
        }
      } catch (error) {
        console.warn('Failed to parse photos for review', review.rating_id, error);
        photos = [];
      }

      // Check permissions for edit/delete
      const isAuthor = userId && review.user_id === userId;
      let canEdit = false;
      let canDelete = false;

      if (isAuthor) {
        canDelete = true;

        // Check if within 24 hours for edit
        const createdAt = new Date(review.created_at);
        const now = new Date();
        const hoursSince = (now - createdAt) / (1000 * 60 * 60);
        canEdit = hoursSince <= 24;
      }

      return {
        id: review.rating_id,
        authorName: review.author_name,
        authorEmail: review.author_email,
        rating: review.overall_rating,
        categoryRatings: {
          cleanliness: review.cleanliness_rating,
          driver_behavior: review.driver_behavior_rating,
          punctuality: review.punctuality_rating,
          comfort: review.comfort_rating,
          value_for_money: review.value_for_money_rating,
        },
        reviewText: review.review_text,
        photos,
        createdAt: review.created_at,
        updatedAt: review.updated_at,
        helpfulCount: review.helpful_count || 0,
        userHelpful: false, // Not needed for trip reviews
        isAuthor,
        canEdit,
        canDelete,
      };
    });

    res.json({
      tripId,
      reviews,
      pagination: {
        currentPage: page,
        pageSize: limit,
        totalReviews: total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    console.error('Error getting trip reviews:', error);
    res.status(500).json({ error: 'Failed to get trip reviews' });
  }
};

/**
 * Update a review (within 24 hours)
 * PATCH /api/ratings/:ratingId
 * Body: { review, photos? }
 */
const updateReview = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { ratingId } = req.params;
    // eslint-disable-next-line no-unused-vars
    const { review, photos, removedPhotos, newPhotos } = req.body;

    // Validate review text if provided
    if (review && review.length > 500) {
      return res.status(400).json({ error: 'Review text must be 500 characters or less' });
    }

    // Get the rating
    const ratingResult = await db.query(
      'SELECT * FROM ratings WHERE rating_id = $1 AND user_id = $2',
      [ratingId, userId]
    );

    if (ratingResult.rows.length === 0) {
      return res
        .status(404)
        .json({ error: 'Rating not found or you do not have permission to edit it' });
    }

    const rating = ratingResult.rows[0];

    // Check if within 24 hours of creation
    const createdAt = new Date(rating.created_at);
    const now = new Date();
    const hoursSince = (now - createdAt) / (1000 * 60 * 60);

    if (hoursSince > 24) {
      return res
        .status(400)
        .json({ error: 'Review can only be edited within 24 hours of creation' });
    }

    // Get current photos - handle various formats
    let currentPhotos = [];
    try {
      if (!rating.photos || rating.photos === '[]') {
        currentPhotos = [];
      } else if (typeof rating.photos === 'string') {
        // Try to parse as JSON array first
        if (rating.photos.startsWith('[') && rating.photos.endsWith(']')) {
          currentPhotos = JSON.parse(rating.photos);
        } else {
          // Single URL or malformed data - treat as single URL
          currentPhotos = [rating.photos];
        }
      } else if (Array.isArray(rating.photos)) {
        // Already an array
        currentPhotos = rating.photos;
      } else {
        console.warn('Unexpected photos format:', typeof rating.photos, rating.photos);
        currentPhotos = [];
      }

      // Ensure all are strings and trim whitespace
      currentPhotos = currentPhotos
        .filter((photo) => photo && typeof photo === 'string')
        .map((photo) => photo.trim());
    } catch (error) {
      console.warn('Failed to parse current photos:', error, 'Raw value:', rating.photos);
      currentPhotos = [];
    }

    // Remove deleted photos from current photos
    if (removedPhotos && Array.isArray(removedPhotos)) {
      const trimmedRemoved = removedPhotos.map((url) => url.trim());
      currentPhotos = currentPhotos.filter((photo) => !trimmedRemoved.includes(photo));
    }

    // Add new photos (assuming they are already uploaded URLs)
    if (photos && Array.isArray(photos)) {
      const trimmedPhotos = photos.map((url) => url.trim());
      currentPhotos = [...currentPhotos, ...trimmedPhotos];
    }

    // Update review
    const result = await db.query(
      `UPDATE ratings 
             SET review_text = $1, photos = $2, updated_at = NOW()
             WHERE rating_id = $3
             RETURNING *`,
      [review !== undefined ? review : rating.review_text, JSON.stringify(currentPhotos), ratingId]
    );

    res.json({
      message: 'Review updated successfully',
      rating: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ error: 'Failed to update review' });
  }
};

/**
 * Delete a review
 * DELETE /api/ratings/:ratingId
 */
const deleteReview = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { ratingId } = req.params;

    // Verify ownership
    const ratingResult = await db.query(
      'SELECT rating_id FROM ratings WHERE rating_id = $1 AND user_id = $2',
      [ratingId, userId]
    );

    if (ratingResult.rows.length === 0) {
      return res
        .status(404)
        .json({ error: 'Rating not found or you do not have permission to delete it' });
    }

    await db.query('DELETE FROM ratings WHERE rating_id = $1', [ratingId]);

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
};

/**
 * Vote on review helpfulness
 * POST /api/ratings/:ratingId/votes
 * Body: { isHelpful: boolean }
 */
const voteHelpful = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { ratingId } = req.params;
    const { isHelpful } = req.body;

    if (typeof isHelpful !== 'boolean') {
      return res.status(400).json({ error: 'isHelpful must be a boolean' });
    }

    // Check if rating exists
    const ratingResult = await db.query('SELECT rating_id FROM ratings WHERE rating_id = $1', [
      ratingId,
    ]);

    if (ratingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Rating not found' });
    }

    // Check if user already voted
    const voteResult = await db.query(
      'SELECT vote_id, is_helpful FROM rating_votes WHERE rating_id = $1 AND user_id = $2',
      [ratingId, userId]
    );

    if (voteResult.rows.length > 0) {
      const existingVote = voteResult.rows[0];
      if (existingVote.is_helpful === isHelpful) {
        return res.status(400).json({ error: 'You have already voted this way' });
      }

      // Update existing vote
      await db.query('UPDATE rating_votes SET is_helpful = $1 WHERE vote_id = $2', [
        isHelpful,
        existingVote.vote_id,
      ]);
    } else {
      // Insert new vote
      await db.query(
        `INSERT INTO rating_votes (rating_id, user_id, is_helpful)
                 VALUES ($1, $2, $3)`,
        [ratingId, userId, isHelpful]
      );
    }

    // Update helpful/unhelpful counts
    const counts = await db.query(
      `SELECT 
                COUNT(CASE WHEN is_helpful = TRUE THEN 1 END) as helpful_count,
                COUNT(CASE WHEN is_helpful = FALSE THEN 1 END) as unhelpful_count
             FROM rating_votes
             WHERE rating_id = $1`,
      [ratingId]
    );

    const countData = counts.rows[0];
    await db.query(
      `UPDATE ratings 
             SET helpful_count = $1, unhelpful_count = $2
             WHERE rating_id = $3`,
      [parseInt(countData.helpful_count) || 0, parseInt(countData.unhelpful_count) || 0, ratingId]
    );

    res.json({ message: 'Vote recorded successfully' });
  } catch (error) {
    console.error('Error voting on review:', error);
    res.status(500).json({ error: 'Failed to record vote' });
  }
};

/**
 * Get rating stats for an operator
 * GET /api/operators/:operatorId/ratings
 */
const getOperatorRatings = async (req, res) => {
  try {
    const { operatorId } = req.params;

    // Get all approved ratings for the operator
    const ratingsResult = await db.query(
      `SELECT
                AVG(overall_rating) as avg_overall,
                AVG(cleanliness_rating) as avg_cleanliness,
                AVG(driver_behavior_rating) as avg_driver_behavior,
                AVG(punctuality_rating) as avg_punctuality,
                AVG(comfort_rating) as avg_comfort,
                AVG(value_for_money_rating) as avg_value_for_money,
                COUNT(*) as total_ratings,
                COUNT(CASE WHEN overall_rating = 5 THEN 1 END) as rating_5,
                COUNT(CASE WHEN overall_rating = 4 THEN 1 END) as rating_4,
                COUNT(CASE WHEN overall_rating = 3 THEN 1 END) as rating_3,
                COUNT(CASE WHEN overall_rating = 2 THEN 1 END) as rating_2,
                COUNT(CASE WHEN overall_rating = 1 THEN 1 END) as rating_1,
                COUNT(CASE WHEN review_text IS NOT NULL THEN 1 END) as reviews_count
            FROM ratings
            WHERE operator_id = $1 AND is_approved = TRUE`,
      [operatorId]
    );

    if (ratingsResult.rows.length === 0) {
      return res.json({
        operatorId,
        stats: null,
        message: 'No ratings found for this operator',
      });
    }

    const stats = ratingsResult.rows[0];

    // Calculate distribution percentages
    const totalRatings = parseInt(stats.total_ratings) || 0;
    const distribution = {
      5: totalRatings > 0 ? ((parseInt(stats.rating_5) / totalRatings) * 100).toFixed(1) : 0,
      4: totalRatings > 0 ? ((parseInt(stats.rating_4) / totalRatings) * 100).toFixed(1) : 0,
      3: totalRatings > 0 ? ((parseInt(stats.rating_3) / totalRatings) * 100).toFixed(1) : 0,
      2: totalRatings > 0 ? ((parseInt(stats.rating_2) / totalRatings) * 100).toFixed(1) : 0,
      1: totalRatings > 0 ? ((parseInt(stats.rating_1) / totalRatings) * 100).toFixed(1) : 0,
    };

    res.json({
      operatorId,
      stats: {
        averages: {
          overall: parseFloat(stats.avg_overall) || 0,
          cleanliness: parseFloat(stats.avg_cleanliness) || 0,
          driver_behavior: parseFloat(stats.avg_driver_behavior) || 0,
          punctuality: parseFloat(stats.avg_punctuality) || 0,
          comfort: parseFloat(stats.avg_comfort) || 0,
          value_for_money: parseFloat(stats.avg_value_for_money) || 0,
        },
        distribution,
        totalRatings: parseInt(stats.total_ratings),
        reviewsCount: parseInt(stats.reviews_count),
      },
    });
  } catch (error) {
    console.error('Error getting operator ratings:', error);
    res.status(500).json({ error: 'Failed to get operator ratings' });
  }
};

/**
 * Get reviews for an operator with pagination
 * GET /api/operators/:operatorId/reviews?page=1&limit=10&sort=recent
 */
const getOperatorReviews = async (req, res) => {
  try {
    const { operatorId } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const sort = req.query.sort || 'recent'; // recent, helpful, rating-high, rating-low
    const userId = req.user?.userId; // Optional authentication

    const offset = (page - 1) * limit;

    // Determine sort order for operator reviews
    let orderBy = 'r.created_at DESC';
    switch (sort) {
      case 'helpful':
        orderBy = 'r.helpful_count DESC, r.created_at DESC';
        break;
      case 'rating-high':
        orderBy = 'r.overall_rating DESC, r.created_at DESC';
        break;
      case 'rating-low':
        orderBy = 'r.overall_rating ASC, r.created_at DESC';
        break;
      case 'recent':
      default:
        orderBy = 'r.created_at DESC';
    }

    // Get total count
    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM ratings 
             WHERE operator_id = $1 AND is_approved = TRUE AND review_text IS NOT NULL`,
      [operatorId]
    );
    const total = parseInt(countResult.rows[0].total);

    // Get paginated reviews
    const reviewsResult = await db.query(
      `SELECT 
                r.rating_id,
                r.booking_id,
                r.trip_id,
                r.operator_id,
                r.user_id,
                r.overall_rating,
                r.cleanliness_rating,
                r.driver_behavior_rating,
                r.punctuality_rating,
                r.comfort_rating,
                r.value_for_money_rating,
                r.review_text,
                r.photos,
                r.helpful_count,
                r.unhelpful_count,
                r.created_at,
                r.updated_at,
                u.full_name as author_name,
                u.email as author_email,
                rt.origin,
                rt.destination
            FROM ratings r
            LEFT JOIN users u ON r.user_id = u.user_id
            LEFT JOIN trips t ON r.trip_id = t.trip_id
            LEFT JOIN routes rt ON t.route_id = rt.route_id
            WHERE r.operator_id = $1 AND r.is_approved = TRUE AND r.review_text IS NOT NULL
            ORDER BY ${orderBy}
            LIMIT $2 OFFSET $3`,
      [operatorId, limit, offset]
    );

    const reviews = await Promise.all(
      reviewsResult.rows.map(async (review) => {
        let photos = [];
        try {
          if (review.photos && typeof review.photos === 'string' && review.photos.trim()) {
            photos = JSON.parse(review.photos);
          } else if (Array.isArray(review.photos)) {
            photos = review.photos;
          }
        } catch (error) {
          console.warn('Failed to parse photos for review', review.rating_id, error);
          photos = [];
        }

        // Check permissions
        let canEdit = false;
        let canDelete = false;
        let userHelpful = null;

        if (userId) {
          // Check if user is the author
          const isAuthor = review.user_id === userId;

          if (isAuthor) {
            canDelete = true; // Can always delete own review

            // Check if within 24 hours for edit
            const createdAt = new Date(review.created_at);
            const now = new Date();
            const hoursSince = (now - createdAt) / (1000 * 60 * 60);
            canEdit = hoursSince <= 24;
          }

          // Check if user voted on this review
          const voteResult = await db.query(
            'SELECT is_helpful FROM rating_votes WHERE rating_id = $1 AND user_id = $2',
            [review.rating_id, userId]
          );
          if (voteResult.rows.length > 0) {
            userHelpful = voteResult.rows[0].is_helpful;
          }
        }

        return {
          id: review.rating_id,
          authorName: review.author_name,
          authorEmail: review.author_email,
          rating: review.overall_rating,
          categoryRatings: {
            cleanliness: review.cleanliness_rating,
            driver_behavior: review.driver_behavior_rating,
            punctuality: review.punctuality_rating,
            comfort: review.comfort_rating,
            value_for_money: review.value_for_money_rating,
          },
          reviewText: review.review_text,
          photos,
          route:
            review.origin && review.destination ? `${review.origin} - ${review.destination}` : null,
          createdAt: review.created_at,
          updatedAt: review.updated_at,
          helpfulCount: review.helpful_count || 0,
          userHelpful,
          isAuthor: userId ? review.user_id === userId : false,
          canEdit,
          canDelete,
        };
      })
    );

    res.json({
      success: true,
      data: reviews,
      pagination: {
        page: page,
        limit: limit,
        total: total,
        totalPages: Math.ceil(total / limit),
      },
      message: 'Reviews retrieved successfully',
    });
  } catch (error) {
    console.error('Error getting operator reviews:', error);
    res.status(500).json({ error: 'Failed to get operator reviews' });
  }
};

/**
 * Check if a booking has a rating
 * GET /api/ratings/check/:bookingId
 */
const checkBookingRating = async (req, res) => {
  try {
    const { bookingId } = req.params;

    if (!bookingId) {
      return res.status(400).json({ error: 'Booking ID is required' });
    }

    // Check if booking has a rating
    const existingRating = await db.query('SELECT rating_id FROM ratings WHERE booking_id = $1', [
      bookingId,
    ]);

    res.json({
      hasRating: existingRating.rows.length > 0,
      ratingId: existingRating.rows.length > 0 ? existingRating.rows[0].rating_id : null,
    });
  } catch (error) {
    console.error('Error checking booking rating:', error);
    res.status(500).json({ error: 'Failed to check booking rating' });
  }
};

/**
 * Get review for a specific booking
 * GET /trips/ratings/booking/:bookingId
 */
const getBookingReview = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { bookingId } = req.params;

    if (!bookingId) {
      return res.status(400).json({ error: 'Booking ID is required' });
    }

    // Get the rating for this booking and user
    const ratingResult = await db.query(
      `SELECT 
                r.rating_id,
                r.booking_id,
                r.trip_id,
                r.user_id,
                r.overall_rating,
                r.cleanliness_rating,
                r.driver_behavior_rating,
                r.punctuality_rating,
                r.comfort_rating,
                r.value_for_money_rating,
                r.review_text,
                r.photos,
                r.helpful_count,
                r.unhelpful_count,
                r.created_at,
                r.updated_at,
                r.is_approved,
                u.full_name as author_name,
                u.email as author_email,
                rt.origin,
                rt.destination
            FROM ratings r
            LEFT JOIN users u ON r.user_id = u.user_id
            LEFT JOIN trips t ON r.trip_id = t.trip_id
            LEFT JOIN routes rt ON t.route_id = rt.route_id
            WHERE r.booking_id = $1 AND r.user_id = $2`,
      [bookingId, userId]
    );

    if (ratingResult.rows.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: 'No review found for this booking',
      });
    }

    const review = ratingResult.rows[0];

    let photos = [];
    try {
      if (review.photos && typeof review.photos === 'string' && review.photos.trim()) {
        photos = JSON.parse(review.photos);
      } else if (Array.isArray(review.photos)) {
        photos = review.photos;
      }
    } catch (error) {
      console.warn('Failed to parse photos for review', review.rating_id, error);
      photos = [];
    }

    // Check permissions
    const isAuthor = review.user_id === userId;
    let canEdit = false;
    let canDelete = false;

    if (isAuthor) {
      canDelete = true;

      // Check if within 24 hours for edit
      const createdAt = new Date(review.created_at);
      const now = new Date();
      const hoursSince = (now - createdAt) / (1000 * 60 * 60);
      canEdit = hoursSince <= 24;
    }

    const reviewData = {
      id: review.rating_id,
      authorName: review.author_name,
      authorEmail: review.author_email,
      rating: review.overall_rating,
      categoryRatings: {
        cleanliness: review.cleanliness_rating,
        driver_behavior: review.driver_behavior_rating,
        punctuality: review.punctuality_rating,
        comfort: review.comfort_rating,
        value_for_money: review.value_for_money_rating,
      },
      reviewText: review.review_text,
      photos,
      route:
        review.origin && review.destination ? `${review.origin} - ${review.destination}` : null,
      createdAt: review.created_at,
      updatedAt: review.updated_at,
      helpfulCount: review.helpful_count || 0,
      userHelpful: false, // Not needed for single review
      isAuthor,
      canEdit,
      canDelete,
    };

    res.json({
      success: true,
      data: reviewData,
      message: 'Review retrieved successfully',
    });
  } catch (error) {
    console.error('Error getting booking review:', error);
    res.status(500).json({ error: 'Failed to get booking review' });
  }
};

module.exports = {
  submitRating,
  getTripRatings,
  getTripReviews,
  getOperatorRatings,
  getOperatorReviews,
  updateReview,
  deleteReview,
  voteHelpful,
  checkBookingRating,
  getBookingReview,
};
