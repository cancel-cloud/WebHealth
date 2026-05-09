import { getRobotsTxt } from "../(marketing)/agent-discovery.logic";

export function GET() {
  return new Response(getRobotsTxt(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
