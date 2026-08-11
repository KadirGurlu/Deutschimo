import { NextResponse } from "next/server";

export function apiOk<T>(
  data: T,
  options: { status?: number; requestId?: string; headers?: HeadersInit } = {},
) {
  const headers = new Headers(options.headers);
  headers.set("Cache-Control", "no-store, max-age=0");
  if (options.requestId) headers.set("X-Request-Id", options.requestId);
  headers.set("X-Deutschimo-Api-Version", "1");
  return NextResponse.json({ data, error: null }, { status: options.status ?? 200, headers });
}

export function apiError(
  code: string,
  message: string,
  options: { status?: number; requestId?: string; headers?: HeadersInit } = {},
) {
  const headers = new Headers(options.headers);
  headers.set("Cache-Control", "no-store, max-age=0");
  if (options.requestId) headers.set("X-Request-Id", options.requestId);
  headers.set("X-Deutschimo-Api-Version", "1");
  return NextResponse.json(
    { data: null, error: { code, message } },
    { status: options.status ?? 400, headers },
  );
}
