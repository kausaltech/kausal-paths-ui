import { useContext, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTranslation } from 'next-i18next';
import styled, { ThemeContext } from 'styled-components';
import { tint } from 'polished';
import { Spinner } from 'reactstrap';
import { settingsVar } from 'common/cache';
import { metricToPlot } from 'common/preprocess';
import SiteContext from 'context/site';
import { OutcomeNodeFieldsFragment } from 'common/__generated__/graphql';
import type { PlotParams } from 'react-plotly.js';

const Plot = dynamic(() => import('components/graphs/Plot'),
    { ssr: false });


const PlotLoader = styled.div`
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${(props) => props.theme.graphColors.grey020};
`;

const formatHover = (name, color, isPred, systemFont, predLabel, shortUnit) => {
  const predText = isPred ? ` <i> (${predLabel})</i>` : '';
  const out = {
    hovertemplate: `${name}<br />%{x}: <b>%{y:.3r} ${shortUnit}</b>${predText}<extra></extra>`,
    hoverlabel: {
      bgcolor: color,
      font: {
        family: systemFont,
      }
    }
  };
  return out;
}

const generatePlotFromNode = (
  n, startYear, endYear, minForecastYear, color, site, t, id, systemFont, predLabel, shortUnit
  ) => {
  const plotData: Plotly.Data[] = [];
  const historicalValues = [];
  let baseValue;
  const forecastValues = [];
  const historicalDates = [];
  const forecastDates = [];
  const fillColor = n.color || color;

  n.metric.historicalValues.forEach((dataPoint) => {
    if (dataPoint.year ===  settingsVar().baseYear) {
      baseValue = dataPoint.value;
      return;
    }
    if (dataPoint.year > endYear || dataPoint.year < startYear)
      return;
    let valueArray;
    let dateArray;
    if (minForecastYear && dataPoint.year >= minForecastYear) {
      valueArray = forecastValues;
      dateArray = forecastDates;
    } else {
      valueArray = historicalValues;
      dateArray = historicalDates;
    }
    valueArray.push(dataPoint.value);
    dateArray.push(dataPoint.year);
  });
  if (site.useBaseYear) {
    plotData.push(
      {
        x: [settingsVar().baseYear - 1, settingsVar().baseYear],
        y: [baseValue, baseValue],
        name: n.name,
        showlegend: false,
        type: 'scatter',
        fill: 'tonexty',
        line: {
          color: '#ffffff',
          width: 0.75,
        },
        stackgroup: `${id}group2`,
        fillcolor: fillColor,
        xaxis: 'x1',
        yaxis: 'y1',
        ...formatHover(n.name, fillColor, false, systemFont, predLabel, shortUnit),
      }
    );
  };

  plotData.push(
    {
      x: historicalDates,
      y: historicalValues,
      xaxis: 'x2',
      yaxis: 'y1',
      name: n.name,
      showlegend: false,
      type: 'scatter',
      fill: 'tonexty',
      fillcolor: fillColor,
      stackgroup: `${id}group1`,
      line: {
        color: '#ffffff',
        shape: 'spline',
        width: 0.75,
      },
      ...formatHover(n.name, fillColor, false, systemFont, predLabel, shortUnit),
    }
  );
  n.metric.forecastValues.forEach((dataPoint) => {
    if(dataPoint.year <= endYear && dataPoint.year >= startYear) {
    forecastValues.push(dataPoint.value);
    forecastDates.push(dataPoint.year);
    }
  });

  const joinData: typeof plotData[0] = {
    y: [historicalValues[historicalValues.length-1], forecastValues[0]],
    x: [historicalDates[historicalDates.length-1], forecastDates[0]],
    xaxis: 'x2',
    yaxis: 'y1',
    name: '',
    showlegend: false,
    type: 'scatter',
    fill: 'tonexty',
    fillcolor: tint(0.3, fillColor),
    stackgroup: `${id}group3`,
    line: {
      color: 'white',
      shape: 'spline',
      width: 0.5,
    },
    hoverinfo: 'skip',
  };
  plotData.push(joinData);

  plotData.push(
    {
      x: forecastDates,
      y: forecastValues,
      xaxis: 'x2',
      yaxis: 'y1',
      name: `${n.name} (${t('pred')})`,
      showlegend: false,
      type: 'scatter',
      fill: 'tonexty',
      fillcolor: tint(0.3, fillColor),
      stackgroup: `${id}group2`,
      line: {
        color: 'white',
        shape: 'spline',
        width: 0.5,
      },
      ...formatHover(n.name, fillColor, true, systemFont, predLabel, shortUnit),
    }
  );
  
  return plotData;
}

type OutcomeGraphProps = {
  node: OutcomeNodeFieldsFragment,
  subNodes: OutcomeNodeFieldsFragment[],
  color: string,
  startYear: number,
  endYear: number,
}

