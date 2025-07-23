// Import the echarts core module, which provides the necessary interfaces for using echarts.
import { useEffect, useRef } from 'react';

import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
// Import used charts
import { BarChart, CustomChart, LineChart, PieChart } from 'echarts/charts';
// Import the tooltip, title, rectangular coordinate system, dataset and transform components
import {
  DatasetComponent,
  GraphicComponent,
  GridComponent,
  LegendComponent,
  MarkAreaComponent,
  MarkLineComponent,
  TitleComponent,
  TooltipComponent,
  TransformComponent,
} from 'echarts/components';
import * as echarts from 'echarts/core';
// Features like Universal Transition and Label Layout
import { LabelLayout, UniversalTransition } from 'echarts/features';
// Import the Canvas renderer
// Note that including the CanvasRenderer or SVGRenderer is a required step
import { CanvasRenderer } from 'echarts/renderers';
import throttle from 'lodash/throttle';

import { getChartTheme } from './chart-theme';

// Register the required components
echarts.use([
  BarChart,
  CustomChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent,
  LegendComponent,
  LabelLayout,
  UniversalTransition,
  CanvasRenderer,
  GraphicComponent,
  LineChart,
  MarkLineComponent,
  MarkAreaComponent,
  PieChart,
]);

const StyledChartWrapper = styled.div<{ $height?: string }>`
  height: ${({ $height }) => $height || '400px'};
`;

// Hack to add margin on the chart to fit the legend
// Based on https://github.com/apache/echarts/issues/15654
// Assumes that the legend is at the bottom of the chart
const resizeLegend = (chart: echarts.ECharts) => {
  if (chart) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
    const found = (chart as any)._componentsViews.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      (entry: any) => entry.type === 'legend.plain'
    );
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const myLegendHeight: number = found?._backgroundEl?.shape?.height || 0;
    chart.setOption({
      grid: { bottom: myLegendHeight + 48 },
    });
  }
};

type Props = {
  isLoading: boolean;
  data?: echarts.EChartsCoreOption;
  height?: string;
  onZrClick?: (clickedDataIndex: [number, number]) => void;
  className?: string;
};

export function Chart({ isLoading, data, height, onZrClick, className }: Props) {
  const theme = useTheme();
  const chartRef = useRef<echarts.ECharts | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Initialize the chart
  useEffect(() => {
    const chart = echarts.init(wrapperRef.current, getChartTheme(theme).theme);

    chartRef.current = chart;

    const throttledResize = throttle(
      () => {
        chart.resize();
        resizeLegend(chart);
      },
      1000,
      {
        leading: false,
        trailing: true,
      }
    );

    window.addEventListener('resize', throttledResize);

    return () => {
      throttledResize.flush();
      window.removeEventListener('resize', throttledResize);
      chart.clear();
      chart.dispose();
    };
  }, [theme]);

  // Show/hide the loading indicator
  useEffect(() => {
    if (chartRef.current) {
      if (isLoading) {
        chartRef.current.showLoading();
      } else {
        chartRef.current.hideLoading();
      }
    }
  }, [isLoading]);

  // Update the chart when the data changes
  useEffect(() => {
    if (chartRef.current && data) {
      chartRef.current.setOption(data);
      resizeLegend(chartRef.current);
    }
  }, [data]);

  // Add click handler to the chart
  useEffect(() => {
    const chart = chartRef.current;
    const chartZr = chart?.getZr();
    const withClickHandler = typeof onZrClick === 'function';

    function handleClick(params: { offsetX: number; offsetY: number }) {
      if (chart && withClickHandler) {
        const pointInPixel = [params.offsetX, params.offsetY];
        const pointInGrid = chart.convertFromPixel('grid', pointInPixel);

        // Ensure we have a valid coordinate pair
        if (Array.isArray(pointInGrid) && pointInGrid.length >= 2) {
          const dataIndex: [number, number] = [pointInGrid[0], pointInGrid[1]];
          onZrClick(dataIndex);
        }
      }
    }

    if (chartZr && typeof onZrClick === 'function') {
      chartZr.on('click', handleClick);

      return () => {
        chartZr.off('click', handleClick);
      };
    }
  }, [onZrClick]);

  return <StyledChartWrapper ref={wrapperRef} className={className} $height={height} />;
}
