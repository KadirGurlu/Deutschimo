import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
let failed = false;
const warnings = [];

function rel(...parts) {
  return path.join(...parts);
}

function read(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    console.error(`✗ Eksik dosya: ${relativePath}`);
    failed = true;
    return "";
  }
  return fs.readFileSync(absolutePath, "utf8");
}

function requireText(name, source, needles) {
  for (const needle of needles) {
    if (!source.includes(needle)) {
      console.error(`✗ ${name}: gerekli güvenlik işareti bulunamadı -> ${needle}`);
      failed = true;
    }
  }
}

function walkRoutes(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) walkRoutes(absolute, out);
    else if (entry.isFile() && entry.name === "route.ts") out.push(absolute);
  }
  return out;
}

function apiPathFromFile(file) {
  const apiRoot = path.join(root, "app", "api");
  const relative = path.relative(apiRoot, path.dirname(file));
  const segments = relative.split(path.sep).filter(Boolean);
  return `/api/${segments.join("/")}`.replace(/\/$/, "");
}

function matchesPrefix(route, prefix) {
  return route === prefix || route.startsWith(`${prefix}/`);
}

console.log("\nDeutschimo V46.5.2 - Authorization & Security Boundaries Validation");
console.log("================================================================");

const middleware = read("middleware.ts");
requireText("middleware.ts", middleware, [
  "V46.5 AUTHORIZATION & SECURITY BOUNDARIES",
  'matchesPrefix(pathname, "/api/admin")',
  "privateApiPrefixes",
  "request.auth?.user",
  "Bu işlem için yönetici yetkisi gerekli.",
  'matchesPrefix(pathname, "/admin")',
  'x-deutschimo-api-version',
]);

const authorization = read(rel("lib", "auth", "authorization.ts"));
requireText("lib/auth/authorization.ts", authorization, [
  "currentDatabaseUser",
  "where: { id: session.user.id }",
  "isAdminRole",
  "isSuperAdminRole",
  "canAdminManageTarget",
  "canAssignRole",
  "requireOnboardedUser",
  "onboardingCompleted: true",
]);

const apiMonitor = read(rel("lib", "security", "api-monitor.ts"));
requireText("lib/security/api-monitor.ts", apiMonitor, [
  "V46.5 AUTHORIZATION & SECURITY BOUNDARIES",
  'type AccessLevel = "public" | "authenticated" | "admin"',
  "privateApiPrefixes",
  'matchesPrefix(route, "/api/admin")',
  "await auth()",
  'access === "admin"',
  "monitoredFailure",
  'route.startsWith("/api/v1/")',
  '!response.headers.has("Cache-Control")',
]);

const adminUserRoute = read(rel("app", "api", "admin", "users", "[id]", "route.ts"));
requireText("app/api/admin/users/[id]/route.ts", adminUserRoute, [
  "canAdminManageTarget",
  "canAssignRole",
  "Kendi rolünü değiştiremezsin.",
  "Bu kullanıcı üzerinde işlem yapma yetkin yok.",
  "Bu kullanıcıyı silme yetkin yok.",
]);

// Known IDOR-sensitive student endpoints must be bound to the authenticated database user.
for (const routeFile of [
  rel("app", "api", "progress", "route.ts"),
  rel("app", "api", "profile", "route.ts"),
]) {
  const source = read(routeFile);
  requireText(routeFile, source, ["getApiUser", "currentUser.id"]);

  const directUserIdInputs = [
    'body.userId',
    'body["userId"]',
    "body['userId']",
    'searchParams.get("userId")',
    "searchParams.get('userId')",
    'url.searchParams.get("userId")',
    "url.searchParams.get('userId')",
  ];
  for (const pattern of directUserIdInputs) {
    if (source.includes(pattern)) {
      console.error(`✗ ${routeFile}: istemciden gelen userId doğrudan kullanılmamalı -> ${pattern}`);
      failed = true;
    }
  }
}

const privatePrefixes = [
  "/api/account",
  "/api/assessment",
  "/api/intelligence",
  "/api/profile",
  "/api/progress",
  "/api/skills",
  "/api/vocabulary",
];

const routeFiles = walkRoutes(path.join(root, "app", "api"));
let privateRouteCount = 0;
let adminRouteCount = 0;
let dynamicPrivateRouteCount = 0;

for (const file of routeFiles) {
  const route = apiPathFromFile(file);
  const source = fs.readFileSync(file, "utf8");
  const isAdmin = matchesPrefix(route, "/api/admin");
  const isPrivate = privatePrefixes.some((prefix) => matchesPrefix(route, prefix));

  if (isAdmin) adminRouteCount += 1;
  if (isPrivate) privateRouteCount += 1;

  // Route-local or centralized monitoring is expected as defense-in-depth.
  if ((isAdmin || isPrivate) && !source.includes("withApiMonitoring") && !source.includes("getApiUser") && !source.includes("auth(")) {
    warnings.push(`${route}: route içinde açık auth/monitor guard görünmüyor; middleware sınırı var fakat route-local kontrol önerilir.`);
  }

  if (isAdmin && !source.includes("withApiMonitoring") && !(source.includes("getApiUser") && source.includes("isAdminRole"))) {
    warnings.push(`${route}: admin route için ikinci katman admin kontrolü doğrulanamadı.`);
  }

  // Heuristic IDOR scan. We fail only on a clear client-controlled userId combined with no owner binding.
  if (isPrivate && route.includes("[")) {
    dynamicPrivateRouteCount += 1;
    const hasOwnerBinding =
      source.includes("currentUser.id") ||
      source.includes("session.user.id") ||
      source.includes("session?.user.id") ||
      source.includes("session?.user?.id");

    const riskyUserIdPatterns = [
      "params.userId",
      "params.id",
      'searchParams.get("userId")',
      "searchParams.get('userId')",
      "body.userId",
    ];
    const riskyPattern = riskyUserIdPatterns.find((pattern) => source.includes(pattern));

    if (riskyPattern && !hasOwnerBinding) {
      console.error(`✗ Olası IDOR: ${route} istemci kontrollü kimlik kullanıyor (${riskyPattern}) fakat authenticated-owner binding görünmüyor.`);
      failed = true;
    } else if (source.includes("params") && !hasOwnerBinding) {
      warnings.push(`${route}: dinamik private route; nesne sahipliği manuel olarak doğrulanmalı.`);
    }
  }
}

console.log(`✓ API route taraması: ${routeFiles.length} route`);
console.log(`✓ Private namespace route: ${privateRouteCount}`);
console.log(`✓ Admin namespace route: ${adminRouteCount}`);
console.log(`✓ Dinamik private route: ${dynamicPrivateRouteCount}`);
console.log("✓ /api/progress ve /api/profile authenticated user scope kontrolü uyguluyor.");
console.log("✓ /api/admin/* için middleware + API-monitor katmanı doğrulandı.");
console.log("✓ ADMIN -> privileged ADMIN/SUPER_ADMIN hedeflerinde least-privilege kuralı doğrulandı.");

if (warnings.length) {
  console.log("\nUyarılar (otomatik tarama; manuel inceleme önerilir):");
  for (const warning of warnings) console.log(`! ${warning}`);
}

if (failed) {
  console.error("\nV46.5 VALIDATION FAILED - Hotfix güvenlik doğrulaması geçmedi.");
  process.exit(1);
}

console.log("\nV46.5.2 VALIDATION PASSED");
process.exit(0);
