import { getLlmsTxt } from "../(marketing)/agent-discovery.logic";

export function GET() {
  const document = getLlmsTxt();

  return new Response(document.markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "x-markdown-tokens": String(document.tokenEstimate),
    },
  });
}
