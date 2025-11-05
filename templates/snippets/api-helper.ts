/// <reference path="../../types/plugin.d.ts" />
import { getBaseUrl } from '../constants';

function apiRequest(endpoint: string, method: string = 'GET', body: any = null): any {
  const baseUrl = getBaseUrl();
  const headers: any = {
    'Content-Type': 'application/json',
    {{AUTH_HEADER}}
  };

  let response;
  if (method === 'GET') {
    response = http.GET(baseUrl + endpoint, headers, false);
  } else if (method === 'POST') {
    response = http.POST(baseUrl + endpoint, body ? JSON.stringify(body) : '', headers, false);
  } else {
    response = http.request(method, baseUrl + endpoint, body ? JSON.stringify(body) : '', headers, false);
  }

  if (!response.isOk) {
    throw new ScriptException('NetworkError', 'API request failed: ' + response.code);
  }

  return JSON.parse(response.body);
}

const apiClient = {
  get: (endpoint: string) => apiRequest(endpoint, 'GET'),
  post: (endpoint: string, body: any) => apiRequest(endpoint, 'POST', body),
  put: (endpoint: string, body: any) => apiRequest(endpoint, 'PUT', body),
  delete: (endpoint: string) => apiRequest(endpoint, 'DELETE'),
  request: (endpoint: string, method: string, body?: any) => apiRequest(endpoint, method, body)
};

export { apiRequest, apiClient };
