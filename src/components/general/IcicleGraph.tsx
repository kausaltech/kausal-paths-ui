import { useState } from 'react';

import dynamic from 'next/dynamic';

import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { CircularProgress } from '@mui/material';
import { useTranslation } from 'next-i18next';
import { readableColor } from 'polished';
import type { PlotParams } from 'react-plotly.js';

import type { OutcomeNodeFieldsFragment } from '@/common/__generated__/graphql';

const Plot = dynamic(() => import('@/components/graphs/Plot'), { ssr: false });

const PlotLoader = styled.div`
  height: 350px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${(props) => props.theme.graphColors.grey020};
`;

const makeTrace = (parentNode, childNodes, year, i18n, unit, theme) => {
  const { language } = i18n;

  const numberFormat = new Intl.NumberFormat(language, {
    maximumSignificantDigits: 3,
  });
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

  cats.push({
    name: `${parentNode.shortName || parentNode.name} ${year}`,
    id: parentNode.id,
    value: cats.reduce((acc, cat) => (cat.value > 0 ? acc + cat.value : acc), 0),
    parent: '',
    color: theme.graphColors.grey010,
  });

  cats.forEach((cat) => {
    cat.content =
      cat.value > 0
        ? `${numberFormat.format(
            (cat.value / cats[cats.length - 1].value) * 100
          )}%<br>${numberFormat.format(cat.value)} ${unit}`
        : `${numberFormat.format(cat.value)} ${unit}`;
  });

  const segmentBgColors = cats.map((cat) => cat.color || theme.graphColors.grey050);
  const segmentTextColors = segmentBgColors.map((segment) =>
    segment ? readableColor(segment, '#000000', '#ffffff') : null
  );

  const trace = {
    type: 'treemap',
    name: '',
    labels: cats.map((cat) => `<b>${cat.name}</b>`),
    text: cats.map((cat) => cat.content),
    ids: cats.map((cat) => cat.id),
    parents: cats.map((cat) => cat.parent),
    values: cats.map((cat) => Math.abs(cat.value)),
    marker: {
      colors: segmentBgColors,
    },
    branchvalues: 'total',
    maxdepth: 2,
    textinfo: 'label+text',
    pathbar: {
      edgeshape: '>',
      thickness: 24,
      side: 'top',
    },
    textfont: {
      family:
        "-apple-system, -apple-system, BlinkMacSystemFont, 'Segoe UI', " +
        "Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', " +
        'sans-serif, helvetica neue, helvetica, Ubuntu, roboto, noto, segoe ui, arial, sans-serif',
      color: segmentTextColors,
      size: 13,
    },
    tiling: {
      pad: 2,
    },
  };

  return trace;
};

type IcicleGraphProps = {
  node: OutcomeNodeFieldsFragment;
  subNodes: OutcomeNodeFieldsFragment[];
  endYear: number;
};

const IcicleGraph = (props: IcicleGraphProps) => {
  const { node: parentNode, subNodes, endYear } = props;
  const { i18n } = useTranslation();
  const theme = useTheme();

  const [loading, setLoading] = useState(true);

  const metric = parentNode.metric!;

  const displayNodes = subNodes?.length > 1 ? subNodes : parentNode && [parentNode];
  const shortUnit = metric.unit?.short;

  const icicleTrace = makeTrace(parentNode, displayNodes, endYear, i18n, shortUnit, theme);

  const layout: PlotParams['layout'] = {
    showlegend: false,
    paper_bgcolor: 'rgba(0,0,0,0)',
    height: 350,
    margin: { t: 0, b: 0, l: 0, r: 0 },
    hovermode: false,
  };

  return (
    <div>
      {loading && (
        <PlotLoader>
          <CircularProgress />
        </PlotLoader>
      )}
      <Plot
        noValidate
        data={[icicleTrace]}
        layout={layout}
        useResizeHandler
        config={{ displayModeBar: false, responsive: true }}
        onInitialized={() => setLoading(false)}
        style={{ minWidth: '300px', maxWidth: '800px', margin: '0 auto' }}
      />
    </div>
  );
};

export default IcicleGraph;
