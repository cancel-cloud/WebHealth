"use client";

import { useState, useMemo } from "react";
import { useReactTable, getCoreRowModel, getSortedRowModel, getPaginationRowModel, getFilteredRowModel, flexRender, type ColumnDef, type SortingState } from "@tanstack/react-table";
import type { QueryOpportunityRow } from "@webhealth/shared/lib/reports/types";

type DeepDiveQueriesProps = {
  rows?: QueryOpportunityRow[] | null;
};

export function DeepDiveQueries({ rows }: DeepDiveQueriesProps) {
  const [open, setOpen] = useState(true);
  const data = rows ?? [];

  if (!data.length) return null;

  return (
    <section>
      <button
        className="w-full text-left flex items-center justify-between mb-4"
        onClick={() => setOpen((o) => !o)}
      >
        <h2 className="text-xl font-bold font-display">Query Opportunities</h2>
        <span className="text-muted-foreground text-sm">{open ? "▾" : "▸"}</span>
      </button>
      {open && <QueryTable data={data} />}
    </section>
  );
}

function QueryTable({ data }: { data: QueryOpportunityRow[] }) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "opportunityScore", desc: true }]);
  const [globalFilter, setGlobalFilter] = useState("");

  const columns = useMemo<ColumnDef<QueryOpportunityRow>[]>(
    () => [
      { accessorKey: "query", header: "Query", size: 200 },
      {
        accessorKey: "impressions",
        header: "Impressions",
        cell: ({ getValue }) => (getValue() as number).toLocaleString(),
      },
      {
        accessorKey: "ctr",
        header: "CTR",
        cell: ({ getValue }) => `${((getValue() as number) * 100).toFixed(2)}%`,
      },
      {
        accessorKey: "position",
        header: "Pos",
        cell: ({ getValue }) => (getValue() as number).toFixed(1),
      },
      {
        accessorKey: "lostClicksEstimate",
        header: "Lost Clicks",
        cell: ({ getValue }) => (getValue() as number).toFixed(1),
      },
      {
        accessorKey: "opportunityScore",
        header: "Score",
        cell: ({ getValue }) => (
          <span className="font-semibold text-primary">{(getValue() as number).toFixed(1)}</span>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: { pagination: { pageSize: 15 } },
  });

  return (
    <div className="overflow-hidden rounded-lg border border-report-separator bg-report-panel shadow-sm">
      <div className="border-b border-report-separator p-4">
        <input
          type="search"
          placeholder="Filter queries…"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="w-full max-w-sm rounded-lg border border-report-separator bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-report-subtle">
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
              <tr key={row.id} className="border-t border-report-separator transition-colors hover:bg-report-subtle">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="py-3 px-4 max-w-[250px] truncate">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-report-separator p-3 text-sm text-muted-foreground">
        <span>
          {table.getFilteredRowModel().rows.length} queries
        </span>
        <div className="flex items-center gap-2">
          <button
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
            className="rounded border border-report-separator px-2 py-1 disabled:opacity-30"
          >
            ←
          </button>
          <span>
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <button
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
            className="rounded border border-report-separator px-2 py-1 disabled:opacity-30"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}
