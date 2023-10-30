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

const makeTrace = (parentNode, childNodes, year, theme) => {
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

  /*
  cats.push({
    name: `${parentNode.shortName || parentNode.name} ${year}`,
    id: parentNode.id,
    value: cats.reduce(
      (acc, cat) => (cat.value > 0 ? acc + cat.value : acc),
      0
    ),
    parent: '',
    color: theme.graphColors.grey010,
  });
  */
  const posTraces = [];
  const negTraces = [];

  cats.forEach((cat) => {
    if (cat.value < 0) {
      negTraces.push({
        x: ['negative emissions'],
        y: [cat.value],
        base: [-cat.value],
        name: cat.shortName || cat.name,
        width: [0.25],
        type: 'bar',
        marker: {
          color: cat.color || theme.graphColors.grey050,
        },
      });
    }
    if (cat.value > 0) {
      posTraces.push({
        x: ['emissions'],
        y: [cat.value],
        name: cat.shortName || cat.name,
        width: [0.25],
        type: 'bar',
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
  const { i18n } = useTranslation();
  const theme = useTheme();

  const [loading, setLoading] = useState(true);

  const metric = parentNode.metric!;

  const displayNodes =
    subNodes?.length > 1 ? subNodes : parentNode && [parentNode];
  const shortUnit = metric.unit?.short;

  const barTraces = makeTrace(parentNode, displayNodes, endYear, theme);

  const allValues = barTraces.map((trace) => Math.abs(trace.y[0]));
  const range = getRange(allValues);

  const layout: PlotParams['layout'] = {
    paper_bgcolor: 'rgba(0,0,0,0)',
    height: 350,
    hovermode: false,
    barmode: 'stack',
    annotations: [
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
      domain: [0, 1],
      anchor: 'x',
      tickcolor: theme.graphColors.grey030,
      range: range,
    },
    xaxis: {
      domain: [0, 1],
      anchor: 'y',
      tickcolor: theme.graphColors.grey030,
      automargin: true,
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
        noValidate
        data={barTraces}
        layout={layout}
        useResizeHandler
        config={{ displayModeBar: false, responsive: true }}
        onInitialized={() => setLoading(false)}
        style={{ minWidth: '300px', maxWidth: '800px', margin: '0 auto' }}
      />
    </div>
  );
};

export default BarGraph;
