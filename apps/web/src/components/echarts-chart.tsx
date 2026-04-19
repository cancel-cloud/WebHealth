"use client";

import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import type { EChartsOption } from "echarts";

type EchartsChartProps = {
  option: EChartsOption;
  className?: string;
  ariaLabel?: string;
};

export function EchartsChart({ option, className, ariaLabel }: EchartsChartProps) {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!elementRef.current) return;

    const chart = echarts.init(elementRef.current, undefined, { renderer: "canvas" });
    chartRef.current = chart;

    const resizeObserver = new ResizeObserver(() => chart.resize());
    resizeObserver.observe(elementRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    chartRef.current?.setOption(option, true);
  }, [option]);

  return (
    <div
      ref={elementRef}
      className={className}
      role="img"
      aria-label={ariaLabel}
    />
  );
}
