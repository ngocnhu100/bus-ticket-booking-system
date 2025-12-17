const axios = require('axios');
const bookingRepository = require('../repositories/bookingRepository');
const passengerRepository = require('../repositories/passengerRepository');

/**
 * Job to send trip reminder SMS notifications
 * Runs every hour to check for upcoming trips and send reminders
 */
class TripReminderJob {
  constructor() {
    this.intervalId = null;
    this.isRunning = false;
    this.notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3003';
  }

  /**
   * Start the trip reminder job
   * @param {number} intervalMs - Interval in milliseconds (default: 3600000 = 1 hour)
   */
  start(intervalMs = 3600000) {
    if (this.isRunning) {
      console.log('📱 Trip reminder job is already running');
      return;
    }

    console.log(`📱 Starting trip reminder job (interval: ${intervalMs}ms)`);

    // Run immediately on start
    this.run();

    // Then run at intervals
    this.intervalId = setInterval(() => {
      this.run();
    }, intervalMs);

    this.isRunning = true;
  }

  /**
   * Stop the trip reminder job
   */
  stop() {
    if (!this.isRunning) {
      return;
    }

    console.log('📱 Stopping trip reminder job');

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
  }

  /**
   * Run the trip reminder job
   */
  async run() {
    try {
      console.log('📱 Running trip reminder job...');

      // Send reminders for trips departing in 24 hours
      await this.sendRemindersForHours(24);

      // Send reminders for trips departing in 2 hours
      await this.sendRemindersForHours(2);

      console.log('✅ Trip reminder job completed');
    } catch (error) {
      console.error('❌ Error in trip reminder job:', error.message);
    }
  }

  /**
   * Send reminders for trips departing in specified hours
   * @param {number} hoursUntilDeparture - Hours until departure
   */
  async sendRemindersForHours(hoursUntilDeparture) {
    try {
      // TODO: Timezone Support - Convert reminder window to user's local timezone
      // Current implementation uses server UTC time
      // Future: Fetch user timezone from preferences and adjust calculation accordingly
      // Example: new Date(now.getTime() + (userTimezoneOffset * 60 * 60 * 1000))

      // Calculate target departure time window
      const now = new Date();
      const targetTimeStart = new Date(
        now.getTime() + hoursUntilDeparture * 60 * 60 * 1000 - 30 * 60 * 1000
      ); // 30 minutes window
      const targetTimeEnd = new Date(
        now.getTime() + hoursUntilDeparture * 60 * 60 * 1000 + 30 * 60 * 1000
      );

      // Find confirmed bookings with trips in the time window
      const upcomingBookings = await bookingRepository.findUpcomingTrips(
        targetTimeStart,
        targetTimeEnd
      );

      console.log(
        `📱 Found ${upcomingBookings.length} bookings for ${hoursUntilDeparture}-hour reminders`
      );

      for (const booking of upcomingBookings) {
        try {
          await this.sendTripReminder(booking, hoursUntilDeparture);
        } catch (error) {
          console.error(
            `❌ Failed to send ${hoursUntilDeparture}h reminder for booking ${booking.booking_reference}:`,
            error.message
          );
        }
      }
    } catch (error) {
      console.error(`❌ Error sending ${hoursUntilDeparture}h reminders:`, error.message);
    }
  }

