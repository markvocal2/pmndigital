export { auth as proxy } from "@/auth";

export const config = {
  // Run on everything except: Next internals, public files, auth flow + auth pages, root
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|login|register|$).*)",
  ],
};
