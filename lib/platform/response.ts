import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  DEUTSCHIMO_API_VERSION,
  DEUTSCHIMO_PLATFORM_VERSION,
  type ApiErrorCode,
  type ApiFailure,
  type ApiMeta,
  type ApiSuccess,
} from "@/lib/platform/contracts";

function safeRequestId(value: string | null) {
  const candidate = value?.trim() ?? "";
  return /^[A-Za-z0-9._:-]{8,128}$/u.test(candidate) ? candidate : randomUUID();
}

export function apiMeta(request: Request): ApiMeta {
  return {
    apiVersion: DEUTSCHIMO_API_VERSION,
    platformVersion: DEUTSCHIMO_PLATFORM_VERSION,
    requestId: safeRequestId(request.headers.get("x-request-id")),
    serverTime: new Date().toISOString(),
  };
}

export function apiSuccess<T>(
  request: Request,
  data: T,
  init: { status?: number; headers?: HeadersInit } = {},
) {
  const meta = apiMeta(request);
  const body: ApiSuccess<T> = { data, meta };
  const headers = new Headers(init.headers);
  headers.set("x-request-id", meta.requestId);
  headers.set("x-deutschimo-api-version", DEUTSCHIMO_API_VERSION);
  if (!headers.has("Cache-Control")) headers.set("Cache-Control", "private, no-store, max-age=0");
  return NextResponse.json(body, { status: init.status ?? 200, headers });
}

export function apiFailure(
  request: Request,
  status: number,
  code: ApiErrorCode,
  message: string,
  options: { details?: Record<string, unknown>; headers?: HeadersInit } = {},
) {
  const meta = apiMeta(request);
  const body: ApiFailure = {
    error: {
      code,
      message,
      ...(options.details ? { details: options.details } : {}),
    },
    meta,
  };
  const headers = new Headers(options.headers);
  headers.set("x-request-id", meta.requestId);
  headers.set("x-deutschimo-api-version", DEUTSCHIMO_API_VERSION);
  if (!headers.has("Cache-Control")) headers.set("Cache-Control", "no-store, max-age=0");
  return NextResponse.json(body, { status, headers });
}
