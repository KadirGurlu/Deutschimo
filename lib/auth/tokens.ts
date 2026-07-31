import { createHash, randomBytes } from "node:crypto";

export function createSecureToken() {
  return randomBytes(32).toString("hex");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
