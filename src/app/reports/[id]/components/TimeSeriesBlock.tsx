import type { TimeSeriesBlock } from "@/lib/reports/dashboard-blocks";

function SparkLine({
  points,
  color,
  width = 300,
  height = 60,
}: {
  points: number[];
  color: string;
  width?: number;
  height?: number;
}) {
  if (!points.length) return <div className="text-xs text-muted-foreground">No data</div>;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const denom = max - min || 1;
  const path = points
    .map((value, idx) => {
      const x = (idx / Math.max(points.length - 1, 1)) * (width - 8) + 4;
      const y = height - ((value - min) / denom) * (height - 8) - 4;
      return `${idx === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block w-full">
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function TimeSeriesBlock({ block }: { block: TimeSeriesBlock }) {
  const currentPoints = block.currentSeries.map((p) => p.value);
  const comparePoints = block.compareSeries.map((p) => p.value);

  const allPoints = [...currentPoints, ...comparePoints];
  const min = allPoints.length ? Math.min(...allPoints) : 0;
  const max = allPoints.length ? Math.max(...allPoints) : 1;
  const denom = max - min || 1;

  const toY = (v: number, h: number) =>
    h - ((v - min) / denom) * (h - 8) - 4;

  const width = 600;
  const height = 100;

  const currentPath = block.currentSeries
    .map((p, i) => {
      const x = (i / Math.max(block.currentSeries.length - 1, 1)) * (width - 8) + 4;
      const y = toY(p.value, height);
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  const comparePath = block.compareSeries
    .map((p, i) => {
      const x = (i / Math.max(block.compareSeries.length - 1, 1)) * (width - 8) + 4;
      const y = toY(p.value, height);
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  const firstDate = block.currentSeries[0]?.date ?? "";
  const lastDate = block.currentSeries[block.currentSeries.length - 1]?.date ?? "";

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">{block.label}</p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="inline-block w-6 h-0.5 bg-blue-500 rounded" />
            Current
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-6 h-0.5 bg-gray-400 rounded opacity-60" />
            Compare
          </span>
        </div>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ height: 100 }}
      >
        {comparePath && (
          <path
            d={comparePath}
            fill="none"
            stroke="#9ca3af"
            strokeWidth="1.5"
            strokeDasharray="4 2"
            strokeLinecap="round"
            opacity={0.7}
          />
        )}
        {currentPath && (
          <path
            d={currentPath}
            fill="none"
            stroke="#2563eb"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        )}
      </svg>
      {(firstDate || lastDate) && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{firstDate}</span>
          <span>{lastDate}</span>
        </div>
      )}
      {block.currentSeries.length > 0 && (
        <div className="flex gap-6 text-xs pt-1 border-t">
          <div>
            <p className="text-muted-foreground">Current total</p>
            <p className="font-semibold">
              {currentPoints.reduce((a, b) => a + b, 0).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Compare total</p>
            <p className="font-semibold">
              {comparePoints.reduce((a, b) => a + b, 0).toLocaleString()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Suppress unused import warning — SparkLine kept for potential reuse
void SparkLine;
