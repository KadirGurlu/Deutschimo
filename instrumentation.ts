export async function register() {}

type RequestErrorRequest = { path: string; method: string; headers: Record<string, string | string[] | undefined> };
type RequestErrorContext = { routerKind: string; routePath: string; routeType: string; renderSource?: string };

/**
 * Next.js compiles instrumentation for both Node.js and Edge runtimes.
 * Keep this hook runtime-neutral: Node-only database logging remains in
 * monitored Route Handlers, while uncaught framework errors are emitted to
 * Vercel logs with a structured payload.
 */
export async function onRequestError(error: unknown, request: RequestErrorRequest, context: RequestErrorContext) {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  console.error("next_request_error", {
    source: `next-${context.routeType}`,
    route: context.routePath || request.path,
    method: request.method,
    routerKind: context.routerKind,
    renderSource: context.renderSource,
    message: message.slice(0, 4000),
    stack: stack?.slice(0, 16000),
  });
}
