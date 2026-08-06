export const DEUTSCHIMO_API_VERSION = "v1" as const;
export const DEUTSCHIMO_PLATFORM_VERSION = "31.0.0" as const;

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "UNSUPPORTED_CLIENT"
  | "SERVICE_UNAVAILABLE"
  | "INTERNAL_ERROR";

export type ApiMeta = {
  apiVersion: typeof DEUTSCHIMO_API_VERSION;
  platformVersion: typeof DEUTSCHIMO_PLATFORM_VERSION;
  requestId: string;
  serverTime: string;
};

export type ApiSuccess<T> = {
  data: T;
  meta: ApiMeta;
};

export type ApiFailure = {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: Record<string, unknown>;
  };
  meta: ApiMeta;
};

export type ClientPlatformValue = "WEB" | "IOS" | "ANDROID";
