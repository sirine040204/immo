import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// The base URL can be defined in .env.local
//const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'; //before nginx
const API_URL = process.env.NEXT_PUBLIC_API_URL || '/'; //after nginx

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

import { containsProfanity, isImageNSFW } from "@/shared/utils/moderation";

// Request Interceptor
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // ── GLOBAL AI MODERATION ──
    if (config.method && ['post', 'put', 'patch'].includes(config.method.toLowerCase())) {
      try {
        if (config.data instanceof FormData) {
          // Check FormData (usually File uploads and fields)
          for (const [key, value] of config.data.entries()) {
            if (typeof value === 'string' && containsProfanity(value)) {
              throw new Error("Profanity");
            } else if (value instanceof File && value.type.startsWith("image/")) {
              const isBad = await isImageNSFW(value);
              if (isBad) throw new Error("NSFW");
            }
          }
        } else if (config.data && typeof config.data === 'object') {
          // Check JSON body deeply
          const checkObj = (obj: any) => {
            if (!obj) return;
            if (typeof obj === 'string' && containsProfanity(obj)) {
              throw new Error("Profanity");
            } else if (typeof obj === 'object') {
              Object.values(obj).forEach(checkObj);
            }
          };
          checkObj(config.data);
        }
      } catch (e: any) {
        // Return a mock AxiosError so the frontend components naturally show the toast
        return Promise.reject({
          response: {
            data: {
              detail: e.message === "NSFW"
                ? "L'image a été rejetée : Contenu inapproprié détecté par l'IA."
                : "Votre texte contient un langage inapproprié. Veuillez le modifier."
            }
          }
        });
      }
    }

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

    // 403 Permission Denied Handling
    if (error.response?.status === 403) {
      const data = error.response.data as any;
      if (data?.missing_permission_code) {
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("permission:missing", {
              detail: { missing_permission_code: data.missing_permission_code }
            })
          );
        }
      }
    }

    // Pass the error to the global error handler or feature component
    return Promise.reject(error);
  }
);
