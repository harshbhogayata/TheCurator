import axios, { type AxiosError, type AxiosRequestConfig, type AxiosResponse, type RawAxiosRequestHeaders } from "axios";
import Constants from "expo-constants";
import axiosRetry from "axios-retry";

import { firebaseConfigured, getFirebaseAuth } from "./firebase";
import { firebaseRuntimeHint } from "../lib/firebase-config";
import { resolveApiBaseUrl } from "../lib/resolve-api-base-url";

const configuredApiBaseUrl = resolveApiBaseUrl(
  String(Constants.expoConfig?.extra?.apiUrl ?? process.env.EXPO_PUBLIC_API_URL ?? ""),
);
if (!configuredApiBaseUrl && !__DEV__) {
  throw new Error("Production API URL is not configured.");
}

const apiBaseUrl = configuredApiBaseUrl;
if (__DEV__) {
  console.log("[Curator] API base URL:", apiBaseUrl);
  if (process.env.EXPO_PUBLIC_MOCK_BACKEND === "true") {
    console.log("[Curator] Mock backend enabled — using bundled demo content for briefs/articles.");
  }
  const firebaseHint = firebaseRuntimeHint();
  if (firebaseHint) {
    console.warn(`[Curator] ${firebaseHint}`);
  }
}
if (!__DEV__ && !apiBaseUrl.startsWith("https://")) {
  throw new Error("Production API URL must use HTTPS.");
}

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

axiosRetry(apiClient, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error: AxiosError) => {
    const method = error.config?.method?.toUpperCase() ?? "GET";
    const isSafeMethod = ["GET", "HEAD", "OPTIONS"].includes(method);
    const hasIdempotencyKey = Boolean((error.config?.headers as RawAxiosRequestHeaders | undefined)?.["Idempotency-Key"]);
    const isRetryableStatus =
      error.response?.status === 429 ||
      (error.response?.status !== undefined && error.response.status >= 500);

    return axiosRetry.isNetworkOrIdempotentRequestError(error) || (isRetryableStatus && (isSafeMethod || hasIdempotencyKey));
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    if (firebaseConfigured) {
      try {
        const auth = getFirebaseAuth();
        const user = auth.currentUser;

        if (user && !config.headers.Authorization) {
          // Force refresh if close to expiry
          const token = await user.getIdToken();
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        if (__DEV__) {
          console.warn("Firebase Auth is not fully configured or ready:", error);
        }
      }
    }

    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized by forcing a token refresh
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      if (firebaseConfigured) {
        try {
          const auth = getFirebaseAuth();
          const user = auth.currentUser;
          if (user) {
            const newToken = await user.getIdToken(true); // force refresh
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return apiClient(originalRequest);
          }
        } catch (refreshError) {
          // Log to Sentry here eventually
          return Promise.reject(refreshError);
        }
      }
    }

    const payload = error.response?.data as any;
    const message =
      typeof payload === "object" && payload !== null && typeof payload.detail === "string"
        ? payload.detail
        : error.message || "Something went wrong while talking to Curator.";

    const status = error.response?.status ?? 0;
    return Promise.reject(new ApiError(message, status, payload));
  },
);

export interface ApiRequestOptions extends Omit<AxiosRequestConfig, "url" | "method" | "data" | "headers"> {
  body?: unknown;
  method?: AxiosRequestConfig["method"];
  headers?: RawAxiosRequestHeaders;
  token?: string; // Kept for backwards compatibility but largely unused now
}

export async function apiRequest<T>(
  path: string,
  { body, method = "GET", headers, token, ...init }: ApiRequestOptions = {},
): Promise<T> {
  try {
    const requestHeaders = { ...headers };
    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`;
    }

    const response = await apiClient.request<T, AxiosResponse<T>>({
      url: path,
      method,
      data: body,
      headers: requestHeaders,
      ...init,
    });
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError("An unexpected error occurred", 0, error);
  }
}