const OutcomeGraph = (props: OutcomeGraphProps) => {
  const { node, subNodes, color, startYear, endYear } = props;
  const { t } = useTranslation();
  const theme = useContext(ThemeContext);
  const site = useContext(SiteContext);
  const shapes: Plotly.Layout['shapes'] = [];
  const plotData: Plotly.Data[] = [];
  const [loading, setLoading] = useState(true);

  const metric = node.metric!;

  const baselineForecast = metric.baselineForecastValues && metricToPlot(node.metric, 'baselineForecastValues', startYear, endYear);
  const targetYearGoal = node.targetYearGoal;

  const systemFont = '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif';

  const displayNodes = subNodes?.length > 1 ? subNodes : node && [node];
  const shortUnit = metric.unit?.short;
  const longUnit = metric.unit?.htmlLong;
  const predLabel = t('pred');

  // Find the lowes forecast year
  const forecastYears = displayNodes.map((node) => node.metric.forecastValues[0]?.year);
  const minForecastYear = forecastYears.reduce((p, v) => (p < v ? p : v));

  // Split nodes to pos and neg
  const hasNegativeValues = ((node) => {
    if (node.metric?.forecastValues.find((val) => val.value < 0 )) return true;
    if (node.metric?.historicalValues.find((val) => val.value < 0 )) return true;
    return false;
  });
  const negativeDisplayNodes = displayNodes?.filter(hasNegativeValues);
  const positiveDisplayNodes = displayNodes?.filter((node) => !hasNegativeValues(node));

  // generate separate stacks for positive and negative side
  positiveDisplayNodes?.forEach((node, index) => {
    plotData.push(...generatePlotFromNode(node, startYear, endYear, minForecastYear, color, site, t, 'pos', systemFont, predLabel, shortUnit));
  });
  negativeDisplayNodes?.forEach((node, index) => {
    plotData.push(...generatePlotFromNode(node, startYear, endYear, minForecastYear, color, site, t, 'neg', systemFont, predLabel, shortUnit));
  });

  if (baselineForecast && site.showBaseline && site.instance.features.baselineVisibleInGraphs) {
    plotData.push(
      {
        x: baselineForecast.x,
        y: baselineForecast.y,
        xaxis: 'x2',
        yaxis: 'y1',
        mode: 'lines',
        name: settingsVar().baselineName,
        type: 'scatter',
        line: {
          color: theme.graphColors.grey060,
          shape: 'spline',
          width: 2,
          dash: 'dash',
        },
        smoothing: true,
        ...formatHover(settingsVar().baselineName, theme.graphColors.grey030, false, systemFont, predLabel, shortUnit),
      },
    );
  }

  if (targetYearGoal != null && site.showTarget) {
    shapes.push({
      type: 'line',
      yref: 'y',
      xref: 'x2',
      x0: startYear ===  settingsVar().baseYear ? settingsVar().minYear : startYear,
      y0: targetYearGoal,
      x1: endYear,
      y1: targetYearGoal,
      line: {
        color: theme.graphColors.red090,
        width: 2,
        dash: 'dot',
      },
    });
    if (endYear === settingsVar().maxYear) {
      plotData.push({
        x: [settingsVar().maxYear],
        y: [targetYearGoal],
        type: 'scatter',
        xaxis: 'x2',
        yaxis: 'y1',
        name: `${t('target')} ${settingsVar().maxYear}`,
        line: {
          color: theme.graphColors.red090,
          width: 2,
          dash: 'dot',
        },
      });
    }
  }

  const layout: PlotParams['layout'] = {
    height: 300,
    margin: {
      t: 24,
      r: 48,
      b: 48,
    },
    yaxis: {
      domain: [0, 1],
      anchor: 'x',
      ticklen: 10,
      title: longUnit || undefined,
      tickcolor: theme.graphColors.grey030,
    },
    xaxis: {
      domain: [0, 1],
      anchor: 'y',
      nticks: 1,
      ticklen: 10,
      tickcolor: theme.graphColors.grey030,
    },
    xaxis2: {
      domain: [0, 1],
      anchor: 'y',
      ticklen: 10,
      tickformat: 'd',
      tickcolor: theme.graphColors.grey030,
    },
    autosize: true,
    font: {
      family: systemFont,
    },
    paper_bgcolor: 'rgba(0,0,0,0)',
    showlegend: true,
    legend: {
      orientation: 'h',
      yanchor: 'top',
      y: -0.2,
      xanchor: 'right',
      x: 1,
    },
    shapes,
  }

  if (site.useBaseYear) {
    layout.grid = {rows: 1, columns: 2, pattern: 'independent'};
    layout.xaxis = {
      domain: [0, 0.03],
      anchor: 'y',
      nticks: 1,
      ticklen: 10,
      tickcolor: theme.graphColors.grey030,
    };
    layout.xaxis2 = {
      domain: [0.066, 1],
      anchor: 'y',
      ticklen: 10,
      tickformat: 'd',
      tickcolor: theme.graphColors.grey030,
    };
  };

  return (
    <>
      { loading && (
        <PlotLoader>
          <Spinner color="dark" />
        </PlotLoader>
        )
      }
      <Plot
        data={plotData}
        layout={layout}
        useResizeHandler
        style={{width: '100%'}}
        config={{displayModeBar: false}}
        onInitialized={() => setLoading(false)}
      />
    </>
  )
}

export default OutcomeGraph;
