"use client";

import { useState, useMemo } from "react";
import { useReactTable, getCoreRowModel, getSortedRowModel, getPaginationRowModel, flexRender, type ColumnDef, type SortingState } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import type { PageWinnerLoserRow } from "@webhealth/shared/lib/reports/types";

type DeepDivePagesProps = {
  rows?: PageWinnerLoserRow[] | null;
};

export function DeepDivePages({ rows }: DeepDivePagesProps) {
  const [open, setOpen] = useState(true);
  const data = rows ?? [];

  if (!data.length) return null;

  return (
    <section>
      <button
        className="w-full text-left flex items-center justify-between mb-4"
        onClick={() => setOpen((o) => !o)}
      >
        <h2 className="text-xl font-bold font-display">Page Winners / Losers</h2>
        <span className="text-muted-foreground text-sm">{open ? "▾" : "▸"}</span>
      </button>
      {open && <PagesTable data={data} />}
    </section>
  );
}

function PagesTable({ data }: { data: PageWinnerLoserRow[] }) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "clicksDelta", desc: true }]);

  const columns = useMemo<ColumnDef<PageWinnerLoserRow>[]>(
    () => [
      {
        accessorKey: "page",
        header: "Page",
        size: 300,
        cell: ({ getValue }) => (
          <span className="truncate block max-w-[400px]">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: "clicksDelta",
        header: "Clicks Δ",
        cell: ({ getValue }) => {
          const v = getValue() as number;
          return (
            <span className={v >= 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
              {v >= 0 ? "+" : ""}
              {v.toLocaleString()}
            </span>
          );
        },
      },
      {
        accessorKey: "impressionsDelta",
        header: "Impr. Δ",
        cell: ({ getValue }) => {
          const v = getValue() as number;
          return (
            <span className={v >= 0 ? "text-green-600" : "text-red-600"}>
              {v >= 0 ? "+" : ""}
              {v.toLocaleString()}
            </span>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge
              variant="outline"
              className={
                row.original.status === "winner"
                  ? "text-green-600 border-green-200 bg-green-50"
                  : row.original.status === "loser"
                    ? "text-red-600 border-red-200 bg-red-50"
                    : "text-muted-foreground"
              }
            >
              {row.original.status}
            </Badge>
            {row.original.isStatisticallySignificant && (
              <Badge variant="outline" className="text-xs text-slate-600 border-slate-200">
                z={row.original.zScore}
              </Badge>
            )}
          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 15 } },
  });

  return (
    <div className="border border-border/50 rounded-3xl overflow-hidden bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/30">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className="text-left py-3 px-4 font-medium text-muted-foreground cursor-pointer select-none"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getIsSorted() === "asc" ? " ↑" : header.column.getIsSorted() === "desc" ? " ↓" : ""}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-t border-border/30 hover:bg-muted/20 transition-colors">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="py-3 px-4">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-3 border-t border-border/30 flex items-center justify-between text-sm text-muted-foreground">
        <span>{data.length} pages</span>
        <div className="flex items-center gap-2">
          <button disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()} className="px-2 py-1 rounded border border-border/50 disabled:opacity-30">←</button>
          <span>Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}</span>
          <button disabled={!table.getCanNextPage()} onClick={() => table.nextPage()} className="px-2 py-1 rounded border border-border/50 disabled:opacity-30">→</button>
        </div>
      </div>
    </div>
  );
}
