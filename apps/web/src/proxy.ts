import { NextResponse, type NextRequest } from "next/server";
import {
  getAgencyRootRedirectPath,
  isAgencyLandingLanguage,
} from "./app/(marketing)/agency-seo.logic";

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname === "/") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = getAgencyRootRedirectPath(
      request.headers.get("accept-language"),
    );
    return NextResponse.redirect(redirectUrl);
  }

  const headers = new Headers(request.headers);
  const firstSegment = pathname.split("/").filter(Boolean)[0] ?? "de";
  headers.set(
    "x-webhealth-locale",
    isAgencyLandingLanguage(firstSegment) ? firstSegment : "de",
  );

  return NextResponse.next({
    request: {
      headers,
    },
  });
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|og-image.png).*)"],
};
