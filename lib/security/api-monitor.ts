import { NextResponse } from "next/server";
import type { ApiErrorCode } from "@/lib/platform/contracts";
import { apiFailure } from "@/lib/platform/response";
import { logApiFailure, logSystemError, serverErrorCode } from "@/lib/security/logging";
import { requestSecurityContext } from "@/lib/security/request";

type AnyHandler = (...args: any[]) => Response | Promise<Response>;
type MonitorOptions = { maxBodyBytes?: number };
const bodyMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function requestValidationError(request: Request, maxBodyBytes: number) {
  if (!bodyMethods.has(request.method.toUpperCase())) return null;
  const contentLengthHeader = request.headers.get("content-length");
  const contentLength = contentLengthHeader ? Number(contentLengthHeader) : 0;
  if (Number.isFinite(contentLength) && contentLength > maxBodyBytes) {
    return { status: 413, error: `İstek gövdesi ${maxBodyBytes} bayt sınırını aşıyor.` };
  }
  if (contentLength > 0) {
    const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
    if (!contentType.startsWith("application/json")) {
      return { status: 415, error: "Bu işlem application/json içerik türü gerektiriyor." };
    }
  }
  return null;
}

function legacyFailure(requestId: string, status: number, message: string, errorCode?: string) {
  return NextResponse.json(
    { error: message, errorCode, requestId },
    {
      status,
      headers: {
        "x-request-id": requestId,
        "x-error-code": errorCode || "",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}

function monitoredFailure(
  request: Request,
  route: string,
  requestId: string,
  status: number,
  code: ApiErrorCode,
  message: string,
  errorCode?: string,
) {
  const response = route.startsWith("/api/v1/")
    ? apiFailure(request, status, code, message)
    : legacyFailure(requestId, status, message, errorCode);
  if (errorCode) response.headers.set("x-error-code", errorCode);
  return response;
}

export function withApiMonitoring(route: string, handler: AnyHandler, options: MonitorOptions = {}): AnyHandler {
  return async (request: Request, ...rest: any[]) => {
    const startedAt = performance.now();
    const context = requestSecurityContext(request);
    const validationError = requestValidationError(request, options.maxBodyBytes ?? 512 * 1024);
    if (validationError) {
      const errorCode = serverErrorCode("API", "VALIDATION", context.requestId);
      await logApiFailure({
        route,
        method: request.method,
        statusCode: validationError.status,
        message: `${errorCode} ${validationError.error}`,
        ...context,
      });
      return monitoredFailure(request, route, context.requestId, validationError.status, "BAD_REQUEST", validationError.error, errorCode);
    }

    try {
      const response = await handler(request, ...rest);
      response.headers.set("x-request-id", context.requestId);
      if (!response.headers.has("Cache-Control")) response.headers.set("Cache-Control", "no-store, max-age=0");
      response.headers.set("X-Content-Type-Options", "nosniff");
      response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
      response.headers.set("Server-Timing", `app;dur=${Math.max(0, performance.now() - startedAt).toFixed(1)}`);
      if (route.startsWith("/api/v1/") && !response.headers.has("x-deutschimo-api-version")) {
        response.headers.set("x-deutschimo-api-version", "v1");
      }
      if (response.status >= 400) {
        const errorCode = response.headers.get("x-error-code") || serverErrorCode("API", `HTTP_${response.status}`, context.requestId);
        response.headers.set("x-error-code", errorCode);
        await logApiFailure({
          route,
          method: request.method,
          statusCode: response.status,
          message: errorCode,
          ...context,
        });
      }
      return response;
    } catch (error) {
      if (error instanceof SyntaxError && bodyMethods.has(request.method.toUpperCase())) {
        const errorCode = serverErrorCode("API", "JSON", context.requestId);
        await logApiFailure({
          route,
          method: request.method,
          statusCode: 400,
          message: `${errorCode} Invalid JSON body`,
          ...context,
        });
        return monitoredFailure(request, route, context.requestId, 400, "BAD_REQUEST", "İstek gövdesi geçerli JSON değil.", errorCode);
      }
      const logged = await logSystemError({
        source: "API",
        operation: "ROUTE",
        error,
        route,
        method: request.method,
        ...context,
      });
      return monitoredFailure(
        request,
        route,
        context.requestId,
        500,
        "INTERNAL_ERROR",
        "Beklenmeyen bir sunucu hatası oluştu.",
        logged.errorCode,
      );
    }
  };
}
