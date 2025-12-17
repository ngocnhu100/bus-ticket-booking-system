const axios = require('axios');

/**
 * Weather Service
 * Fetches weather forecasts for trip destinations
 * Uses OpenWeatherMap API or can be extended to use other providers
 */
class WeatherService {
  constructor() {
    this.apiKey = process.env.OPENWEATHER_API_KEY;
    this.baseUrl = 'https://api.openweathermap.org/data/2.5';
    this.isEnabled = !!this.apiKey;
  }

  /**
   * Get weather forecast for a location
   * @param {string} city - City name
   * @param {string} country - Country code (optional)
   * @returns {Promise<object|null>} Weather data or null if disabled/failed
   */
  async getWeatherForecast(city, country = 'VN') {
    if (!this.isEnabled) {
      console.log('Weather service disabled - OPENWEATHER_API_KEY not set');
      return null;
    }

    // Map Vietnamese cities to their ASCII equivalents for API compatibility
    const vietnameseToAscii = {
      'Đà Lạt': 'Da Lat',
      'Đà Nẵng': 'Da Nang',
      'Hà Nội': 'Hanoi',
      'TP. Hồ Chí Minh': 'Ho Chi Minh City',
      'Hồ Chí Minh': 'Ho Chi Minh City',
      'Hồ Chí Minh City': 'Ho Chi Minh City',
      'Nha Trang': 'Nha Trang',
      'Hải Phòng': 'Hai Phong',
      'Cần Thơ': 'Can Tho',
      Huế: 'Hue',
    };

    let cityName = vietnameseToAscii[city] || city;

    try {
      const location = country ? `${cityName},${country}` : cityName;
      console.log(`[Weather Service] Fetching forecast for: ${location} (original: ${city})`);

      // Get coordinates from geocoding
      // axios will encode params, but build and log the full request for debugging
      const geoParams = {
        q: location,
        appid: this.apiKey,
      };
      const geoQuery = new URLSearchParams(geoParams).toString();
      const geoUrl = `${this.baseUrl}/find?${geoQuery}`;
      console.log(`[Weather Service] GEO REQUEST: ${geoUrl}`);

      const geoResponse = await axios.get(`${this.baseUrl}/find`, { params: geoParams });
      console.log('[Weather Service] GEO RESPONSE status:', geoResponse.status);
      console.log('[Weather Service] GEO RESPONSE data:', JSON.stringify(geoResponse.data));

      if (!geoResponse.data?.list?.length) {
        console.warn(`[Weather Service] Location not found for ${location}`);
        return null;
      }

      // geoResponse.data.list[0] uses a `coord` object with `lat` and `lon`
      const geoItem = geoResponse.data.list[0];
      const lat = geoItem?.coord?.lat;
      const lon = geoItem?.coord?.lon;

      if (lat == null || lon == null) {
        console.warn(
          '[Weather Service] Coordinates missing from GEO response for',
          location,
          'geoItem:',
          JSON.stringify(geoItem)
        );
        return null;
      }

      console.log(`[Weather Service] Found coordinates: lat=${lat}, lon=${lon}`);

      // Get forecast for the location
      const forecastParams = {
        lat,
        lon,
        appid: this.apiKey,
        units: 'metric',
        cnt: 8, // Get 2 days forecast (8 * 3 hours)
      };
      const forecastQuery = new URLSearchParams(forecastParams).toString();
      const forecastUrl = `${this.baseUrl}/forecast?${forecastQuery}`;
      console.log(`[Weather Service] FORECAST REQUEST: ${forecastUrl}`);

      const forecastResponse = await axios.get(`${this.baseUrl}/forecast`, {
        params: forecastParams,
      });
      console.log('[Weather Service] FORECAST RESPONSE status:', forecastResponse.status);
      console.log(
        '[Weather Service] FORECAST RESPONSE data:',
        JSON.stringify(forecastResponse.data)
      );

      return this.parseWeatherData(forecastResponse.data);
    } catch (error) {
      console.error(
        `[Weather Service] Error fetching forecast:`,
        error.response?.status,
        error.response?.data?.message || error.message
      );
      return null;
    }
  }

  /**
   * Parse and extract relevant weather information
   * @param {object} data - OpenWeatherMap forecast data
   * @returns {object} Parsed weather information
   */
  parseWeatherData(data) {
    if (!data?.list?.length) {
      return null;
    }

    const forecast = data.list[0];
    const weather = forecast.weather[0];
    const main = forecast.main;

    return {
      condition: weather.main,
      description: weather.description,
      temperature: Math.round(main.temp),
      humidity: main.humidity,
      windSpeed: Math.round((forecast.wind?.speed || 0) * 10) / 10,
      precipitation: forecast.rain?.['3h'] || 0,
      isAdverse: this.isAdverseWeather(weather.main, forecast.rain?.['3h']),
      icon: weather.icon,
    };
  }

  /**
   * Determine if weather conditions are adverse
   * @param {string} condition - Weather condition
   * @param {number} precipitation - Rainfall amount
   * @returns {boolean} True if weather is adverse
   */
  isAdverseWeather(condition, precipitation = 0) {
    const adverseConditions = [
      'Thunderstorm',
      'Heavy rain',
      'Heavy snow',
      'Hurricane',
      'Tornado',
      'Extreme',
    ];

    const condition_lower = condition.toLowerCase();
    const hasAdverseCondition = adverseConditions.some((cond) =>
      condition_lower.includes(cond.toLowerCase())
    );

    // Heavy precipitation (>10mm)
    const hasHeavyRain = precipitation > 10;

    return hasAdverseCondition || hasHeavyRain;
  }

  /**
   * Generate HTML for weather advisory
   * @param {object} weather - Weather data
   * @returns {string} HTML string or empty string if no adverse weather
   */
  generateAdvisoryHtml(weather) {
    if (!weather || !weather.isAdverse) {
      return '';
    }

    const icon = this.getWeatherIcon(weather.condition);
    return `
      <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 4px; margin: 20px 0;">
        <div style="font-weight: bold; color: #856404; margin-bottom: 8px; font-size: 14px;">
          ${icon} Weather Alert
        </div>
        <p style="color: #856404; margin: 0; font-size: 13px; line-height: 1.5;">
          <strong>${weather.condition}</strong> - ${weather.description}
          <br>Temperature: ${weather.temperature}°C | Humidity: ${weather.humidity}%
          <br><strong>Recommendation:</strong> Please allow extra travel time and check local conditions before departing.
        </p>
      </div>
    `;
  }

  /**
   * Get text representation of weather icon
   * @param {string} condition - Weather condition
   * @returns {string} Text icon
   */
  getWeatherIcon(condition) {
    const iconMap = {
      thunderstorm: '⛈',
      rain: '🌧',
      snow: '❄',
      clouds: '☁',
      clear: '☀',
      wind: '💨',
    };

    const condition_lower = condition.toLowerCase();
    for (const [key, icon] of Object.entries(iconMap)) {
      if (condition_lower.includes(key)) {
        return icon;
      }
    }
    return '🌡';
  }
}

module.exports = new WeatherService();
