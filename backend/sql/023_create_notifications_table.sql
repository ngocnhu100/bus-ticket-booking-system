-- Create notifications table for storing notification history
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  booking_id UUID,
  
  -- Notification type and channel
  type VARCHAR(50) NOT NULL CHECK (type IN ('booking', 'trip', 'update', 'promo', 'system')),
  channel VARCHAR(20) NOT NULL CHECK (channel IN ('email', 'sms', 'push')),
  
  -- Content
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  -- Status tracking
  status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'read', 'failed')),
  read_at TIMESTAMP,
  
  -- Timestamps
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT fk_notifications_user_id 
    FOREIGN KEY (user_id) 
    REFERENCES users(user_id) 
    ON DELETE CASCADE,
  CONSTRAINT fk_notifications_booking_id 
    FOREIGN KEY (booking_id) 
    REFERENCES bookings(booking_id) 
    ON DELETE SET NULL
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id 
  ON notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id_sent_at 
  ON notifications(user_id, sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_booking_id 
  ON notifications(booking_id);

CREATE INDEX IF NOT EXISTS idx_notifications_status 
  ON notifications(status);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notifications_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'trigger_notifications_updated_at'
    AND event_object_table = 'notifications'
  ) THEN
    CREATE TRIGGER trigger_notifications_updated_at
      BEFORE UPDATE ON notifications
      FOR EACH ROW
      EXECUTE FUNCTION update_notifications_timestamp();
  END IF;
END $$;

-- Add comment
COMMENT ON TABLE notifications IS 
  'Stores notification history for all users - booking confirmations, trip reminders, updates, etc.';
