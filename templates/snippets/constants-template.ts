
/**
 * Constants for {{PLATFORM_NAME}}
 * 
 * Note: PluginConfig type is defined in src/utils/types.d.ts
 * 
 * Access via the global plugin object:
 * - plugin.config (SourceConfig)
 * - plugin.settings (user's selected settings)
 */

// Error types for consistent exception handling
export const ERROR_TYPES = {
  NETWORK: 'NetworkError',
  AUTH: 'AuthenticationError',
  NOT_FOUND: 'NotFoundError',
  INVALID_DATA: 'InvalidDataError'
} as const;

/**
 * Get a plugin setting value
 * For Dropdown settings, returns the actual selected value (not index)
 * For Boolean settings, returns 'true' or 'false' string
 * @param variable The setting variable name
 * @param defaultValue Optional default value if setting doesn't exist
 * @returns The setting value
 */
export function getPluginSetting(variable: string, defaultValue?: string): string {
  // Return from runtime settings first (user's active selection)
  if (plugin.settings[variable] !== undefined) {
    return plugin.settings[variable];
  }
  
  // Fallback to config defaults
  const pluginConfig = plugin.config as unknown as PluginConfig;
  const setting = pluginConfig?.settings?.find(s => s.variable === variable);
  return setting?.default || defaultValue || '';
}

/**
 * Get the active API base URL
 * Uses the user's selected server from the baseUrl setting
 * Available URLs are defined in settings[baseUrl].options
 * @returns The active base URL
 */
export function getBaseUrl(): string {
  if (!plugin.config) {
    log('Warning: getBaseUrl() called before plugin.enable()');
    return '';
  }
  
  const pluginConfig = plugin.config as unknown as PluginConfig;
  
  // Get available URLs from settings (source of truth)
  const baseUrlSetting = pluginConfig.settings?.find(s => s.variable === 'baseUrl');
  const availableUrls = (baseUrlSetting?.options as string[]) || [];
  
  if (availableUrls.length === 0) {
    log('Warning: No base URLs configured in settings');
    return '';
  }
  
  // Get user's selected URL from settings (or default)
  const selectedUrl = getPluginSetting('baseUrl', availableUrls[0]);
  return selectedUrl || availableUrls[0];
}

/**
 * Get default HTTP headers from config.constants.defaultHeaders
 * @returns Headers object
 */
export function getDefaultHeaders(): Record<string, string> {
  if (!plugin.config) return {};
  const pluginConfig = plugin.config as unknown as PluginConfig;
  return pluginConfig.constants?.defaultHeaders || {};
}

// Add your custom constants here
