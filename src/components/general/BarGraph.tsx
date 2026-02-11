import { useState } from 'react';

import dynamic from 'next/dynamic';

import type { Theme } from '@emotion/react';
import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { CircularProgress } from '@mui/material';
import { useTranslation } from 'next-i18next';
import type { PlotParams } from 'react-plotly.js';

import type { OutcomeNodeFieldsFragment } from '@/common/__generated__/graphql';

const Plot = dynamic(() => import('@/components/graphs/Plot'), { ssr: false });

const BarGraphContainer = styled.div`
  margin: 0 auto;
  min-width: 300px;
  max-width: 600px;
`;

const PlotLoader = styled.div`
  height: 350px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${(props) => props.theme.graphColors.grey020};
`;

type BarNode = OutcomeNodeFieldsFragment & {
  name: string;
  value: number;
  parent: string;
};

const makeTrace = (
  parentNode: OutcomeNodeFieldsFragment,
  childNodes: OutcomeNodeFieldsFragment[],
  year: number,
  theme: Theme,
  t: ReturnType<typeof useTranslation>['t']
) => {
  const cats: BarNode[] = childNodes.map((cat) => {
    const displayValue =
      cat.metric?.historicalValues.find((v) => v.year === year)?.value ||
      cat.metric?.forecastValues.find((v) => v.year === year)?.value ||
      0;
    return {
      ...cat,
      name: cat.shortName || cat.name,
      value: displayValue,
      parent: displayValue > 0 ? parentNode.id : '',
    };
  });

  let posCount = 0;
  let negCount = 0;
  let posTotal = 0;
  cats.forEach((cat) => {
    if (cat.value > 0) {
      posCount++;
      posTotal += cat.value;
    }
    if (cat.value < 0) {
      negCount++;
    }
  });

  const hasOnlyOneNegativeSector = negCount === 1;
  const hasPositiveSectors = posCount > 0;

  // If there is only one negative sector we can use it as a group label
  // If all sectors are negative we can use the parent node as a group label
  // Otherwise we have to use generic label for negative group
  const negGroupName = hasOnlyOneNegativeSector
    ? cats.find((cat) => cat.value < 0)!.name
    : hasPositiveSectors
      ? t('negative')
      : parentNode.shortName || parentNode.name;

  const posTraces: PlotParams['data'] = [];
  const negTraces: PlotParams['data'] = [];

  cats.forEach((cat) => {
    if (cat.value < 0) {
      negTraces.push({
        x: [negGroupName],
        y: [cat.value],
        base: [-cat.value] as unknown[],
        name: cat.shortName || cat.name,
        type: 'bar',
        width: 0.5,
        marker: {
          color: cat.color || theme.graphColors.grey050,
        },
      } as PlotParams['data'][number]);
    }
    if (cat.value > 0) {
      posTraces.push({
        x: [parentNode.shortName || parentNode.name],
        y: [cat.value],
        name: cat.shortName || cat.name,
        type: 'bar',
        meta: [cat.value / posTotal >= 0.01 ? Math.round((cat.value / posTotal) * 100) : '<1'],
        textposition: 'outside',
        texttemplate: '%{meta[0]}%',
        textangle: 0,
        width: 0.5,
        marker: {
          color: cat.color || theme.graphColors.grey050,
        },
      } as PlotParams['data'][number]);
    }
  });

  return posTraces.concat(negTraces);
};

const getLargestTotal = (traces: PlotParams['data']) => {
  let posTotal = 0;
  let negTotal = 0;
  traces.forEach((trace) => {
    const y = (trace as { y?: number[] }).y;
    if (y && y[0] > 0) {
      posTotal += y[0];
    }
    if (y && y[0] < 0) {
      negTotal += y[0];
    }
  });
  const maxTotal = Math.abs(negTotal) > posTotal ? Math.abs(negTotal) : posTotal;
  return maxTotal;
};

type BarGraphProps = {
  node: OutcomeNodeFieldsFragment;
  subNodes: OutcomeNodeFieldsFragment[];
  endYear: number;
};

const BarGraph = (props: BarGraphProps) => {
  const { node: parentNode, subNodes, endYear } = props;
  const { t } = useTranslation();
  const theme = useTheme();

  const [loading, setLoading] = useState(true);

  const metric = parentNode.metric!;

  const displayNodes = subNodes?.length > 1 ? subNodes : parentNode && [parentNode];
  const shortUnit = metric.unit?.short;

  let longUnit = parentNode.metric?.unit?.htmlShort;
  // FIXME: Another nasty hack to show 'CO2e' where it might be applicable until
  // the backend gets proper support for unit specifiers.
  if (shortUnit === 't/Einw./a') {
    longUnit = t('tco2-e-inhabitant');
  } else if (shortUnit === 'kt/a') {
    longUnit = t('ktco2-e');
  }

  const barTraces = makeTrace(parentNode, displayNodes, endYear, theme, t);

  // Add some buffer to y-axis range to accommodate % labels
  const maxHeight = getLargestTotal(barTraces);
  const range = [0, maxHeight * 1.2];

  const layout: PlotParams['layout'] = {
    height: 350,
    hovermode: false,
    barmode: 'stack',
    title: {
      text: endYear + '',
      font: {
        family: theme.fontFamily,
        size: 20,
      },
      xref: 'paper',
      x: 0,
    },
    annotations: [
      // Places y-axis title on top of the y-axis
      {
        xref: 'paper',
        yref: 'paper',
        yshift: 10,
        x: 0,
        xanchor: 'left',
        y: 1,
        yanchor: 'bottom',
        text: longUnit || undefined,
        font: {
          family: theme.fontFamily,
          size: 14,
        },
        showarrow: false,
      },
    ],
    yaxis: {
      range: range,
      tickfont: {
        family: theme.fontFamily,
      },
    },
    xaxis: {
      type: 'category',
      tickfont: {
        family: theme.fontFamily,
        size: 9,
      },
    },
    showlegend: true,
    legend: {
      orientation: 'h',
      yanchor: 'top',
      y: -0.2,
      xanchor: 'left',
      x: 0,
    },
  };

  return (
    <BarGraphContainer>
      {loading && (
        <PlotLoader>
          <CircularProgress size={24} />
        </PlotLoader>
      )}
      <Plot
        data={barTraces}
        layout={layout}
        useResizeHandler
        config={{ displayModeBar: false, responsive: true, staticPlot: true }}
        onInitialized={() => setLoading(false)}
        style={{ minWidth: '300px', maxWidth: '600px' }}
      />
    </BarGraphContainer>
  );
};

export default BarGraph;
