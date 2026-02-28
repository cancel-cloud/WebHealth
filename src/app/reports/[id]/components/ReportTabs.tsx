"use client";
import type { DashboardBlock } from "@/lib/reports/dashboard-blocks";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { KpiCardsBlock } from "./KpiCardsBlock";
import { TimeSeriesBlock } from "./TimeSeriesBlock";
import { TableBlock } from "./TableBlock";
import { ActionBacklogBlock } from "./ActionBacklogBlock";
import { TechnicalIssuesBlock } from "./TechnicalIssuesBlock";
import { ContentGapsBlock } from "./ContentGapsBlock";

type Tab = {
  id: string;
  label: string;
  blockTypes: DashboardBlock["type"][];
  blockIds?: string[];
};

const TABS: Tab[] = [
  { id: "overview", label: "Overview", blockTypes: ["kpi_cards", "time_series"] },
  { id: "queries", label: "Queries", blockTypes: ["table"], blockIds: ["query_opportunities", "near_win_keywords", "position_buckets"] },
  { id: "pages", label: "Pages", blockTypes: ["table"], blockIds: ["page_winners_losers", "segment_summary"] },
  { id: "gaps", label: "Content Gaps", blockTypes: ["content_gaps", "table"], blockIds: ["cannibalization"] },
  { id: "technical", label: "Technical", blockTypes: ["technical_issues"] },
  { id: "actions", label: "Action Plan", blockTypes: ["action_backlog"] },
];

function blockMatchesTab(block: DashboardBlock, tab: Tab): boolean {
  if (!tab.blockTypes.includes(block.type)) return false;
  if (block.type === "table" && tab.blockIds) {
    return tab.blockIds.includes((block as Extract<DashboardBlock, { type: "table" }>).id);
  }
  // For non-table blocks in tabs with blockIds, only match if the tab has no blockIds restriction for this type
  if (tab.blockIds && block.type !== "table") {
    // blockIds only constrains table blocks; non-table blocks match by type alone
    return true;
  }
  return true;
}

function renderBlock(block: DashboardBlock, idx: number, reportId?: string) {
  switch (block.type) {
    case "kpi_cards":
      return <KpiCardsBlock key={idx} block={block} />;
    case "time_series":
      return <TimeSeriesBlock key={idx} block={block} />;
    case "table":
      return (
        <div key={idx} className="space-y-2">
          <p className="text-sm font-semibold text-muted-foreground capitalize">
            {block.id.replace(/_/g, " ")}
          </p>
          <TableBlock block={block} reportId={reportId} />
        </div>
      );
    case "action_backlog":
      return <ActionBacklogBlock key={idx} block={block} />;
    case "technical_issues":
      return <TechnicalIssuesBlock key={idx} block={block} />;
    case "content_gaps":
      return <ContentGapsBlock key={idx} block={block} />;
    default:
      return null;
  }
}

export function ReportTabs({ blocks, reportId }: { blocks: DashboardBlock[]; reportId?: string }) {
  // Only show tabs that have at least one block
  const visibleTabs = TABS.filter((tab) =>
    blocks.some((block) => blockMatchesTab(block, tab))
  );

  if (!visibleTabs.length) return null;

  return (
    <Tabs defaultValue={visibleTabs[0]?.id ?? "overview"}>
      <TabsList className="flex-wrap h-auto">
        {visibleTabs.map((tab) => (
          <TabsTrigger key={tab.id} value={tab.id}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {visibleTabs.map((tab) => {
        const tabBlocks = blocks.filter((block) => blockMatchesTab(block, tab));
        return (
          <TabsContent key={tab.id} value={tab.id} className="space-y-6 mt-4">
            {tabBlocks.map((block, idx) => renderBlock(block, idx, reportId))}
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
