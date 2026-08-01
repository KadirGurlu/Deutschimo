import type { NextConfig } from "next";
const securityHeaders=[{key:"X-Content-Type-Options",value:"nosniff"},{key:"Referrer-Policy",value:"strict-origin-when-cross-origin"},{key:"X-Frame-Options",value:"DENY"},{key:"Permissions-Policy",value:"camera=(), geolocation=(), payment=()"},{key:"Cross-Origin-Opener-Policy",value:"same-origin"}];
const nextConfig:NextConfig={experimental:{optimizePackageImports:["lucide-react","recharts"]},async headers(){return[{source:"/(.*)",headers:securityHeaders}]}};export default nextConfig;
