import { DebugConsole } from "./debug-console";

export default function AiReportDebugPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Operations Debug Console</h1>
        <p className="text-muted-foreground text-sm">
          Inspect source-data refreshes, property refreshes, and imported OpenAI billing in one place.
        </p>
      </div>
      <DebugConsole />
    </div>
  );
}
