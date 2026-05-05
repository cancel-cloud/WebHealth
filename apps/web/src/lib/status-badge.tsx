import { Badge } from "@/components/ui/badge";

/**
 * Property sync status badge — used on the properties page.
 * Statuses: complete | syncing | pending | failed
 */
export function getSyncStatusBadge(status: string) {
  switch (status) {
    case "complete":
      return <Badge className="border border-green-200 bg-green-500/10 text-green-600 hover:bg-green-500/20 dark:border-green-500/25 dark:bg-green-500/15 dark:text-green-100">Complete</Badge>;
    case "syncing":
      return <Badge className="border border-blue-200 bg-blue-500/10 text-blue-600 animate-pulse dark:border-blue-500/25 dark:bg-blue-500/15 dark:text-blue-100">Syncing</Badge>;
    case "pending":
      return <Badge variant="outline" className="text-zinc-500 dark:border-white/10 dark:text-zinc-300">Pending</Badge>;
    case "failed":
      return <Badge variant="destructive">Failed</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}
