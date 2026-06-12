import axios, { type AxiosError, type AxiosRequestConfig, type AxiosResponse, type RawAxiosRequestHeaders } from "axios";
import axiosRetry from "axios-retry";

import { firebaseConfigured, getFirebaseAuth } from "./firebase";

const configuredApiBaseUrl = String(import.meta.env.VITE_API_URL ?? "").trim();
const isDev = import.meta.env.DEV;

if (!configuredApiBaseUrl && !isDev) {
  console.warn("[api] VITE_API_URL is not set in production.");
}

const apiBaseUrl = configuredApiBaseUrl || (isDev ? "http://127.0.0.1:8000" : "");

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
  timeout: 15000,
});

axiosRetry(apiClient, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error: AxiosError) => {
    const method = error.config?.method?.toUpperCase() ?? "GET";
    const isSafeMethod = ["GET", "HEAD", "OPTIONS"].includes(method);
    const hasIdempotencyKey = Boolean(
      (error.config?.headers as RawAxiosRequestHeaders | undefined)?.["Idempotency-Key"],
    );
    const isRetryableStatus =
      error.response?.status === 429 ||
      (error.response?.status !== undefined && error.response.status >= 500);

    return (
      axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      (isRetryableStatus && (isSafeMethod || hasIdempotencyKey))
    );
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    if (firebaseConfigured) {
      try {
        const auth = getFirebaseAuth();
        const user = auth.currentUser;

        if (user && !config.headers.Authorization) {
          const token = await user.getIdToken();
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        if (isDev) {
          console.warn("Firebase Auth is not ready:", error);
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

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      if (firebaseConfigured) {
        try {
          const auth = getFirebaseAuth();
          const user = auth.currentUser;
          if (user) {
            const newToken = await user.getIdToken(true);
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return apiClient(originalRequest);
          }
        } catch (refreshError) {
          return Promise.reject(refreshError);
        }
      }
    }

    const payload = error.response?.data as Record<string, unknown> | undefined;
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
  token?: string;
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
