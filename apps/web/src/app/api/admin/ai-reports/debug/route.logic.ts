export type RawDetailRequestRow = {
  id: string;
  reportId: string;
  teamId: string;
  teamName: string | null;
  requestedByUserId: string | null;
  requestedByUserEmail: string | null;
  requestNumber: number;
  kind: string;
  rowId: string;
  status: string;
  usage: unknown;
  estimatedCostUsd: string | null;
  xRequestId: string | null;
  xClientRequestId: string | null;
  error: string | null;
  createdAt: Date | string;
};

export function mapDetailRequestRows(rows: RawDetailRequestRow[]) {
  return rows.map((row) => ({
    ...row,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
  }));
}
