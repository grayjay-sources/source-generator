/**
 * GraphQL utilities for GrayJay plugins
 * Supports both standard GraphQL queries and persisted queries
 */

import { getBaseUrl } from '../constants';
import * as network from './network';

/**
 * GraphQL query options
 */
export interface GraphQLOptions {
  /** GraphQL query string */
  query?: string;
  /** Query variables */
  variables?: Record<string, any>;
  /** Custom headers */
  headers?: Record<string, string>;
  /** Whether to use authentication */
  useAuth?: boolean;
  /** Custom endpoint (defaults to /graphql) */
  endpoint?: string;
  /** Number of retries */
  retries?: number;
}

/**
 * Persisted query options (for APIs like GitHub, Joyn that use query hashing)
 */
export interface PersistedQueryOptions {
  /** Operation name */
  operationName: string;
  /** SHA256 hash of the query */
  sha256Hash: string;
  /** Persisted query version (usually 1) */
  version?: number;
  /** Query variables */
  variables?: Record<string, any>;
  /** Custom headers */
  headers?: Record<string, string>;
  /** Whether to use authentication */
  useAuth?: boolean;
  /** Number of retries */
  retries?: number;
}

/**
 * GraphQL error response
 */
export interface GraphQLError {
  code: string;
  message: string;
  errors?: any[];
  operationName?: string;
}

/**
 * GraphQL response tuple: [error, data]
 */
export type GraphQLResponse<T = any> = [GraphQLError | null, T | null];

/**
 * Execute a standard GraphQL query
 * @param options Query options
 * @returns [error, data] tuple
 */
export function executeQuery<T = any>(options: GraphQLOptions): GraphQLResponse<T> {
  const {
    query,
    variables = {},
    headers = {},
    useAuth = false,
    endpoint = '/graphql',
    retries = 3
  } = options;

  if (!query) {
    return [{ code: 'INVALID_QUERY', message: 'Query string is required' }, null];
  }

  try {
    const baseUrl = getBaseUrl();
    const url = endpoint.startsWith('http') ? endpoint : baseUrl + endpoint;

    const response = network.fetchGraphQL(
      url,
      query,
      variables,
      { headers, useAuth, retries }
    );

    return [null, response as T];
  } catch (error) {
    const err = error as any;
    if (err.message && err.message.includes('GraphQL errors')) {
      return [
        {
          code: 'GQL_ERROR',
          message: err.message,
          errors: err.errors
        },
        null
      ];
    }

    return [
      {
        code: 'EXCEPTION',
        message: error instanceof Error ? error.message : String(error)
      },
      null
    ];
  }
}

/**
 * Execute a persisted GraphQL query
 * Used by platforms that require query pre-registration (GitHub, Joyn, etc.)
 * @param options Persisted query options
 * @returns [error, data] tuple
 */
export function executePersistedQuery<T = any>(options: PersistedQueryOptions): GraphQLResponse<T> {
  const {
    operationName,
    sha256Hash,
    version = 1,
    variables = {},
    headers = {},
    useAuth = false,
    retries = 3
  } = options;

  if (!operationName || !sha256Hash) {
    return [
      {
        code: 'INVALID_PERSISTED_QUERY',
        message: 'operationName and sha256Hash are required'
      },
      null
    ];
  }

  try {
    const baseUrl = getBaseUrl();
    
    // Build query parameters for persisted query
    const params = new URLSearchParams();
    params.set('operationName', operationName);
    
    if (Object.keys(variables).length > 0) {
      params.set('variables', JSON.stringify(variables));
    }
    
    params.set('extensions', JSON.stringify({
      persistedQuery: {
        version,
        sha256Hash
      }
    }));
    
    const url = `${baseUrl}?${params.toString()}`;

    const response = network.getJson(url, {
      headers,
      useAuth,
      retries,
      throwOnError: false
    });

    // Check for GraphQL-level errors
    if (response && response.errors) {
      const message = response.errors.map((e: any) => e.message).join(', ');
      return [
        {
          code: 'GQL_ERROR',
          message,
          errors: response.errors,
          operationName
        },
        response.data || null
      ];
    }

    return [null, response.data as T];
  } catch (error) {
    return [
      {
        code: 'EXCEPTION',
        message: error instanceof Error ? error.message : String(error),
        operationName
      },
      null
    ];
  }
}

/**
 * Convenience function for simple GraphQL queries
 * Throws on error instead of returning tuple
 */
export function query<T = any>(queryString: string, variables?: Record<string, any>): T {
  const [error, data] = executeQuery<T>({ query: queryString, variables });
  
  if (error) {
    throw new ScriptException('GraphQLError', error.message);
  }
  
  return data as T;
}

/**
 * Convenience function for simple persisted queries
 * Throws on error instead of returning tuple
 */
export function persistedQuery<T = any>(
  operationName: string,
  sha256Hash: string,
  variables?: Record<string, any>
): T {
  const [error, data] = executePersistedQuery<T>({
    operationName,
    sha256Hash,
    variables
  });
  
  if (error) {
    throw new ScriptException('GraphQLError', error.message);
  }
  
  return data as T;
}

/**
 * Helper to build persisted query hash
 * For development - hash your queries and store them
 */
export function createPersistedQuery(
  operationName: string,
  sha256Hash: string,
  version: number = 1
): Pick<PersistedQueryOptions, 'operationName' | 'sha256Hash' | 'version'> {
  return { operationName, sha256Hash, version };
}
