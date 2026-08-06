export type SemanticVersion = { major: number; minor: number; patch: number };

export function parseSemanticVersion(value: unknown): SemanticVersion | null {
  if (typeof value !== "string") return null;
  const match = /^(\d+)\.(\d+)\.(\d+)(?:[-+][0-9A-Za-z.-]+)?$/u.exec(value.trim());
  if (!match) return null;
  return { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]) };
}

export function compareSemanticVersions(left: SemanticVersion, right: SemanticVersion) {
  if (left.major !== right.major) return left.major - right.major;
  if (left.minor !== right.minor) return left.minor - right.minor;
  return left.patch - right.patch;
}

export function isVersionSupported(value: string, minimum: string) {
  const currentVersion = parseSemanticVersion(value);
  const minimumVersion = parseSemanticVersion(minimum);
  if (!currentVersion || !minimumVersion) return false;
  return compareSemanticVersions(currentVersion, minimumVersion) >= 0;
}

export function clientCompatibility() {
  return {
    web: {
      released: true,
      minimumVersion: process.env.MIN_WEB_APP_VERSION?.trim() || "31.0.0",
    },
    ios: {
      released: false,
      minimumVersion: process.env.MIN_IOS_APP_VERSION?.trim() || "0.0.0",
    },
    android: {
      released: false,
      minimumVersion: process.env.MIN_ANDROID_APP_VERSION?.trim() || "0.0.0",
    },
  } as const;
}
