import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

/** Next 16: `middleware.js` je deprecated; gate za `/admin` ide ovdje. */
export const proxy = auth;

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
