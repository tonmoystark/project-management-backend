import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";
import { API_URL } from "@/config/api";

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

const ACCESS_TOKEN_KEY = "pm_access_token";
const REFRESH_TOKEN_KEY = "pm_refresh_token";

export const tokenStorage = {
  getAccessToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  setTokens: (accessToken?: string, refreshToken?: string) => {
    if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },
  clear: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

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
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach Bearer token fallback (ensures cross-site auth works even when browsers block 3rd-party cookies)
apiClient.interceptors.request.use((config) => {
  const token = tokenStorage.getAccessToken();
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
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
      }).then(() => {
        const latestToken = tokenStorage.getAccessToken();
        if (latestToken) {
          originalRequest.headers.Authorization = `Bearer ${latestToken}`;
        }
        return apiClient(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const storedRefreshToken = tokenStorage.getRefreshToken();
      const { data } = await axios.post<
        ApiResponse<{ accessToken?: string; refreshToken?: string }>
      >(
        `${API_URL}/auth/refresh-token`,
        storedRefreshToken ? { refreshToken: storedRefreshToken } : {},
        { withCredentials: true },
      );

      tokenStorage.setTokens(data.data?.accessToken, data.data?.refreshToken);

      if (data.data?.accessToken) {
        originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
      }

      processQueue(null);
      return apiClient(originalRequest);
    } catch (refreshError) {
      tokenStorage.clear();
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
