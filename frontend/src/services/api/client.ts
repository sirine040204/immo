import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// The base URL can be defined in .env.local
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Only access localStorage in the browser
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    // Basic 401 Handling (Logging out the user if access token is invalid)
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        // Clear tokens from storage
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        
        // Optional: Trigger a custom event to notify AuthContext to update state,
        // or redirect to login page. For now, a simple reload or letting context handle it.
        window.dispatchEvent(new Event("auth:logout"));
      }
    }
    
    // Pass the error to the global error handler or feature component
    return Promise.reject(error);
  }
);
