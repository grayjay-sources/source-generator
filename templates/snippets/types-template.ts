/**
 * Custom types for {{PLATFORM_NAME}} plugin
 * 
 * Define platform-specific types here:
 * - API response types
 * - Custom interfaces
 * - Type aliases
 */

// Example: API response types
export interface VideoResponse {
  id: string;
  title: string;
  description: string;
  // Add your API response fields here
}

export interface ChannelResponse {
  id: string;
  name: string;
  // Add your API response fields here
}

// Example: Custom plugin types
export interface PluginSettings {
  // Define any custom settings your plugin needs
}

export interface PluginState {
  // Define any state your plugin maintains
}

// Add more types as needed for your platform
