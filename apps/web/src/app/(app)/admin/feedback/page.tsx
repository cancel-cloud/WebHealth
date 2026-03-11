import { headers } from "next/headers";
import { FeedbackInbox } from "./feedback-inbox";

export default async function AdminFeedbackPage() {
  const res = await fetch(
    `${process.env.BETTER_AUTH_URL}/api/admin/feedback?status=open&page=1&limit=20`,
    {
      headers: { cookie: (await headers()).get("cookie") ?? "" },
      cache: "no-store",
    },
  );
  const data = await res.json();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Feedback Inbox</h1>
        <p className="text-muted-foreground text-sm">
          Review user-submitted feature requests and bug reports.
        </p>
      </div>
      <FeedbackInbox
        initialSubmissions={data.submissions ?? []}
        initialPagination={data.pagination ?? { page: 1, limit: 20, hasNext: false }}
      />
    </div>
  );
}
