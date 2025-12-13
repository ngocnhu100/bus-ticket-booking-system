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
      // Skip if no phone number
      if (!booking.contact_phone) {
        console.log(
          `📱 Skipping SMS reminder for booking ${booking.booking_reference} - no phone number`
        );
        return;
      }

      // Get trip details
      const tripDetails = await this.getTripDetails(booking.trip_id);
      if (!tripDetails) {
        console.warn(`Trip details not found for booking ${booking.booking_reference}`);
        return;
      }

      // Get passengers for seat information
      const passengers = await passengerRepository.findByBookingId(booking.booking_id);

      // Prepare reminder data
      const reminderData = {
        bookingReference: booking.booking_reference,
        tripName: `${tripDetails.route?.origin || 'Origin'} to ${tripDetails.route?.destination || 'Destination'}`,
        departureTime: tripDetails.schedule?.departureTime || 'TBD',
        fromLocation: tripDetails.route?.origin || 'Origin',
        toLocation: tripDetails.route?.destination || 'Destination',
        seats: passengers.map((p) => p.seat_code),
      };

      // Send SMS reminder
      const response = await axios.post(`${this.notificationServiceUrl}/send-sms-trip-reminder`, {
        phoneNumber: booking.contact_phone,
        tripData: reminderData,
        hoursUntilDeparture,
      });

      if (response.data?.success) {
        console.log(
          `📱 Trip reminder SMS sent to ${booking.contact_phone} for ${booking.booking_reference} (${hoursUntilDeparture}h)`
        );
      }
    } catch (error) {
      console.error(
        `❌ Error sending trip reminder for booking ${booking.booking_reference}:`,
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
      const response = await axios.get(`${tripServiceUrl}/api/trips/${tripId}`);
      return response.data?.data || null;
    } catch (error) {
      console.error('Error fetching trip details:', error.message);
      return null;
    }
  }
}

module.exports = new TripReminderJob();
