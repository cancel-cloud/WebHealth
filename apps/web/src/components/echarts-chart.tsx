"use client";

import { useEffect, useRef } from "react";
import type { ECharts, EChartsOption } from "echarts";

type EchartsChartProps = {
  option: EChartsOption;
  className?: string;
  ariaLabel?: string;
};

export type { EChartsOption };

export function EchartsChart({ option, className, ariaLabel }: EchartsChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ECharts | null>(null);

  useEffect(() => {
    let disposed = false;
    let resizeObserver: ResizeObserver | null = null;

    async function setupChart() {
      if (!containerRef.current) return;

      const echarts = await import("echarts");
      if (disposed || !containerRef.current) return;

      const chart = echarts.getInstanceByDom(containerRef.current) ?? echarts.init(containerRef.current, undefined, {
        renderer: "canvas",
      });

      chartRef.current = chart;
      chart.setOption(
        {
          animation: true,
          backgroundColor: "transparent",
          ...option,
        },
        true,
      );

      resizeObserver = new ResizeObserver(() => {
        chart.resize();
      });
      resizeObserver.observe(containerRef.current);
    }

    void setupChart();

    return () => {
      disposed = true;
      resizeObserver?.disconnect();
      chartRef.current?.dispose();
      chartRef.current = null;
    };
  }, [option]);

  return <div ref={containerRef} className={className} role="img" aria-label={ariaLabel} />;
}
