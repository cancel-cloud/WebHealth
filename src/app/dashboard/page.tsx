import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { properties as propertiesSchema } from "@/db/schema";
import { SyncButton } from "./sync-button";
import { ReportsTable } from "./reports-table";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/");
  }

  // Fetch user's teams
  const userTeams = await db.query.teamMembers.findMany({
    where: (tm, {eq}) => eq(tm.userId, session.user.id)
  });

  let propertyCount = 0;
  if(userTeams.length > 0) {
      const targetTeamId = userTeams[0].teamId;
      const userProperties = await db.query.properties.findMany({
          where: eq(propertiesSchema.teamId, targetTeamId)
      });
      propertyCount = userProperties.length;
  }

  return (
    <div className="flex-1 bg-background relative selection:bg-primary/30 min-h-screen">
      <div className="absolute top-0 inset-x-0 h-[400px] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
      
      <div className="container mx-auto py-10 px-4 relative z-10">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight font-outfit mb-2">Overview</h1>
            <p className="text-muted-foreground">Manage your properties and generate SEO reports.</p>
          </div>
          <SyncButton />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="group p-6 rounded-3xl bg-card border border-border shadow-sm hover:shadow-md transition-all relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <h3 className="font-medium text-muted-foreground mb-1">Properties</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold font-outfit text-foreground">{propertyCount}</span>
            </div>
          </div>
          
          <div className="group p-6 rounded-3xl bg-card border border-border shadow-sm hover:shadow-md transition-all relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <h3 className="font-medium text-muted-foreground mb-1">Reports Generated</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold font-outfit text-foreground">0</span>
              <span className="text-sm font-medium text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">New</span>
            </div>
          </div>
          
          <div className="group p-6 rounded-3xl bg-card border border-border shadow-sm hover:shadow-md transition-all relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <h3 className="font-medium text-muted-foreground mb-1">Sync Status</h3>
            <div className="flex items-baseline mt-1">
              <span className="inline-flex items-center text-lg font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
                Up to date
              </span>
            </div>
          </div>
        </div>
        
        <div className="mt-12">
          <ReportsTable />
        </div>
      </div>
    </div>
  );
}
