import { withAuth } from "next-auth/middleware";

export default withAuth({ pages: { signIn: "/login" } });

export const config = {
  matcher: [
    "/((?!login|api/auth|api/cron|_next/static|_next/image|favicon\\.ico|manifest\\.webmanifest|icons|pwa-icon|icon|apple-icon|robots\\.txt|sitemap\\.xml|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)",
  ],
};
