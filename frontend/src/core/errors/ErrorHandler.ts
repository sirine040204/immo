import { AxiosError } from 'axios';

/**
 * Standardized error structure for the frontend
 */
export interface AppError {
  message: string;
  code?: string;
  details?: any;
}

/**
 * Parses unknown error formats into a standardized AppError format
 */
export const parseError = (error: unknown): AppError => {
  if (error instanceof AxiosError) {
    // Extract standard Django REST Framework errors if available
    const data = error.response?.data;
    const message = data?.detail || data?.message || error.message || 'An unexpected server error occurred.';
    return {
      message,
      code: error.code,
      details: data,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
    };
  }

  return {
    message: 'An unknown error occurred.',
  };
};

/**
 * Utility to log errors safely
 */
export const logError = (error: unknown) => {
  const appError = parseError(error);
  // Here we could send the error to Sentry, LogRocket, etc.
  console.error('[App Error]', appError.message, appError.details);
};
