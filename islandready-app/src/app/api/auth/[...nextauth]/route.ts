import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRateLimit, clientIp, rateLimitedResponse } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const handler = NextAuth(authOptions);

export function GET(req: Request, ctx: { params: Promise<{ nextauth: string[] }> }) {
  return handler(req, ctx);
}

// Login attempts are throttled per IP (60/min). Other NextAuth flows pass through.
// Throttled responses are generic JSON: they never reveal whether an email exists.
export function POST(req: Request, ctx: { params: Promise<{ nextauth: string[] }> }) {
  const url = new URL(req.url);
  if (url.pathname.endsWith("/callback/credentials")) {
    if (!checkRateLimit(`login:${clientIp(req)}`, 60, 60_000)) {
      return rateLimitedResponse();
    }
  }
  return handler(req, ctx);
}
