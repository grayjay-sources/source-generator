

// Advanced state management helper functions

import { getBaseUrl } from '../constants';

/**
 * Check if auth token is still valid
 */
export function isTokenValid(): boolean {
  const currentTime = Date.now();
  return plugin.state.authToken && plugin.state.authTokenExpiration > currentTime;
}

/**
 * Refresh authentication token
 * Call this from your enable() function or before API requests
 */
export function refreshAuthToken(): void {
  try {
    const baseUrl = getBaseUrl();
    // Example: Anonymous token endpoint
    const resp = http.POST(
      baseUrl + '/auth/token',
      JSON.stringify({}),
      { 'Content-Type': 'application/json' },
      false
    );
    
    if (!resp.isOk) {
      throw new ScriptException('Failed to get auth token: ' + resp.code);
    }
    
    const data = JSON.parse(resp.body);
    plugin.state.authToken = data.accessToken || data.token || '';
    plugin.state.userId = data.userId || data.user_id || '';
    
    // Token usually expires in 24 hours
    plugin.state.authTokenExpiration = Date.now() + (24 * 60 * 60 * 1000);
    
    log('Auth token refreshed');
  } catch (e) {
    log('Error refreshing token: ' + e);
  }
}

/**
 * Clear authentication state
 */
export function clearAuthState(): void {
  plugin.state.authToken = '';
  plugin.state.authTokenExpiration = 0;
  plugin.state.userId = '';
}

// Example usage in source.enable:
// if (!isTokenValid()) {
//   refreshAuthToken();
// }
