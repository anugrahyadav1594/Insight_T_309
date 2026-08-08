/**
 * Core API client for communicating with the INSIGHT FastAPI backend.
 *
 * - Reads the JWT access token from localStorage (no circular dependency with the auth store).
 * - Automatically unwraps the `{ success: true, data }` response envelope.
 * - Throws typed `ApiError` for all non-success responses.
 * - Supports `skipAuth` for public endpoints (login, register, refresh).
 */

// ─── Constants ───────────────────────────────────────────────────────────────

const API_BASE_URL =
  (typeof process !== "undefined" &&
    process.env?.NEXT_PUBLIC_API_URL) ||
  "http://localhost:9056";

export const TOKEN_KEY = "insight_access_token";
export const REFRESH_KEY = "insight_refresh_token";

// ─── ApiError ────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details: unknown;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  /** Skip the Authorization header (for public endpoints like login). */
  skipAuth?: boolean;
  /** Query parameters appended to the URL. */
  params?: Record<string, string | number | boolean | undefined | null>;
}

function buildUrl(path: string, params?: RequestOptions["params"]): string {
  const url = new URL(`/api/v1${path}`, API_BASE_URL);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

// ─── Core request function ───────────────────────────────────────────────────

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<T> {
  const { skipAuth, params, ...fetchInit } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (!skipAuth) {
    const token = getStoredToken();
    if (token) {
      if (token.startsWith("demo-")) {
        throw new ApiError(401, "DEMO_MODE", "Demo account mode active");
      }
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const response = await fetch(buildUrl(path, params), {
    ...fetchInit,
    method,
    headers: { ...headers, ...(fetchInit.headers as Record<string, string>) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // 204 No Content (e.g. DELETE)
  if (response.status === 204) {
    return undefined as T;
  }

  let json: Record<string, unknown>;
  try {
    json = await response.json();
  } catch {
    throw new ApiError(
      response.status,
      "PARSE_ERROR",
      "Failed to parse server response",
    );
  }

  if (!response.ok) {
    const error = (json?.error ?? {}) as Record<string, unknown>;
    throw new ApiError(
      response.status,
      (error.code as string) ?? "UNKNOWN",
      (error.message as string) ?? response.statusText,
      error.details,
    );
  }

  // Unwrap the success envelope: { success: true, data: T }
  if (json.success === true && "data" in json) {
    return json.data as T;
  }

  // Fallback for raw responses
  return json as T;
}

// ─── Public API ──────────────────────────────────────────────────────────────

export const apiClient = {
  get<T>(path: string, options?: RequestOptions): Promise<T> {
    return request<T>("GET", path, undefined, options);
  },

  post<T>(path: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>("POST", path, data, options);
  },

  put<T>(path: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>("PUT", path, data, options);
  },

  delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return request<T>("DELETE", path, undefined, options);
  },
};

// ─── Service Module Re-exports ───────────────────────────────────────────────
export * from "./api/index";

