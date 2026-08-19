import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// Keep AUTH_SECRET in the proxy bundle so JWT cookies can be read on /admin.
void process.env.AUTH_SECRET;

const { auth } = NextAuth(authConfig);

/** Next 16: `middleware.js` je deprecated; gate za `/admin` ide ovdje. */
export const proxy = auth;

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
