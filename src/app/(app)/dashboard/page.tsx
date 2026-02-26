import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Link from "next/link";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { properties as propertiesSchema } from "@/db/schema";
import { SyncButton } from "./sync-button";
import { ReportsTable } from "./reports-table";
import { AutoSync } from "./auto-sync";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Fetch user's teams and property count
  const userTeams = await db.query.teamMembers.findMany({
    where: (tm, { eq }) => eq(tm.userId, session!.user.id),
  });

  let propertyCount = 0;
  let hasProperties = false;
  if (userTeams.length > 0) {
    const targetTeamId = userTeams[0].teamId;
    const userProperties = await db.query.properties.findMany({
      where: eq(propertiesSchema.teamId, targetTeamId),
    });
    propertyCount = userProperties.length;
    hasProperties = userProperties.length > 0;
  }

  return (
    <div className="space-y-8">
      <AutoSync hasProperties={hasProperties} />

      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight font-display" style={{ textWrap: "balance" }}>
            Overview
          </h1>
          <p className="text-muted-foreground mt-1">Manage your properties and generate SEO reports.</p>
        </div>
        <SyncButton />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/properties"
          className="group block p-6 rounded-3xl bg-card border border-border shadow-sm hover:shadow-md transition-all relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="Go to Properties page"
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <h3 className="font-medium text-muted-foreground mb-1">Properties</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold font-display text-foreground">{propertyCount}</span>
          </div>
        </Link>

        <Link
          href="/reports"
          className="group block p-6 rounded-3xl bg-card border border-border shadow-sm hover:shadow-md transition-all relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="Go to Reports page"
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <h3 className="font-medium text-muted-foreground mb-1">Reports Generated</h3>
          {/* TODO[report-count]: Hardcoded to 0 — not queried from DB */}
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold font-display text-foreground">0</span>
            <span className="text-sm font-medium text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">New</span>
          </div>
        </Link>

        <div className="group p-6 rounded-3xl bg-card border border-border shadow-sm hover:shadow-md transition-all relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <h3 className="font-medium text-muted-foreground mb-1">Sync Status</h3>
          <div className="flex items-baseline mt-1">
            <span className="inline-flex items-center text-lg font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
              <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse" />
              Up to date
            </span>
          </div>
        </div>
      </div>

      <ReportsTable limit={5} showViewAll />
    </div>
  );
}
