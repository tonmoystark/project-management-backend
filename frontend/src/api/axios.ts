import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";

export interface ApiResponse<T = unknown> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
}

export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  errors: Array<Record<string, string>>;
  success: false;
  data: null;
}

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

interface QueuedRequest {
  resolve: () => void;
  reject: (error: unknown) => void;
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1";

// Auth endpoints that should not trigger an automatic token refresh on 401
const AUTH_SKIP_REFRESH_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/refresh-token",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/verify-email",
];

let isRefreshing = false;
let failedQueue: QueuedRequest[] = [];
let onUnauthorizedCallback: (() => void) | null = null;

/**
 * Register a callback (e.g. from AuthContext) to clear local auth state
 * and redirect to /login when token refresh fails.
 */
export const setUnauthorizedHandler = (handler: (() => void) | null) => {
  onUnauthorizedCallback = handler;
};

const processQueue = (error: unknown) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve();
    }
  });
  failedQueue = [];
};

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (!originalRequest || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    const requestUrl = originalRequest.url ?? "";
    const shouldSkipRefresh = AUTH_SKIP_REFRESH_PATHS.some((path) =>
      requestUrl.includes(path),
    );

    if (shouldSkipRefresh || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<void>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() => apiClient(originalRequest));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      await axios.post(
        `${API_BASE_URL}/auth/refresh-token`,
        {},
        { withCredentials: true },
      );

      processQueue(null);
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError);
      onUnauthorizedCallback?.();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export const getApiErrorMessage = (
  error: unknown,
  fallback = "Something went wrong",
): string => {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data?.message || error.message || fallback;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
};

export const getApiFieldErrors = (error: unknown): Record<string, string> => {
  if (!axios.isAxiosError<ApiErrorResponse>(error)) {
    return {};
  }

  const errors = error.response?.data?.errors;
  if (!Array.isArray(errors)) {
    return {};
  }

  return errors.reduce<Record<string, string>>((acc, item) => {
    for (const [field, message] of Object.entries(item)) {
      if (!acc[field]) {
        acc[field] = message;
      }
    }
    return acc;
  }, {});
};

export default apiClient;
