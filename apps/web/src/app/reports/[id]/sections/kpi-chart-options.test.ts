import test from "node:test";
import assert from "node:assert/strict";
import { buildKpiSparklineOption } from "./kpi-chart-options";

test("buildKpiSparklineOption builds a non-empty ECharts area series", () => {
  const option = buildKpiSparklineOption({
    data: [
      { date: "2026-04-06", value: 10 },
      { date: "2026-04-07", value: 14 },
    ],
    color: "#2563eb",
  });

  assert.deepEqual(option.xAxis.data, ["2026-04-06", "2026-04-07"]);
  assert.deepEqual(option.series[0]?.data, [10, 14]);
  assert.equal(option.series[0]?.type, "line");
  assert.equal(option.series[0]?.areaStyle.color.colorStops.length, 2);
});

test("buildKpiSparklineOption keeps empty data renderable", () => {
  const option = buildKpiSparklineOption({ data: [], color: "#2563eb" });

  assert.deepEqual(option.xAxis.data, []);
  assert.deepEqual(option.series[0]?.data, []);
});
