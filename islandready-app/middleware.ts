export { default } from "next-auth/middleware";

// Dashboard pages redirect to /login when unauthenticated (see authOptions.pages).
// /api/* routes handle auth themselves and return 401 JSON (no redirects).
export const config = { matcher: ["/dashboard/:path*"] };
