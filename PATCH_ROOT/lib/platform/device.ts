import type { ClientPlatformValue } from "@/lib/platform/contracts";

const platforms = new Set<ClientPlatformValue>(["WEB", "IOS", "ANDROID"]);

function cleanOptionalText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null;
  const cleaned = value.trim();
  return cleaned ? cleaned.slice(0, maxLength) : null;
}

export type DeviceRegistrationInput = {
  deviceId: string;
  platform: ClientPlatformValue;
  appVersion: string;
  deviceName: string | null;
  locale: string | null;
  timezone: string | null;
};

export function parseDeviceRegistration(value: unknown): DeviceRegistrationInput | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const deviceId = typeof record.deviceId === "string" ? record.deviceId.trim() : "";
  const platform = typeof record.platform === "string" ? record.platform.trim().toUpperCase() as ClientPlatformValue : "WEB";
  const appVersion = typeof record.appVersion === "string" ? record.appVersion.trim() : "";

  if (!/^[A-Za-z0-9._:-]{12,256}$/u.test(deviceId)) return null;
  if (!platforms.has(platform)) return null;
  if (!/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/u.test(appVersion)) return null;

  return {
    deviceId,
    platform,
    appVersion: appVersion.slice(0, 64),
    deviceName: cleanOptionalText(record.deviceName, 120),
    locale: cleanOptionalText(record.locale, 32),
    timezone: cleanOptionalText(record.timezone, 64),
  };
}

export function parseDeviceRevocation(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const deviceId = typeof (value as Record<string, unknown>).deviceId === "string"
    ? String((value as Record<string, unknown>).deviceId).trim()
    : "";
  return /^[A-Za-z0-9._:-]{12,256}$/u.test(deviceId) ? { deviceId } : null;
}
