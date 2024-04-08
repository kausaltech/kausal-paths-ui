// Import the echarts core module, which provides the necessary interfaces for using echarts.
import * as echarts from 'echarts/core';
import { EChartsCoreOption } from 'echarts';

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

const labelRight = {
  position: 'right',
} as const;

const option: EChartsCoreOption = {
  tooltip: {
    trigger: 'axis',
    valueFormatter: (value) => `${value} %`,
  },
  grid: {
    containLabel: true,
    top: 80,
    bottom: 30,
  },
  xAxis: {
    type: 'value',
    max: (value) => Math.max(100, value.max),
    position: 'top',
    splitLine: {
      lineStyle: {
        type: 'dashed',
      },
    },
  },
  yAxis: {
    type: 'category',
    axisLine: { show: false },
    axisLabel: { show: true },
    axisTick: { show: false },
    splitLine: { show: false },
    data: [
      'Set policies to support EV charging',
      'Build safe parking space for bicycles',
      'The city builds EV charging infrastructure',
      'City supports bus transportation',
      'Companies to sponsor micro mobility stations',
      'Offer shared micro mobility system',
      'Build biodiesel stations',
    ],
  },
  series: [
    {
      name: 'Return on investment',
      type: 'bar',
      stack: 'Total',
      label: {
        show: true,
        formatter: '{c} %',
      },
      transform: {
        type: 'sort',
        config: { dimension: 'score', order: 'desc' },
      },
      data: [
        { value: 86, label: labelRight },
        { value: 62, label: labelRight },
        { value: 44, label: labelRight },
        { value: 6, label: labelRight },
        { value: -6, label: labelRight },
        { value: -21, label: labelRight },
        { value: -39, label: labelRight },
      ],
    },
  ],
};

const StyledChartWrapper = styled.div`
  height: 400px;
`;

export function Chart() {
  const theme = useTheme();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const chart = echarts.init(wrapperRef.current, getChartTheme(theme).theme);

    chart.setOption(option);

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

  return <StyledChartWrapper ref={wrapperRef}></StyledChartWrapper>;
}
