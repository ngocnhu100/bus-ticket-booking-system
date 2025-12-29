// Timezone configuration for the application
// Centralize timezone management to avoid hardcoded values

const TIMEZONE_CONFIG = {
  // Vietnam timezone (+7 UTC)
  VIETNAM_OFFSET: '+07',
  VIETNAM_OFFSET_HOURS: 7,

  // Default timezone for the application
  DEFAULT_TIMEZONE: '+07',

  // Timezone name for display purposes
  TIMEZONE_NAME: 'Asia/Ho_Chi_Minh',
  TIMEZONE_DISPLAY: 'ICT (UTC+7)',
};

module.exports = TIMEZONE_CONFIG;
