-- Create ratings table
CREATE TABLE IF NOT EXISTS ratings (
    rating_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(booking_id) ON DELETE CASCADE,
    trip_id UUID NOT NULL REFERENCES trips(trip_id) ON DELETE CASCADE,
    operator_id UUID NOT NULL REFERENCES operators(operator_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Overall rating (1-5)
    overall_rating INT CHECK (overall_rating >= 1 AND overall_rating <= 5),
    
    -- Category ratings (1-5)
    cleanliness_rating INT CHECK (cleanliness_rating >= 1 AND cleanliness_rating <= 5),
    driver_behavior_rating INT CHECK (driver_behavior_rating >= 1 AND driver_behavior_rating <= 5),
    punctuality_rating INT CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
    comfort_rating INT CHECK (comfort_rating >= 1 AND comfort_rating <= 5),
    value_for_money_rating INT CHECK (value_for_money_rating >= 1 AND value_for_money_rating <= 5),
    
    -- Review text (optional)
    review_text TEXT,
    
    -- Photos (JSON array of URLs)
    photos JSONB DEFAULT '[]',
    
    -- Moderation
    is_flagged BOOLEAN DEFAULT FALSE,
    flag_reason TEXT,
    is_approved BOOLEAN DEFAULT TRUE,
    
    -- Helpful votes
    helpful_count INT DEFAULT 0,
    unhelpful_count INT DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure one rating per booking
    UNIQUE(booking_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_ratings_operator_id ON ratings(operator_id);
CREATE INDEX IF NOT EXISTS idx_ratings_trip_id ON ratings(trip_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_booking_id ON ratings(booking_id);
CREATE INDEX IF NOT EXISTS idx_ratings_created_at ON ratings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ratings_is_approved ON ratings(is_approved);
CREATE INDEX IF NOT EXISTS idx_ratings_helpful ON ratings(helpful_count DESC);

-- Create table for tracking helpful votes
CREATE TABLE IF NOT EXISTS rating_votes (
    vote_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rating_id UUID NOT NULL REFERENCES ratings(rating_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Vote type: true = helpful, false = unhelpful
    is_helpful BOOLEAN NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure one vote per user per rating
    UNIQUE(rating_id, user_id)
);

-- Create index for vote queries
CREATE INDEX IF NOT EXISTS idx_rating_votes_rating_id ON rating_votes(rating_id);
CREATE INDEX IF NOT EXISTS idx_rating_votes_user_id ON rating_votes(user_id);
