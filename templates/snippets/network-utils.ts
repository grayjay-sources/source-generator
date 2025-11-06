/**
 * Unified network request utilities for GrayJay plugins
 * Provides consistent API for HTTP, JSON, HTML, and GraphQL requests
 * with automatic retries, error handling, and conditional features
 */

{{NETWORK_IMPORTS}}

/**
 * Request options for network calls
 */
export interface FetchOptions {
  /** HTTP method (GET, POST, PUT, DELETE, etc.) */
  method?: string;
  /** Request headers */
  headers?: Record<string, string>;
  /** Request body (will be stringified for JSON) */
  data?: any;
  /** Whether to use authentication */
  useAuth?: boolean;
  /** Number of retry attempts (default: 3) */
  retries?: number;
  /** Delay between retries in milliseconds (default: 1000) */
  retryDelay?: number;
  /** Whether to parse response as JSON (default: false) */
  parseJson?: boolean;
  /** Whether to parse response as HTML DOM (default: false) */
  parseHtml?: boolean;
  /** Whether to throw on non-OK responses (default: true) */
  throwOnError?: boolean;
  /** GraphQL query string (for GraphQL requests) */
  query?: string;
  /** GraphQL variables (for GraphQL requests) */
  variables?: Record<string, any>;
}

/**
 * Internal function to perform HTTP requests with retry logic
 */
function _fetch(url: string, options: FetchOptions = {}): any {
  const {
    method = 'GET',
    headers: customHeaders = {},
    data = null,
    useAuth = false,
    retries = 3,
    retryDelay = 1000,
    parseJson = false,
    parseHtml = false,
    throwOnError = true
  } = options;

  // Merge with default headers
  const defaultHeaders = getDefaultHeaders();
  const headers = { ...defaultHeaders, ...customHeaders };

  let lastError: Error | null = null;
  let attempts = retries + 1; // +1 for initial attempt

  while (attempts > 0) {
    try {
      let response;
      const upperMethod = method.toUpperCase();

      // Prepare body for POST/PUT/PATCH requests
      const body = data ? (typeof data === 'string' ? data : JSON.stringify(data)) : '';

      // Execute request based on method
      if (upperMethod === 'GET') {
        response = http.GET(url, headers, useAuth);
      } else if (upperMethod === 'POST') {
        response = http.POST(url, body, headers, useAuth);
      } else {
        response = http.request(upperMethod, url, body, headers, useAuth);
      }

      // Check response status
      if (!response.isOk) {
        const error = new ScriptException(
          'NetworkError',
          `Request to ${url} failed with status ${response.code}`
        );
        if (throwOnError) {
          throw error;
        }
        return null;
      }

      // Parse response based on options
      if (parseJson) {
        const jsonData = JSON.parse(response.body);
        // Check for API-level errors
        if (jsonData.errors) {
          throw new ScriptException('APIError', JSON.stringify(jsonData.errors));
        }
        return jsonData;
      }

      if (parseHtml) {
        {{HTML_PARSE_IMPLEMENTATION}}
      }

      // Return raw response
      return response;

    } catch (error) {
      lastError = error as Error;
      attempts--;

      if (attempts > 0) {
        // Wait before retry
        if (retryDelay > 0) {
          // Note: GrayJay doesn't have setTimeout, so we do a busy wait
          const start = Date.now();
          while (Date.now() - start < retryDelay) {
            // Busy wait
          }
        }
      }
    }
  }

  // All attempts failed
  if (throwOnError) {
    throw new ScriptException(
      'NetworkError',
      `Request to ${url} failed after ${retries + 1} attempts: ${lastError?.message || 'Unknown error'}`
    );
  }

  return null;
}

/**
 * Perform a general HTTP request
 * @param urlOrOptions - URL string or FetchOptions object with url property
 * @param options - Additional options (if first param is a string)
 */
export function fetch(urlOrOptions: string | (FetchOptions & { url: string }), options?: FetchOptions): any {
  if (typeof urlOrOptions === 'string') {
    return _fetch(urlOrOptions, options || {});
  } else {
    const { url, ...opts } = urlOrOptions;
    return _fetch(url, opts);
  }
}

/**
 * Perform a GET request
 */
export function get(url: string, options: Omit<FetchOptions, 'method'> = {}): any {
  return _fetch(url, { ...options, method: 'GET' });
}

/**
 * Perform a POST request
 */
export function post(url: string, data?: any, options: Omit<FetchOptions, 'method' | 'data'> = {}): any {
  return _fetch(url, { ...options, method: 'POST', data });
}

/**
 * Perform a PUT request
 */
export function put(url: string, data?: any, options: Omit<FetchOptions, 'method' | 'data'> = {}): any {
  return _fetch(url, { ...options, method: 'PUT', data });
}

/**
 * Perform a DELETE request
 */
export function del(url: string, options: Omit<FetchOptions, 'method'> = {}): any {
  return _fetch(url, { ...options, method: 'DELETE' });
}

/**
 * Fetch and parse JSON response
 */
export function fetchJson(url: string, options: Omit<FetchOptions, 'parseJson'> = {}): any {
  const headers = {
    'Accept': 'application/json',
    ...(options.headers || {})
  };
  return _fetch(url, { ...options, headers, parseJson: true });
}

/**
 * Perform GET request and parse JSON response
 */
export function getJson(url: string, options: Omit<FetchOptions, 'method' | 'parseJson'> = {}): any {
  return fetchJson(url, { ...options, method: 'GET' });
}

/**
 * Perform POST request and parse JSON response
 */
export function postJson(url: string, data?: any, options: Omit<FetchOptions, 'method' | 'data' | 'parseJson'> = {}): any {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  return fetchJson(url, { ...options, headers, method: 'POST', data });
}

/**
 * Fetch and parse HTML response as DOM
 * {{HTML_USAGE_WARNING}}
 */
export function fetchHtml(url: string, options: Omit<FetchOptions, 'parseHtml'> = {}): any {
  {{HTML_PARSE_CHECK}}
  return _fetch(url, { ...options, parseHtml: true });
}

/**
 * Perform GET request and parse HTML response as DOM
 * {{HTML_USAGE_WARNING}}
 */
export function getHtml(url: string, options: Omit<FetchOptions, 'method' | 'parseHtml'> = {}): any {
  {{HTML_PARSE_CHECK}}
  return _fetch(url, { ...options, method: 'GET', parseHtml: true });
}

/**
 * Execute a GraphQL query
 * @param endpoint - GraphQL endpoint URL
 * @param query - GraphQL query string
 * @param variables - GraphQL variables
 * @param options - Additional fetch options
 */
export function fetchGraphQL(
  endpoint: string,
  query: string,
  variables: Record<string, any> = {},
  options: Omit<FetchOptions, 'method' | 'data' | 'parseJson' | 'query' | 'variables'> = {}
): any {
  const payload = { query, variables };
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const response = _fetch(endpoint, {
    ...options,
    method: 'POST',
    headers,
    data: payload,
    parseJson: true
  });

  // GraphQL returns data in a `data` property
  if (response && response.data) {
    return response.data;
  }

  return response;
}

/**
 * Network utilities export
 */
export const network = {
  fetch,
  get,
  post,
  put,
  delete: del,
  fetchJson,
  getJson,
  postJson,
  fetchHtml,
  getHtml,
  fetchGraphQL
};
