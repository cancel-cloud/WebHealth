import { getMarkdownDocument } from "../(marketing)/agent-discovery.logic";

export function GET(request: Request) {
  const url = new URL(request.url);
  const path =
    request.headers.get("x-webhealth-markdown-path") ??
    url.searchParams.get("path");
  const document = path ? getMarkdownDocument(path) : null;

  if (!document) {
    return new Response("Not found", {
      status: 404,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }

  return new Response(document.markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      Vary: "Accept",
      "x-markdown-tokens": String(document.tokenEstimate),
    },
  });
}
