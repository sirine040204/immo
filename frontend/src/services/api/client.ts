/**
 * Centralized API client for communication with the Django backend.
 * 
 * Ensures all requests go through a single point, handling base URLs,
 * generic headers, authentication tokens (when implemented), and error handling.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1/';

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = new URL(endpoint, API_BASE_URL);

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    // 'Authorization': `Bearer ${token}` // TODO: Add auth token later
  };

  const response = await fetch(url.toString(), {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    // Handle generic HTTP errors
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `API Error: ${response.status}`);
  }

  // Handle empty responses
  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}
