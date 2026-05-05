export type DateString = string;

export type MetricsRefreshWindow = {
  dateStart: DateString;
  dateEnd: DateString;
};

export const MAX_METRICS_REFRESH_WINDOW_DAYS = 90;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 60 * 60 * 1000;

function parseDateString(value: unknown): Date | null {
  if (typeof value !== "string" || !DATE_PATTERN.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10) === value ? date : null;
}

export function metricsWindowDaysInclusive(start: DateString, end: DateString): number {
  const startDate = parseDateString(start);
  const endDate = parseDateString(end);
  if (!startDate || !endDate) return Number.NaN;
  return Math.floor((endDate.getTime() - startDate.getTime()) / DAY_MS) + 1;
}

export function validateMetricsRefreshWindow(window: MetricsRefreshWindow): { ok: true; days: number } | { ok: false; message: string } {
  const startDate = parseDateString(window.dateStart);
  const endDate = parseDateString(window.dateEnd);
  if (!startDate || !endDate) {
    return { ok: false, message: "A valid refresh window is required." };
  }
  if (startDate.getTime() > endDate.getTime()) {
    return { ok: false, message: "Refresh start date must be on or before end date." };
  }
  const days = metricsWindowDaysInclusive(window.dateStart, window.dateEnd);
  if (days > MAX_METRICS_REFRESH_WINDOW_DAYS) {
    return { ok: false, message: `Refresh windows cannot exceed ${MAX_METRICS_REFRESH_WINDOW_DAYS} days.` };
  }
  return { ok: true, days };
}

export function assertMetricsRefreshWindow(window: MetricsRefreshWindow): MetricsRefreshWindow {
  const validation = validateMetricsRefreshWindow(window);
  if (!validation.ok) throw new Error(validation.message);
  return window;
}

function addDays(value: DateString, days: number): DateString {
  const date = parseDateString(value);
  if (!date) throw new Error("Invalid date.");
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function planMetricsRefreshWindows(input: {
  startDate: DateString;
  endDate: DateString;
  compareStartDate?: DateString | null;
  compareEndDate?: DateString | null;
}): MetricsRefreshWindow[] {
  const windows = [
    assertMetricsRefreshWindow({ dateStart: input.startDate, dateEnd: input.endDate }),
  ];

  if (input.compareStartDate || input.compareEndDate) {
    if (!input.compareStartDate || !input.compareEndDate) {
      throw new Error("A valid comparison refresh window is required.");
    }
    windows.push(assertMetricsRefreshWindow({ dateStart: input.compareStartDate, dateEnd: input.compareEndDate }));
  }

  const sorted = [...windows].sort((left, right) => left.dateStart.localeCompare(right.dateStart));
  const planned: MetricsRefreshWindow[] = [];
  for (const window of sorted) {
    const previous = planned[planned.length - 1];
    if (!previous) {
      planned.push({ ...window });
      continue;
    }
    const previousAdjacentEnd = addDays(previous.dateEnd, 1);
    if (window.dateStart <= previousAdjacentEnd) {
      previous.dateEnd = previous.dateEnd > window.dateEnd ? previous.dateEnd : window.dateEnd;
    } else {
      planned.push({ ...window });
    }
  }

  return planned;
}

export function summarizeMetricsRefreshWindows(windows: MetricsRefreshWindow[]) {
  const sorted = [...windows].sort((left, right) => left.dateStart.localeCompare(right.dateStart));
  return {
    dateStart: sorted[0]?.dateStart ?? "",
    dateEnd: sorted.reduce((max, window) => (window.dateEnd > max ? window.dateEnd : max), sorted[0]?.dateEnd ?? ""),
  };
}
