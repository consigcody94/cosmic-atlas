import { APIClient } from '../utils/api-client';
import { APIResponse, APOD, RoverPhoto, NearEarthObject, EarthImagery } from '@cosmic-atlas/shared';
import { config } from '../config';

/**
 * NASA API Client
 * Access to NASA's extensive API catalog including APOD, Mars Rovers, NEO, and more
 * @see https://api.nasa.gov/
 */
export class NASAClient extends APIClient {
  constructor() {
    super('NASA', 'https://api.nasa.gov', config.cache.ttl.apod);
  }

  /**
   * Get Astronomy Picture of the Day
   * @param date - Optional date (YYYY-MM-DD format). Defaults to today.
   * @returns Astronomy picture with description and metadata
   */
  async getAPOD(date?: string): Promise<APIResponse<APOD>> {
    const params: Record<string, string> = {
      api_key: config.apiKeys.nasa,
    };

    if (date) {
      params.date = date;
    }

    return this.cachedGet<APOD>(
      '/planetary/apod',
      { params },
      `apod:${date || 'today'}`,
      config.cache.ttl.apod
    );
  }

  /**
   * Get Mars Rover photos
   * @param rover - Rover name (curiosity, opportunity, spirit, perseverance)
   * @param sol - Martian rotation (sol) number. Takes precedence over earthDate
   * @param earthDate - Earth date (YYYY-MM-DD format)
   * @param camera - Optional camera name (FHAZ, RHAZ, MAST, CHEMCAM, MAHLI, MARDI, NAVCAM, PANCAM, MINITES)
   * @returns Array of rover photos
   */
  async getMarsPhotos(
    rover: string,
    sol?: number,
    earthDate?: string,
    camera?: string
  ): Promise<APIResponse<{ photos: RoverPhoto[] }>> {
    const params: Record<string, string | number> = {
      api_key: config.apiKeys.nasa,
    };

    // Sol takes precedence over earth_date
    if (sol !== undefined) {
      params.sol = sol;
    } else if (earthDate) {
      params.earth_date = earthDate;
    } else {
      // Default to sol 1000 if neither specified
      params.sol = 1000;
    }

    if (camera) {
      params.camera = camera;
    }

    const cacheKey = `mars:${rover}:${sol || earthDate || 'default'}:${camera || 'all'}`;

    return this.cachedGet<{ photos: RoverPhoto[] }>(
      `/mars-photos/api/v1/rovers/${rover.toLowerCase()}/photos`,
      { params },
      cacheKey,
      config.cache.ttl.mars
    );
  }

  /**
   * Get Near-Earth Objects (asteroids)
   * @param startDate - Start date (YYYY-MM-DD format)
   * @param endDate - End date (YYYY-MM-DD format, max 7 days from start)
   * @returns NEO data including potentially hazardous objects
   */
  async getNearEarthObjects(
    startDate: string,
    endDate: string
  ): Promise<APIResponse<{
    element_count: number;
    near_earth_objects: Record<string, NearEarthObject[]>;
  }>> {
    const params = {
      api_key: config.apiKeys.nasa,
      start_date: startDate,
      end_date: endDate,
    };

    return this.cachedGet(
      '/neo/rest/v1/feed',
      { params },
      `neo:${startDate}:${endDate}`,
      config.cache.ttl.neo
    );
  }

  /**
   * Get Earth imagery from Landsat 8
   * @param lat - Latitude (-90 to 90)
   * @param lon - Longitude (-180 to 180)
   * @param date - Optional date (YYYY-MM-DD). Defaults to most recent available
   * @param dim - Image dimension (0.025 to 0.5, default 0.025)
   * @returns Earth imagery metadata and URL
   */
  async getEarthImagery(
    lat: number,
    lon: number,
    date?: string,
    dim: number = 0.025
  ): Promise<APIResponse<EarthImagery>> {
    const params: Record<string, string | number> = {
      api_key: config.apiKeys.nasa,
      lat,
      lon,
      dim,
    };

    if (date) {
      params.date = date;
    }

    return this.cachedGet<EarthImagery>(
      '/planetary/earth/imagery',
      { params },
      `earth-imagery:${lat}:${lon}:${date || 'latest'}`,
      config.cache.ttl.earth
    );
  }

  /**
   * Get space weather events from DONKI (Space Weather Database Of Notifications, Knowledge, Information)
   * @param type - Event type: FLR (Solar Flare), SEP (Solar Energetic Particle), CME (Coronal Mass Ejection),
   *               IPS (Interplanetary Shock), MPC (Magnetopause Crossing), GST (Geomagnetic Storm),
   *               RBE (Radiation Belt Enhancement), HSS (High Speed Stream)
   * @param startDate - Start date (YYYY-MM-DD)
   * @param endDate - End date (YYYY-MM-DD, max 30 days from start)
   * @returns Array of space weather events
   */
  async getDONKIEvents(
    type: string,
    startDate: string,
    endDate: string
  ): Promise<APIResponse<any[]>> {
    const params = {
      api_key: config.apiKeys.nasa,
      startDate,
      endDate,
    };

    const typeMap: Record<string, string> = {
      FLR: 'FLR',
      SEP: 'SEP',
      CME: 'CME',
      IPS: 'IPS',
      MPC: 'MPC',
      GST: 'GST',
      RBE: 'RBE',
      HSS: 'HSS',
    };

    const eventType = typeMap[type.toUpperCase()] || 'FLR';

    return this.cachedGet<any[]>(
      `/DONKI/${eventType}`,
      { params },
      `donki:${eventType}:${startDate}:${endDate}`,
      config.cache.ttl.spaceWeather
    );
  }
}
