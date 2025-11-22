/**
 * Custom React Hooks
 * Central export file for all hooks
 */

export {
  useApi,
  usePaginatedApi,
  usePolling,
  useDebouncedApi,
} from './useApi'

export {
  useWebSocket,
  useISSPosition,
  useSpaceWeather,
  useLaunchUpdates,
} from './useWebSocket'

export default {
  useApi,
  usePaginatedApi,
  usePolling,
  useDebouncedApi,
  useWebSocket,
  useISSPosition,
  useSpaceWeather,
  useLaunchUpdates,
}
