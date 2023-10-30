import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useTranslation } from 'next-i18next';
import styled, { useTheme } from 'styled-components';
import { getRange } from 'common/preprocess';

import { Spinner } from 'reactstrap';
import { OutcomeNodeFieldsFragment } from 'common/__generated__/graphql';
import type { PlotParams } from 'react-plotly.js';

const Plot = dynamic(() => import('components/graphs/Plot'), { ssr: false });

const PlotLoader = styled.div`
  height: 350px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${(props) => props.theme.graphColors.grey020};
`;

const makeTrace = (parentNode, childNodes, year, theme, t) => {
  const cats = childNodes.map((cat) => {
    const displayValue =
      cat.metric.historicalValues.find((v) => v.year === year)?.value ||
      cat.metric.forecastValues.find((v) => v.year === year)?.value ||
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
  //let negTotal = 0;

  cats.forEach((cat) => {
    if (cat.value > 0) {
      posCount++;
      posTotal += cat.value;
    }
    if (cat.value < 0) {
      negCount++;
      negTotal += cat.value;
    }
  });

  const hasOnlyOneNegativeSector = negCount === 1;
  const hasPositiveSectors = posCount > 0;

  // If there is only one negative sector we can use it as a group label
  // If all sectors are negative we can use the parent node as a group label
  // Otherwise we have to use generic label for negative group
  const negGroupName = hasOnlyOneNegativeSector
    ? cats.find((cat) => cat.value < 0).name
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
        base: [-cat.value],
        name: cat.shortName || cat.name,
        type: 'bar',
        text: cat.name,
        textposition: 'outside',
        texttemplate: '%{text}<br>%{y}',
        width: 0.5,
        marker: {
          color: cat.color || theme.graphColors.grey050,
        },
      });
    }
    if (cat.value > 0) {
      posTraces.push({
        x: [parentNode.shortName || parentNode.name],
        y: [cat.value],
        name: cat.shortName || cat.name,
        type: 'bar',
        meta: [
          cat.value / posTotal >= 0.01
            ? Math.round((cat.value / posTotal) * 100)
            : '<1',
        ],
        text: cat.name,
        textposition: 'outside',
        insidetextanchor: 'start',
        texttemplate: '%{meta[0]}%',
        textangle: 0,
        width: 0.5,
        marker: {
          color: cat.color || theme.graphColors.grey050,
        },
      });
    }
  });

  return posTraces.concat(negTraces);
};

type BarGraphProps = {
  node: OutcomeNodeFieldsFragment;
  subNodes: OutcomeNodeFieldsFragment[];
  endYear: number;
};

const BarGraph = (props: BarGraphProps) => {
  const { node: parentNode, subNodes, endYear } = props;
  const { t, i18n } = useTranslation();
  const theme = useTheme();

  const [loading, setLoading] = useState(true);

  const metric = parentNode.metric!;

  const displayNodes =
    subNodes?.length > 1 ? subNodes : parentNode && [parentNode];
  const shortUnit = metric.unit?.short;

  const barTraces = makeTrace(parentNode, displayNodes, endYear, theme, t);

  const allValues = barTraces.map((trace) => Math.abs(trace.y[0]));
  const range = getRange(allValues);

  const layout: PlotParams['layout'] = {
    height: 350,
    hovermode: false,
    barmode: 'stack',
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
        text: shortUnit || undefined,
        font: {
          size: 14,
        },
        showarrow: false,
      },
    ],
    yaxis: {
      range: range,
    },
    xaxis: {
      type: 'category',
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
    <div>
      {loading && (
        <PlotLoader>
          <Spinner color="dark" />
        </PlotLoader>
      )}
      <Plot
        data={barTraces}
        layout={layout}
        useResizeHandler
        config={{ displayModeBar: false, responsive: true, staticPlot: true }}
        onInitialized={() => setLoading(false)}
        style={{ minWidth: '300px', maxWidth: '600px', margin: '0 auto' }}
      />
    </div>
  );
};

export default BarGraph;
