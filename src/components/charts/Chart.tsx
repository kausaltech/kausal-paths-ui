// Import the echarts core module, which provides the necessary interfaces for using echarts.
import * as echarts from 'echarts/core';

// Import bar charts, all suffixed with Chart
import { BarChart } from 'echarts/charts';

// Import the tooltip, title, rectangular coordinate system, dataset and transform components
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent,
} from 'echarts/components';

// Features like Universal Transition and Label Layout
import { LabelLayout, UniversalTransition } from 'echarts/features';

// Import the Canvas renderer
// Note that including the CanvasRenderer or SVGRenderer is a required step
import { CanvasRenderer } from 'echarts/renderers';

import throttle from 'lodash/throttle';
import { useEffect, useRef } from 'react';
import styled, { useTheme } from 'styled-components';
import { getChartTheme } from './chart-theme';

// Register the required components
echarts.use([
  BarChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent,
  LabelLayout,
  UniversalTransition,
  CanvasRenderer,
]);

const StyledChartWrapper = styled.div<{ $height?: string }>`
  height: ${({ $height }) => $height || '400px'};
`;

type Props = {
  isLoading: boolean;
  data?: echarts.EChartsCoreOption;
  height?: string;
};

export function Chart({ isLoading, data, height }: Props) {
  const theme = useTheme();
  const chartRef = useRef<echarts.ECharts | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const chart = echarts.init(wrapperRef.current, getChartTheme(theme).theme);
    chartRef.current = chart;

    const throttledResize = throttle(() => chart.resize(), 1000, {
      leading: false,
      trailing: true,
    });

    window.addEventListener('resize', throttledResize);

    return () => {
      throttledResize.flush();
      window.removeEventListener('resize', throttledResize);
      chart.clear();
      chart.dispose();
    };
  }, [theme]);

  useEffect(() => {
    if (chartRef.current) {
      if (isLoading) {
        chartRef.current.showLoading();
      } else {
        chartRef.current.hideLoading();
      }
    }
  }, [isLoading]);

  useEffect(() => {
    if (chartRef.current && data) {
      chartRef.current.setOption(data);
    }
  }, [data]);

  return <StyledChartWrapper ref={wrapperRef} $height={height} />;
}
