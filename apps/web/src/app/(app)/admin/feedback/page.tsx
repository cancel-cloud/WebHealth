import { headers } from "next/headers";
import { FeedbackInbox } from "./feedback-inbox";
import { ADMIN_PAGE_COPY, getAdminLanguage } from "../admin-page-copy";

export default async function AdminFeedbackPage() {
  const copy = ADMIN_PAGE_COPY[await getAdminLanguage()].feedback;
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
        <h1 className="text-2xl font-semibold tracking-tight">{copy.title}</h1>
        <p className="text-muted-foreground text-sm">
          {copy.description}
        </p>
      </div>
      <FeedbackInbox
        initialSubmissions={data.submissions ?? []}
        initialPagination={data.pagination ?? { page: 1, limit: 20, hasNext: false }}
      />
    </div>
  );
}
