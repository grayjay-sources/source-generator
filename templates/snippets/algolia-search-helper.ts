

// Helper for Algolia-powered search (used by platforms like Joyn, Twitch, etc.)

import * as network from '../utils/network';
{{ALGOLIA_GRAPHQL_IMPORT}}

// TODO: Add these to your config.json constants:
// "constants": {
//   "algoliaAppId": "YOUR_APP_ID",
//   "algoliaBaseUrl": "https://YOUR_APP_ID-dsn.algolia.net/1/indexes/*/queries",
//   "algoliaIndexName": "your_index_name"
// }

/**
 * Get Algolia API key from platform's API
 * Some platforms expose this via a GraphQL query or REST endpoint
 */
function refreshAlgoliaApiKey(): void {
  try {
    // Example: Query platform's API for Algolia credentials
    // Adjust this based on your platform's API
    {{ALGOLIA_KEY_FETCH}}
    
    if (data && data.algoliaApiKey) {
      plugin.state.algoliaApiKey = data.algoliaApiKey.key || '';
      // API keys usually have expiration timestamps
      plugin.state.algoliaApiKeyExpiration = Date.now() + (24 * 60 * 60 * 1000);
      log('Algolia API key refreshed');
    }
  } catch (e) {
    log('Error refreshing Algolia key: ' + e);
  }
}

/**
 * Check if Algolia API key is still valid
 */
function isAlgoliaKeyValid(): boolean {
  const currentTime = Date.now();
  return plugin.state.algoliaApiKey && plugin.state.algoliaApiKeyExpiration > currentTime;
}

/**
 * Search using Algolia
 * @param query Search query string
 * @param page Page number (0-indexed)
 * @param hitsPerPage Results per page
 * @returns [error, results] tuple
 */
function searchWithAlgolia(
  query: string,
  page: number = 0,
  hitsPerPage: number = 20
): [any, any] {
  // Refresh API key if needed
  if (!isAlgoliaKeyValid()) {
    refreshAlgoliaApiKey();
  }
  
  if (!plugin.state.algoliaApiKey) {
    return [{ code: 'NO_API_KEY', message: 'No Algolia API key available' }, null];
  }
  
  // Get Algolia config from plugin config
  const pluginConfig = plugin.config as any;
  const algoliaAppId = pluginConfig?.constants?.algoliaAppId || '';
  const algoliaBaseUrl = pluginConfig?.constants?.algoliaBaseUrl || '';
  const algoliaIndexName = pluginConfig?.constants?.algoliaIndexName || '{{ALGOLIA_INDEX_NAME}}';
  
  if (!algoliaAppId || !algoliaBaseUrl) {
    return [{ code: 'CONFIG_ERROR', message: 'Algolia configuration missing in config.json constants' }, null];
  }
  
  // Build Algolia search request
  const algoliaRequest = {
    requests: [
      {
        indexName: algoliaIndexName, // e.g., 'joyn_prod', 'twitch_streams'
        params: `query=${encodeURIComponent(query)}&hitsPerPage=${hitsPerPage}&page=${page}`
      }
    ]
  };
  
  const headers = {
    'x-algolia-application-id': algoliaAppId,
    'x-algolia-api-key': plugin.state.algoliaApiKey
  };
  
  try {
    const data = network.postJson(
      algoliaBaseUrl,
      algoliaRequest,
      { headers, retries: 2, throwOnError: false }
    );
    
    if (!data) {
      return [{ code: 'NO_RESPONSE', message: 'Search failed: No response' }, null];
    }
    
    const hits = data.results?.[0]?.hits || [];
    const nbPages = data.results?.[0]?.nbPages || 0;
    const totalHits = data.results?.[0]?.nbHits || 0;
    
    return [null, {
      hits,
      page,
      nbPages,
      totalHits,
      hasMore: (page + 1) < nbPages
    }];
  } catch (error) {
    return [{ code: 'EXCEPTION', message: String(error) }, null];
  }
}
