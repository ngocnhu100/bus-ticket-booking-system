-- Seed data for notifications table
-- This script inserts realistic notification history for testing

-- Get the specific passenger user for seeding
DO $$
DECLARE
  v_user_id UUID;
  v_booking_id_1 UUID;
  v_booking_id_2 UUID;
BEGIN
  -- Get the passenger@bus-ticket.com user specifically
  SELECT user_id INTO v_user_id FROM users WHERE email = 'passenger@bus-ticket.com' AND role = 'passenger' LIMIT 1;
  
  -- Get some bookings for this user if they exist
  SELECT booking_id INTO v_booking_id_1 FROM bookings WHERE user_id = v_user_id LIMIT 1;
  SELECT booking_id INTO v_booking_id_2 FROM bookings WHERE user_id = v_user_id OFFSET 1 LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    -- Insert notifications
    INSERT INTO notifications (user_id, booking_id, type, channel, title, message, status, read_at, sent_at)
    VALUES
      -- Booking Confirmation - Email (read)
      (v_user_id, v_booking_id_1, 'booking', 'email',
       'Booking Confirmed',
       'Your booking has been confirmed! Your booking reference is shown in the e-ticket attachment. Check your email for complete details.',
       'read', now() - interval '2 hours', now() - interval '2 hours'),
      
      -- Booking Confirmation - SMS (read)
      (v_user_id, v_booking_id_1, 'booking', 'sms',
       'Booking Confirmed',
       'Booking confirmed! Ref: BK2025. Trip tomorrow 08:00 from Hanoi. Download e-ticket now.',
       'read', now() - interval '2 hours', now() - interval '2 hours'),
      
      -- Trip Reminder - 24h before (read)
      (v_user_id, v_booking_id_1, 'trip', 'email',
       'Trip Reminder - 24 Hours',
       'Your trip to Ho Chi Minh City departs tomorrow at 08:00 AM from Hanoi Coach Station. Please arrive 30 minutes early.',
       'read', now() - interval '1 day', now() - interval '1 day'),
      
      -- Trip Update - Delay notification (sent, unread)
      (v_user_id, v_booking_id_2, 'update', 'sms',
       'Trip Update - Delay',
       'URGENT: Your trip is delayed by 30 minutes due to traffic conditions. New departure time: 08:30 AM.',
       'sent', NULL, now() - interval '30 minutes'),
      
      -- Trip Reminder - 2h before (read)
      (v_user_id, v_booking_id_1, 'trip', 'sms',
       'Trip Reminder - 2 Hours',
       'Your bus departs in 2 hours from Gate 5. Please arrive now. Have your e-ticket ready.',
       'read', now() - interval '2 hours 30 minutes', now() - interval '2 hours 30 minutes'),
      
      -- Promotional offer (sent, unread)
      (v_user_id, NULL, 'promo', 'email',
       'Special Weekend Offer - 20% Off',
       'Get 20% discount on all bookings this weekend! Use code WEEKEND20 at checkout. Valid until Sunday midnight.',
       'sent', NULL, now() - interval '3 hours'),
      
      -- Payment Confirmation (read)
      (v_user_id, v_booking_id_1, 'booking', 'email',
       'Payment Received',
       'Thank you! We received your payment of 500,000 VND for your booking. Your receipt is attached.',
       'read', now() - interval '5 hours', now() - interval '5 hours'),
      
      -- System notification (read)
      (v_user_id, NULL, 'system', 'email',
       'Account Update',
       'Your notification preferences have been successfully updated. Changes will take effect immediately.',
       'read', now() - interval '1 day', now() - interval '1 day'),
      
      -- Loyalty Points (sent, unread)
      (v_user_id, v_booking_id_1, 'promo', 'email',
       'Loyalty Reward Points',
       'Congratulations! You earned 500 reward points from your last booking. Redeem them for discounts on your next trip!',
       'sent', NULL, now() - interval '2 days'),
      
      -- System notification - failed
      (v_user_id, NULL, 'system', 'sms',
       'Account Security Alert',
       'Your account login was detected from a new device. If this wasn''t you, please secure your account.',
       'failed', NULL, now() - interval '4 days'),
      
      -- Additional booking notifications
      (v_user_id, v_booking_id_1, 'booking', 'email',
       'E-Ticket Ready',
       'Your e-ticket is now ready for download. Please save it to your phone for easy access at the station.',
       'read', now() - interval '3 hours', now() - interval '3 hours'),
      
      -- Trip reminder - 1 hour before
      (v_user_id, v_booking_id_1, 'trip', 'sms',
       'Trip Reminder - 1 Hour',
       'Your bus departs in 1 hour. Please proceed to the station now. Gate information will be sent 30 minutes before departure.',
       'sent', NULL, now() - interval '1 hour'),
      
      -- Trip update - gate change
      (v_user_id, v_booking_id_2, 'update', 'sms',
       'Gate Change Notice',
       'Your departure gate has changed to Gate 12 due to maintenance. Please proceed to the new gate immediately.',
       'sent', NULL, now() - interval '45 minutes'),
      
      -- Promotional - holiday special
      (v_user_id, NULL, 'promo', 'email',
       'Holiday Season Special - Up to 30% Off',
       'Celebrate the holidays with amazing discounts! Book now and save up to 30% on all routes. Limited time offer!',
       'sent', NULL, now() - interval '1 day'),
      
      -- System - password change confirmation
      (v_user_id, NULL, 'system', 'email',
       'Password Changed Successfully',
       'Your password has been changed successfully. If you did not make this change, please contact support immediately.',
       'read', now() - interval '3 days', now() - interval '3 days'),
      
      -- Booking modification
      (v_user_id, v_booking_id_1, 'booking', 'email',
       'Booking Modification Confirmed',
       'Your booking modification has been processed. New departure time: Tomorrow 10:00 AM. Refund of 50,000 VND processed.',
       'read', now() - interval '2 days', now() - interval '2 days'),
      
      -- Trip completion feedback
      (v_user_id, v_booking_id_1, 'system', 'email',
       'Trip Completed - Rate Your Experience',
       'Thank you for choosing our service! How was your trip? Please take a moment to rate your experience and help us improve.',
       'sent', NULL, now() - interval '5 days'),
      
      -- Loyalty milestone
      (v_user_id, NULL, 'promo', 'email',
       'Congratulations! Gold Member Status',
       'You''ve reached 1000 points! You are now a Gold member with exclusive benefits including priority boarding and bonus discounts.',
       'sent', NULL, now() - interval '1 week'),
      
      -- Weather alert
      (v_user_id, v_booking_id_2, 'update', 'sms',
       'Weather Alert - Trip May Be Affected',
       'Heavy rain expected in your route area. Your trip may experience delays. Monitor updates via the app.',
       'sent', NULL, now() - interval '2 hours'),
      
      -- Refund processed
      (v_user_id, v_booking_id_2, 'booking', 'email',
       'Refund Processed',
       'Your refund request has been processed. Amount: 300,000 VND has been credited back to your original payment method.',
       'read', now() - interval '1 week', now() - interval '1 week')
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Notification seed data inserted successfully for passenger@bus-ticket.com user: %', v_user_id;
  ELSE
    RAISE WARNING 'User passenger@bus-ticket.com not found in database. Please run 005_seed_users.sql first and ensure the user exists with role = ''passenger''.';
  END IF;
END $$;
