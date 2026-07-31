import NextAuth from "next-auth";
import authConfig from "@/auth.config";

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/progress/:path*",
    "/profile/:path*",
    "/vocabulary/:path*",
    "/writing/:path*",
    "/exams/:path*",
    "/learn/:path*",
    "/admin/:path*",
  ],
};
