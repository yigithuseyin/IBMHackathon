export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/dashboard/:path*", "/households/:path*", "/profile/:path*"],
};
