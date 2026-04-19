export type KpiSparklinePoint = {
  date: string;
  value: number;
};

export function buildKpiSparklineOption(input: {
  data: KpiSparklinePoint[];
  color: string;
}) {
  return {
    animation: false,
    grid: {
      left: 0,
      right: 0,
      top: 4,
      bottom: 0,
      containLabel: false,
    },
    xAxis: {
      type: "category" as const,
      show: false,
      boundaryGap: false,
      data: input.data.map((point) => point.date),
    },
    yAxis: {
      type: "value" as const,
      show: false,
      scale: true,
    },
    tooltip: {
      show: false,
    },
    series: [
      {
        type: "line" as const,
        data: input.data.map((point) => point.value),
        showSymbol: false,
        smooth: true,
        lineStyle: {
          width: 2,
          color: input.color,
        },
        areaStyle: {
          color: {
            type: "linear" as const,
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: `${input.color}26` },
              { offset: 1, color: `${input.color}00` },
            ],
          },
        },
      },
    ],
  };
}
