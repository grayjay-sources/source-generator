

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
  return (config as any).constants?.baseUrl || BASE_URL;
}

export function getPlatformUrl(): string {
  // platformUrl is in root config, no need for constants
  return (config as any).platformUrl || PLATFORM_URL;
}

export function getPlatform(): string {
  // Platform name is in root config
  return (config as any).name || PLATFORM;
}

export function getDefaultHeaders(): Record<string, string> {
  return (config as any).constants?.defaultHeaders || DEFAULT_HEADERS;
}

// Add your custom constants here
