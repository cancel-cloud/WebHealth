import { DebugConsole } from "./debug-console";
import { ADMIN_PAGE_COPY, getAdminLanguage } from "../admin-page-copy";

export default async function AiReportDebugPage() {
  const copy = ADMIN_PAGE_COPY[await getAdminLanguage()].aiDebug;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{copy.title}</h1>
        <p className="text-muted-foreground text-sm">
          {copy.description}
        </p>
      </div>
      <DebugConsole />
    </div>
  );
}
