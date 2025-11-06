

/**
 * Extended plugin configuration type
 * Workaround until SourceConfig types are updated in @types/grayjay-source
 */
interface PluginConfig extends SourceConfig {
  /** Custom constants (e.g., baseUrl, apiKeys) */
  constants?: {
    baseUrl?: string;
    defaultHeaders?: Record<string, string>;
    [key: string]: any;
  };
  /** Repository URL */
  repositoryUrl?: string;
}

// Constants for {{PLATFORM_NAME}}
// NOTE: BASE_URL, PLATFORM_URL, and PLATFORM are available at runtime via config.constants
// These are fallback values for development/typing

export const BASE_URL = '{{BASE_URL}}';
export const PLATFORM_URL = '{{PLATFORM_URL}}';
export const PLATFORM = '{{PLATFORM_NAME}}';
export const DEFAULT_HEADERS: Record<string, string> = {};

export const ERROR_TYPES = {
  NETWORK: 'NetworkError',
  AUTH: 'AuthenticationError',
  NOT_FOUND: 'NotFoundError',
  INVALID_DATA: 'InvalidDataError'
};

// Helper to get runtime constants from config
export function getBaseUrl(): string {
  const pluginConfig = config as unknown as PluginConfig;
  return pluginConfig.constants?.baseUrl || BASE_URL;
}

export function getPlatformUrl(): string {
  const pluginConfig = config as unknown as PluginConfig;
  return pluginConfig.platformUrl || PLATFORM_URL;
}

export function getPlatform(): string {
  const pluginConfig = config as unknown as PluginConfig;
  return pluginConfig.name || PLATFORM;
}

export function getDefaultHeaders(): Record<string, string> {
  const pluginConfig = config as unknown as PluginConfig;
  return pluginConfig.constants?.defaultHeaders || DEFAULT_HEADERS;
}

// Add your custom constants here
