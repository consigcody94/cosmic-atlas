import { APIClient } from '../utils/api-client';
import { APIResponse, SolarWind, GeomagneticActivity, AuroraForecast, SolarFlare, CoronalMassEjection } from '@cosmic-atlas/shared';
import { config } from '../config';
import { NASAClient } from './nasa';

/**
 * Space Weather Client
 * Combines NOAA SWPC (Space Weather Prediction Center) and NASA DONKI
 * Real-time solar activity, geomagnetic storms, and aurora forecasts
 */
export class SpaceWeatherClient extends APIClient {
  private nasaClient: NASAClient;

  constructor() {
    super('NOAA-SWPC', 'https://services.swpc.noaa.gov', config.cache.ttl.spaceWeather);
    this.nasaClient = new NASAClient();
  }

  /**
   * Get aurora forecast for northern and southern hemispheres
   * @returns Current aurora activity forecast
   */
  async getAuroraForecast(): Promise<APIResponse<{
    north: any;
    south: any;
  }>> {
    const [north, south] = await Promise.all([
      this.cachedGet('/products/aurora-forecast-northern-hemisphere.json', {}, 'aurora-north', config.cache.ttl.spaceWeather),
      this.cachedGet('/products/aurora-forecast-southern-hemisphere.json', {}, 'aurora-south', config.cache.ttl.spaceWeather),
    ]);

    if (!north.success || !south.success) {
      return {
        success: false,
        error: {
          code: 'AURORA_FORECAST_ERROR',
          message: 'Failed to fetch aurora forecast',
        },
        metadata: {
          source: 'NOAA-SWPC',
          timestamp: Date.now(),
          cached: false,
        },
      };
    }

    return {
      success: true,
      data: {
        north: north.data,
        south: south.data,
      },
      metadata: {
        source: 'NOAA-SWPC',
        timestamp: Date.now(),
        cached: false,
      },
    };
  }

  /**
   * Get real-time solar wind data
   * @returns Current solar wind speed, density, and magnetic field
   */
  async getSolarWind(): Promise<APIResponse<any[]>> {
    return this.cachedGet(
      '/products/solar-wind/mag-1-day.json',
      {},
      'solar-wind',
      config.cache.ttl.spaceWeather
    );
  }

  /**
   * Get geomagnetic activity (Kp index)
   * Kp index: 0-9 scale of geomagnetic disturbance
   * 0-4: quiet, 5: minor storm, 6: moderate storm, 7: strong storm, 8-9: severe storm
   * @returns Current and forecasted Kp index values
   */
  async getGeomagneticActivity(): Promise<APIResponse<any[]>> {
    return this.cachedGet(
      '/products/noaa-planetary-k-index.json',
      {},
      'kp-index',
      config.cache.ttl.spaceWeather
    );
  }

  /**
   * Get 3-day space weather forecast
   * @returns Forecast for next 3 days including solar activity and geomagnetic storms
   */
  async get3DayForecast(): Promise<APIResponse<any>> {
    return this.cachedGet(
      '/products/3-day-forecast.json',
      {},
      'forecast-3day',
      config.cache.ttl.spaceWeather
    );
  }

  /**
   * Get solar flare events from NASA DONKI
   * @param startDate - Start date (YYYY-MM-DD)
   * @param endDate - End date (YYYY-MM-DD)
   * @returns Array of solar flare events
   */
  async getSolarFlares(startDate: string, endDate: string): Promise<APIResponse<any[]>> {
    return this.nasaClient.getDONKIEvents('FLR', startDate, endDate);
  }

  /**
   * Get Coronal Mass Ejection (CME) events from NASA DONKI
   * @param startDate - Start date (YYYY-MM-DD)
   * @param endDate - End date (YYYY-MM-DD)
   * @returns Array of CME events with Earth impact predictions
   */
  async getCMEs(startDate: string, endDate: string): Promise<APIResponse<any[]>> {
    return this.nasaClient.getDONKIEvents('CME', startDate, endDate);
  }

  /**
   * Get geomagnetic storm events from NASA DONKI
   * @param startDate - Start date (YYYY-MM-DD)
   * @param endDate - End date (YYYY-MM-DD)
   * @returns Array of geomagnetic storm events
   */
  async getGeomagneticStorms(startDate: string, endDate: string): Promise<APIResponse<any[]>> {
    return this.nasaClient.getDONKIEvents('GST', startDate, endDate);
  }

  /**
   * Get solar energetic particle (SEP) events from NASA DONKI
   * @param startDate - Start date (YYYY-MM-DD)
   * @param endDate - End date (YYYY-MM-DD)
   * @returns Array of SEP events
   */
  async getSEPEvents(startDate: string, endDate: string): Promise<APIResponse<any[]>> {
    return this.nasaClient.getDONKIEvents('SEP', startDate, endDate);
  }

  /**
   * Get comprehensive space weather summary
   * Combines multiple data sources for complete picture
   * @returns Comprehensive space weather data
   */
  async getSpaceWeatherSummary(): Promise<APIResponse<{
    solarWind: any;
    geomagneticActivity: any;
    auroraForecast: any;
    forecast3Day: any;
    timestamp: number;
  }>> {
    const [solarWind, geomagActivity, aurora, forecast] = await Promise.all([
      this.getSolarWind(),
      this.getGeomagneticActivity(),
      this.getAuroraForecast(),
      this.get3DayForecast(),
    ]);

    if (!solarWind.success || !geomagActivity.success || !aurora.success || !forecast.success) {
      return {
        success: false,
        error: {
          code: 'SPACE_WEATHER_ERROR',
          message: 'Failed to fetch complete space weather data',
        },
        metadata: {
          source: 'NOAA-SWPC',
          timestamp: Date.now(),
          cached: false,
        },
      };
    }

    return {
      success: true,
      data: {
        solarWind: solarWind.data,
        geomagneticActivity: geomagActivity.data,
        auroraForecast: aurora.data,
        forecast3Day: forecast.data,
        timestamp: Date.now(),
      },
      metadata: {
        source: 'NOAA-SWPC',
        timestamp: Date.now(),
        cached: false,
      },
    };
  }
}
