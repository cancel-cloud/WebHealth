import { NextResponse, type NextRequest } from "next/server";
import {
  getAgencyRootRedirectPath,
  isAgencyLandingLanguage,
} from "./app/(marketing)/agency-seo.logic";
import {
  buildHomepageLinkHeader,
  getMarkdownRoutePath,
  shouldServeMarkdown,
} from "./app/(marketing)/agent-discovery.logic";

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname === "/") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = getAgencyRootRedirectPath(
      request.headers.get("accept-language"),
    );
    const response = NextResponse.redirect(redirectUrl);
    const linkHeader = buildHomepageLinkHeader(pathname);
    if (linkHeader) {
      response.headers.set("Link", linkHeader);
    }
    return response;
  }

  const headers = new Headers(request.headers);
  const firstSegment = pathname.split("/").filter(Boolean)[0] ?? "de";
  headers.set(
    "x-webhealth-locale",
    isAgencyLandingLanguage(firstSegment) ? firstSegment : "de",
  );

  if (shouldServeMarkdown(request.headers.get("accept"), pathname)) {
    const markdownRoutePath = getMarkdownRoutePath(pathname);
    if (markdownRoutePath) {
      const rewriteUrl = request.nextUrl.clone();
      rewriteUrl.pathname = "/agent-markdown";
      rewriteUrl.search = markdownRoutePath.slice(markdownRoutePath.indexOf("?"));
      headers.set("x-webhealth-markdown-path", pathname);

      return NextResponse.rewrite(rewriteUrl, {
        request: {
          headers,
        },
      });
    }
  }

  const response = NextResponse.next({
    request: {
      headers,
    },
  });

  const linkHeader = buildHomepageLinkHeader(pathname);
  if (linkHeader) {
    response.headers.set("Link", linkHeader);
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|og-image.png).*)"],
};
