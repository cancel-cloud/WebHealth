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
    let animationFrameId: number | null = null;

    async function setupChart() {
      if (!containerRef.current) return;

      const echarts = await import("echarts");
      if (disposed || !containerRef.current) return;

      const applyOption = (chart: ECharts) => {
        chart.setOption(
          {
            animation: true,
            backgroundColor: "transparent",
            ...option,
          },
          true,
        );
      };

      const initializeChart = () => {
        if (disposed || !containerRef.current || chartRef.current) return;

        const { clientWidth, clientHeight } = containerRef.current;
        if (clientWidth === 0 || clientHeight === 0) return;

        const chart = echarts.getInstanceByDom(containerRef.current) ?? echarts.init(containerRef.current, undefined, {
          renderer: "canvas",
        });

        chartRef.current = chart;
        applyOption(chart);
      };

      resizeObserver = new ResizeObserver(() => {
        if (animationFrameId != null) {
          cancelAnimationFrame(animationFrameId);
        }

        animationFrameId = requestAnimationFrame(() => {
          animationFrameId = null;
          initializeChart();
          chartRef.current?.resize();
        });
      });
      resizeObserver.observe(containerRef.current);
      initializeChart();
    }

    void setupChart();

    return () => {
      disposed = true;
      if (animationFrameId != null) {
        cancelAnimationFrame(animationFrameId);
      }
      resizeObserver?.disconnect();
      chartRef.current?.dispose();
      chartRef.current = null;
    };
  }, [option]);

  return <div ref={containerRef} className={className} role="img" aria-label={ariaLabel} />;
}
