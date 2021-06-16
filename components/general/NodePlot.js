import { useContext } from 'react';
import dynamic from 'next/dynamic';
import { useTranslation } from 'next-i18next';
import { lighten } from 'polished';
import { ThemeContext } from 'styled-components';

const Plot = dynamic(() => import('components/graphs/Plot'),
  { ssr: false });

const metricToPlot = (metric, segment, startYear, endYear) => {
  const plot = { x: [], y: [] };
  if (!metric) return [];
  metric[segment].forEach((dataPoint) => {
    if (dataPoint.year <= endYear && dataPoint.year >= startYear) {
      plot.x.push(dataPoint.year);
      plot.y.push(dataPoint.value);
    }
  });
  return plot;
};

const NodePlot = (props) => {
  const {
    metric,
    impactMetric,
    year,
    startYear,
    endYear,
    color,
    isAction,
  } = props;

  const { t } = useTranslation();
  const theme = useContext(ThemeContext);

  const plotColor = color || theme.graphColors.blue070;
  const shapes = [];
  const plotData = [];

  const formatHover = (name, color) => {
    const out = {
      hovertemplate: `${name}<br />%{x}: <b>%{y:.3r}</b> ${metric?.unit?.htmlShort}<extra></extra>`,
      hoverlabel: {
        bgcolor: color,
      }
    };
    return out;
  }

  const hasImpact = impactMetric?.forecastValues.length
    && impactMetric.forecastValues.find((dataPoint) => dataPoint.value !== 0);

  const baselineForecast = metricToPlot(metric, 'baselineForecastValues', startYear, endYear);
  const historical = metricToPlot(metric, 'historicalValues', startYear, endYear);
  const forecast = metricToPlot(metric, 'forecastValues', startYear, endYear);

  plotData.push(
    {
      x: historical.x,
      y: historical.y,
      xaxis: 'x2',
      yaxis: 'y1',
      marker: { size: 8 },
      name: t('plot-actualized'),
      type: 'scatter',
      line: {
        color: plotColor,
        shape: 'spline',
        width: '3',
      },
      smoothing: true,
      ...formatHover(t('plot-actualized'), plotColor)
    },
  );

  if (!isAction) {
    plotData.push(
      {
        x: baselineForecast.x,
        y: baselineForecast.y,
        xaxis: 'x2',
        yaxis: 'y1',
        mode: 'lines',
        name: t('plot-baseline'),
        type: 'scatter',
        line: {
          color: theme.graphColors.grey030,
          shape: 'spline',
          width: '3',
          dash: 'dash',
        },
        smoothing: true,
        ...formatHover(t('plot-baseline', theme.graphColors.grey030)),
      },
    );
  }

  if (hasImpact) {
    const impact = metricToPlot(metric, 'forecastValues', startYear, endYear);

    impact.y.map((dataPoint, index) => {
      impact.y[index] = impact.y[index] - impactMetric.forecastValues[index].value;
    });

    plotData.push(
      {
        x: impact.x,
        y: impact.y,
        xaxis: 'x2',
        yaxis: 'y1',
        mode: 'lines',
        name: t('plot-without-action'),
        type: 'scatter',
        line: {
          color: lighten(0.25, plotColor),
          shape: 'spline',
          width: '3',
          dash: 'dash',
        },
        smoothing: true,
        ...formatHover(t('plot-without-action'), lighten(0.25, plotColor)),
      },
    );
  }

  const scenarioPlotColor = hasImpact || isAction ? theme.graphColors.green050 : lighten(0.25, plotColor);
  // Two-entry trace to join historical and scenario together
  if (historical?.x && forecast?.x) {
    const joinTrace = {
      x: [historical.x[historical.x.length - 1], forecast.x[0]],
      y: [historical.y[historical.y.length - 1], forecast.y[0]],
      xaxis: 'x2',
      yaxis: 'y1',
      marker: { size: 8 },
      name: t('plot-scenario'),
      type: 'scatter',
      line: {
        color: scenarioPlotColor,
        width: '3',
        dash: 'dot',
      },
      mode: 'lines',
      hoverinfo: 'skip',
      showlegend: false,
    };
    plotData.push(joinTrace);
  }

  plotData.push(
    {
      x: forecast.x,
      y: forecast.y,
      xaxis: 'x2',
      yaxis: 'y1',
      marker: { size: 8 },
      name: t('plot-scenario'),
      type: 'scatter',
      line: {
        color: scenarioPlotColor,
        shape: 'spline',
        width: '3',
      },
      smoothing: true,
      ...formatHover(t('plot-scenario', scenarioPlotColor)),
    },
  );

  const todaymarker = {
    type: 'line',
    yref: 'paper',
    x0: year,
    y0: 0,
    x1: year,
    y1: 1,
    line: {
      color: '#D46262',
      width: 2,
      dash: 'dot',
    },
  };

  shapes.push(todaymarker);

  const layout = {
    height: 300,
    margin: {
      t: 24,
      r: 32,
      b: 48,
      l: 24,
    },
    xaxis: {
      domain: [0, 0.03],
      anchor: 'y1',
      nticks: 1,
      ticklen: 5,
    },
    yaxis: {
      domain: [0, 1],
      anchor: 'x1',
      title: metric?.unit?.htmlShort
    },
    xaxis2: {
      domain: [0.075, 1],
      anchor: 'y2',
      ticklen: 5,
    },
    yaxis2: {
      domain: [0, 1],
      anchor: 'x2',
    },
    autosize: true,
    font: {
      family: 'Inter',
    },
    paper_bgcolor: 'rgba(0,0,0,0)',
    showlegend: true,
    legend: {
      x: 1,
      xanchor: 'right',
      y: 1,
    },
    grid: { rows: 1, columns: 2, pattern: 'independent' },
  };

  return (
    <Plot
      data={plotData}
      layout={layout}
      useResizeHandler
      style={{ width: '100%' }}
      config={{ displayModeBar: false }}
    />
  );
};

export default NodePlot;
