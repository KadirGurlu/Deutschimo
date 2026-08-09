import * as legacy from "./legacy-v36-route";
import { captureMasteryExchange } from "@/lib/mastery/bridge";

export * from "./legacy-v36-route";
export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  const handler = (legacy as unknown as { POST?: (request: Request) => Promise<Response> }).POST;
  if (!handler) return new Response("Method Not Allowed", { status: 405 });

  const requestCopy = request.clone();
  const response = await handler(request);

  if (response.ok) {
    try {
      const requestBody = await requestCopy.json().catch(() => null);
      const responseBody = await response.clone().json().catch(() => null);
      await captureMasteryExchange({ source: "vocabulary-review", requestBody, responseBody });
    } catch (error) {
      console.warn("V37 mastery bridge skipped:", error instanceof Error ? error.message : "unknown");
    }
  }
  return response;
}