  /**
   * Send trip reminder for a specific booking
   * @param {object} booking - Booking object
   * @param {number} hoursUntilDeparture - Hours until departure
   */
  async sendTripReminder(booking, hoursUntilDeparture) {
    try {
      // Get trip details
      const tripDetails = await this.getTripDetails(booking.trip_id);
      if (!tripDetails) {
        console.warn(`Trip details not found for booking ${booking.booking_reference}`);
        return;
      }

      // Get passengers for seat information
      const passengers = await passengerRepository.findByBookingId(booking.booking_id);

      // Prepare reminder data
      // TODO: Pickup/Dropoff points - extract from booking data
      const firstPickupPoint =
        tripDetails.pickup_points && tripDetails.pickup_points.length > 0
          ? tripDetails.pickup_points[0].name
          : 'TBD';
      const lastDropoffPoint =
        tripDetails.dropoff_points && tripDetails.dropoff_points.length > 0
          ? tripDetails.dropoff_points[tripDetails.dropoff_points.length - 1].name
          : 'TBD';

      const reminderData = {
        bookingReference: booking.booking_reference,
        customerEmail: booking.contact_email,
        customerPhone: booking.contact_phone,
        tripName: `${tripDetails.route?.origin || 'Origin'} to ${tripDetails.route?.destination || 'Destination'}`,
        // Extract times from schedule object
        departureTime: tripDetails.schedule?.departure_time || 'TBD',
        arrivalTime: tripDetails.schedule?.arrival_time || 'TBD',
        fromLocation: tripDetails.route?.origin || 'Origin',
        toLocation: tripDetails.route?.destination || 'Destination',
        seats: passengers.map((p) => p.seat_code),
        totalPrice: booking.total_price || '0',
        currency: booking.currency || 'VND',
        // Contact information
        contactEmail: tripDetails.operator?.contact_email || 'support@busticket.com',
        contactPhone: tripDetails.operator?.contact_phone || '+84-1800-TICKET',
        eTicketUrl: booking.eTicketUrl, // Add if available from booking
        passengers: passengers.map((p) => ({
          full_name: p.full_name || p.name || 'Passenger',
          seat_code: p.seat_code,
          phone: p.phone,
          document_id: p.document_id,
        })),
        operatorName: tripDetails.operator?.name || 'Bus Operator',
        busModel: tripDetails.bus?.model || 'Standard Bus',
        // Pickup and dropoff points from trip details
        pickupPoint: firstPickupPoint,
        dropoffPoint: lastDropoffPoint,
      };

      // Extract user preferences (with defaults for guest bookings)
      const userPreferences = booking.preferences || {};
      const notificationPrefs = userPreferences.notifications || {
        tripReminders: { email: true, sms: false },
      };
      const tripReminderPrefs = notificationPrefs.tripReminders || { email: true, sms: false };

      // Check if user has enabled SMS reminders
      const shouldSendSms = tripReminderPrefs.sms === true;

      // Send SMS reminder if user preference enabled and phone number exists
      if (shouldSendSms && booking.contact_phone) {
        try {
          const smsResponse = await axios.post(
            `${this.notificationServiceUrl}/send-sms-trip-reminder`,
            {
              phoneNumber: booking.contact_phone,
              tripData: reminderData,
              hoursUntilDeparture,
            }
          );

          if (smsResponse.data?.success) {
            console.log(
              `📱 Trip reminder SMS sent to ${booking.contact_phone} for ${booking.booking_reference} (${hoursUntilDeparture}h)`
            );
          }
        } catch (smsError) {
          console.error(
            `❌ Failed to send SMS for booking ${booking.booking_reference}:`,
            smsError.message
          );
        }
      } else if (!shouldSendSms) {
        console.log(
          `📱 Skipping SMS reminder for booking ${booking.booking_reference} - user opted out`
        );
      } else {
        console.log(
          `📱 Skipping SMS reminder for booking ${booking.booking_reference} - no phone number`
        );
      }

      // Check if user has enabled email reminders
      const shouldSendEmail = tripReminderPrefs.email === true;

      // Send Email reminder if user preference enabled and email exists
      if (shouldSendEmail && booking.contact_email) {
        try {
          const emailResponse = await axios.post(
            `${this.notificationServiceUrl}/send-email-trip-reminder`,
            {
              email: booking.contact_email,
              tripData: reminderData,
              hoursUntilDeparture,
            }
          );

          if (emailResponse.data?.success) {
            console.log(
              `📧 Trip reminder email sent to ${booking.contact_email} for ${booking.booking_reference} (${hoursUntilDeparture}h)`
            );
          }
        } catch (emailError) {
          console.error(
            `❌ Failed to send email for booking ${booking.booking_reference}:`,
            emailError.message
          );
        }
      } else if (!shouldSendEmail) {
        console.log(
          `📧 Skipping email reminder for booking ${booking.booking_reference} - user opted out`
        );
      } else {
        console.log(
          `📧 Skipping email reminder for booking ${booking.booking_reference} - no email address`
        );
      }
    } catch (error) {
      console.error(
        `❌ Error processing trip reminder for booking ${booking.booking_reference}:`,
        error.message
      );
      throw error;
    }
  }

  /**
   * Get trip details by ID
   * @param {string} tripId - Trip ID
   * @returns {Promise<object|null>} Trip details
   */
  async getTripDetails(tripId) {
    try {
      const tripServiceUrl = process.env.TRIP_SERVICE_URL || 'http://localhost:3002';
      const response = await axios.get(`${tripServiceUrl}/${tripId}`);
      return response.data?.data || null;
    } catch (error) {
      console.error('Error fetching trip details:', error.message);
      return null;
    }
  }
}

module.exports = new TripReminderJob();
