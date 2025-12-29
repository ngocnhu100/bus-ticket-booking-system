//const pool = require('../database');

class TripStatusUpdateService {
  async updateTripStatuses() {
    try {
      // Automatic status updates have been disabled
      // Trip status changes are now handled manually by admins
      console.log('ℹ️ Trip status update service is running (automatic updates disabled)');

      // No automatic updates performed
      return;
      //   const now = new Date();

      //   // Update scheduled trips to in_progress when departure time is reached
      //   const scheduledQuery = `
      //     UPDATE trips
      //     SET status = 'in_progress', updated_at = CURRENT_TIMESTAMP
      //     WHERE status = 'scheduled' AND departure_time <= $1
      //   `;
      //   const scheduledResult = await pool.query(scheduledQuery, [now]);

      //   // Update in_progress trips to completed when arrival time is reached
      //   const completedQuery = `
      //     UPDATE trips
      //     SET status = 'completed', updated_at = CURRENT_TIMESTAMP
      //     WHERE status = 'in_progress' AND arrival_time <= $1
      //   `;
      //   const completedResult = await pool.query(completedQuery, [now]);

      //   if (scheduledResult.rowCount > 0) {
      //     console.log(`✅ Updated ${scheduledResult.rowCount} trips from scheduled to in_progress`);
      //   }

      //   if (completedResult.rowCount > 0) {
      //     console.log(`✅ Updated ${completedResult.rowCount} trips from in_progress to completed`);
      //   }
    } catch (error) {
      console.error('❌ Error in trip status update service:', error);
      throw error;
    }
  }
}

module.exports = new TripStatusUpdateService();
