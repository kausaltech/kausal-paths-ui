// Import the echarts core module, which provides the necessary interfaces for using echarts.
import { useEffect, useRef } from 'react';

import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
// Import used charts
import { BarChart, CustomChart, LineChart } from 'echarts/charts';
// Import the tooltip, title, rectangular coordinate system, dataset and transform components
import {
  DatasetComponent,
  GraphicComponent,
  GridComponent,
  LegendComponent,
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
]);

const StyledChartWrapper = styled.div<{ $height?: string }>`
  height: ${({ $height }) => $height || '400px'};
`;

type Props = {
  isLoading: boolean;
  data?: echarts.EChartsCoreOption;
  height?: string;
  onZrClick?: (clickedDataIndex: number) => void;
  className?: string;
};

export function Chart({ isLoading, data, height, onZrClick, className }: Props) {
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

  useEffect(() => {
    const chart = chartRef.current;
    const chartZr = chart?.getZr();
    const withClickHandler = typeof onZrClick === 'function';

    function handleClick(params) {
      if (chart && withClickHandler) {
        const pointInPixel = [params.offsetX, params.offsetY];
        const pointInGrid = chart.convertFromPixel('grid', pointInPixel);
        const dataIndex = pointInGrid[1];

        onZrClick(dataIndex);
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
