import { NextResponse } from "next/server";
import { logApiFailure, logSystemError } from "@/lib/security/logging";
import { requestSecurityContext } from "@/lib/security/request";

type AnyHandler = (...args: any[]) => Response | Promise<Response>;

export function withApiMonitoring(route: string, handler: AnyHandler): AnyHandler {
  return async (request: Request, ...rest: any[]) => {
    const context = requestSecurityContext(request);
    try {
      const response = await handler(request, ...rest);
      response.headers.set("x-request-id", context.requestId);
      if (response.status >= 400) {
        await logApiFailure({ route, method: request.method, statusCode: response.status, ...context });
      }
      return response;
    } catch (error) {
      await logSystemError({ source: "route-handler", error, route, method: request.method, ...context });
      return NextResponse.json({ error: "Beklenmeyen bir sunucu hatası oluştu.", requestId: context.requestId }, { status: 500, headers: { "x-request-id": context.requestId } });
    }
  };
}
