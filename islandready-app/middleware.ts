import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { withAuth } from "next-auth/middleware";

// Dashboard pages redirect to /login when unauthenticated (see authOptions.pages).
// /api/* routes handle auth themselves and return 401 JSON (no redirects).
export const config = { matcher: ["/dashboard/:path*"] };

// Serverless-safe: if NEXTAUTH_SECRET is not configured (fresh Netlify deploy
// before env is set), send dashboard traffic to /login instead of throwing
// a 500 from the auth middleware. Once the secret is set, delegate to next-auth.
const authMiddleware = withAuth({ pages: { signIn: "/login" } });

export default function middleware(req: NextRequest) {
  if (!process.env.NEXTAUTH_SECRET) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  // @ts-expect-error withAuth wrapper signature differs from plain middleware
  return authMiddleware(req);
}
