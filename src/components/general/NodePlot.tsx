import dynamic from 'next/dynamic';

import { useTranslation } from 'next-i18next';
import type Plotly from 'plotly.js';
import { tint, transparentize } from 'polished';
import CsvDownload from 'react-json-to-csv';
import styled, { useTheme } from 'styled-components';

import { useInstance } from '@/common/instance';
import { metricToPlot } from '@/common/preprocess';
import Icon from '@/components/common/icon';
import { useSite } from '@/context/site';

import type { CausalGridNode } from './CausalGrid';

const Plot = dynamic(() => import('@/components/graphs/Plot'), { ssr: false });

const PlotWrapper = styled.div<{ $compact?: boolean }>`
  margin: 0 auto;
  max-width: ${(props) => (props.$compact ? '480px' : '100%')};
  overflow-x: auto;
`;

const Tools = styled.div`
  padding: 0 0 0.5rem;
  text-align: right;
  .btn-link {
    text-decoration: none;
  }
  .icon {
    width: 1.5rem !important;
    height: 1.5rem !important;
    vertical-align: middle;
  }
`;

type NodePlotProps = {
  metric: CausalGridNode['metric'];
  impactMetric: CausalGridNode['impactMetric'];
  startYear: number;
  endYear: number;
  color: string | null | undefined;
  isAction?: boolean;
  targetYearGoal?: number;
  targetYear?: number;
  filled?: boolean;
  quantity?: string;
  compact?: boolean;
};

const NodePlot = (props: NodePlotProps) => {
  const {
    metric,
    impactMetric,
    startYear,
    endYear,
    color,
    isAction = false,
    targetYearGoal,
    targetYear,
    filled = false,
    quantity,
    compact = false,
  } = props;

  const { t } = useTranslation();
  const instance = useInstance();
  const theme = useTheme();
  const site = useSite();

  const systemFont =
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif';
  const plotColor = color || theme.graphColors.blue070;
  const shapes: Partial<Plotly.Shape>[] = [];
  const plotData: Partial<Plotly.PlotData>[] = [];
  const rangeMode = quantity === 'emissions' ? 'tozero' : 'normal';

  const formatHover = (name: string, color: string) => {
    const out = {
      hovertemplate: `${name}<br /><b>%{y:.3r}</b> ${metric?.unit?.htmlShort}<extra></extra>`,
      hoverlabel: {
        bgcolor: color,
        font: {
          family: systemFont,
        },
      },
    };
    return out;
  };

  if (!metric?.historicalValues?.length && !metric?.forecastValues?.length) return null;

  const hasImpact =
    impactMetric?.forecastValues.length &&
    impactMetric.forecastValues.find((dataPoint) => dataPoint.value !== 0);

  const baselineForecast = metricToPlot(metric, 'baselineForecastValues', startYear, endYear);

  const historical = metricToPlot(metric, 'historicalValues', startYear, endYear);
  const forecast = metricToPlot(metric, 'forecastValues', startYear, endYear);
  const impactHistorical =
    hasImpact && metricToPlot(impactMetric, 'historicalValues', startYear, endYear);
  const impactForecast =
    hasImpact && metricToPlot(impactMetric, 'forecastValues', startYear, endYear);

  // create downloadable table
  const tableColumns = [
    t('table-year')!,
    t('table-historical')!,
    t('table-scenario-forecast')!,
    site.baselineName,
    t('table-action-impact')!,
  ];

  const downloadableHistorical = historical.x.map((date, index) => ({
    [tableColumns[0]]: date,
    [tableColumns[1]]: historical.y[index],
    [tableColumns[2]]: '',
    [tableColumns[3]]: '',
    [tableColumns[4]]: hasImpact ? impactHistorical.y[index] : '',
  }));

  const downloadableForecast = forecast.x.map((date, index) => ({
    [tableColumns[0]]: date,
    [tableColumns[1]]: '',
    [tableColumns[2]]: forecast.y[index],
    [tableColumns[3]]: baselineForecast.y[index],
    [tableColumns[4]]: hasImpact ? impactForecast.y[index] : '',
  }));

  const downloadableTable = downloadableHistorical.concat(downloadableForecast);

  const filledStyles = filled
    ? {
        fill: 'tozeroy',
        marker: { opacity: 0 },
        line: {
          color: 'white',
          width: '1',
          dash: 'solid',
          shape: 'spline',
        },
      }
    : {};

  plotData.push({
    x: historical.x,
    y: historical.y,
    xaxis: 'x2',
    yaxis: 'y1',
    marker: { size: 8 },
    name: t('plot-actualized')!,
    type: 'scatter',
    mode: historical.x.length > 8 ? 'lines' : 'lines+markers',
    line: {
      color: plotColor,
      shape: 'spline',
      width: 3,
    },
    fillcolor: plotColor,
    smoothing: true,
    ...filledStyles,
    ...formatHover(t('plot-actualized'), plotColor),
  });

  const scenarioPlotColor =
    hasImpact || isAction ? theme.graphColors.green050 : tint(0.3, plotColor);
  // Two-entry trace to join historical and scenario together
  if (historical?.x && forecast?.x) {
    const joinTrace: Plotly.PlotData = {
      x: [historical.x[historical.x.length - 1], forecast.x[0]],
      y: [historical.y[historical.y.length - 1], forecast.y[0]],
      xaxis: 'x2',
      yaxis: 'y1',
      marker: { size: 8 },
      name: t('plot-scenario'),
      type: 'scatter',
      line: {
        color: scenarioPlotColor,
        width: 3,
        dash: 'dot',
      },
      mode: 'lines',
      hoverinfo: 'skip',
      showlegend: false,
      fillcolor: scenarioPlotColor,
      ...filledStyles,
    };
    plotData.push(joinTrace);
  }

  plotData.push({
    x: forecast.x,
    y: forecast.y,
    xaxis: 'x2',
    yaxis: 'y1',
    marker: { size: 8 },
    mode: forecast.x.length > 8 ? 'lines' : 'lines+markers',
    name: t('plot-scenario')!,
    type: 'scatter',
    line: {
      color: scenarioPlotColor,
      shape: 'spline',
      width: 3,
    },
    smoothing: true,
    fillcolor: scenarioPlotColor,
    ...filledStyles,
    ...formatHover(t('plot-scenario'), scenarioPlotColor),
  });

  if (hasImpact) {
    const impact = metricToPlot(metric, 'forecastValues', startYear, endYear);

    const withoutActionY = isAction
      ? // An action's visualised impact without this action applied is always the value of the most recent actualised datapoint or zero
        new Array(impact.y.length).fill(
          historical.y.length ? historical.y[historical.y.length - 1] : 0
        )
      : impact.y.map((dataPoint, index) => {
          if (impactMetric.forecastValues.length > index) {
            return dataPoint - impactMetric.forecastValues[index].value;
          }

          return dataPoint;
        });

    plotData.push({
      x: impact.x,
      y: withoutActionY,
      xaxis: 'x2',
      yaxis: 'y1',
      mode: 'lines',
      name: t('plot-action-impact')!,
      type: 'scatter',
      fill: 'tonexty',
      fillcolor: transparentize(0.85, scenarioPlotColor),
      line: { width: 0 },
      ...formatHover(t('plot-without-action'), tint(0.45, scenarioPlotColor)),
    });
  }

  if (!isAction && site.baselineName && instance.features.baselineVisibleInGraphs) {
    plotData.push({
      x: baselineForecast.x,
      y: baselineForecast.y,
      xaxis: 'x2',
      yaxis: 'y1',
      mode: 'lines',
      name: site.baselineName!,
      type: 'scatter',
      line: {
        color: theme.graphColors.grey060,
        shape: 'spline',
        width: 2,
        dash: 'dash',
      },
      ...formatHover(site.baselineName!, theme.graphColors.grey030),
    });
  }

  if (!compact && targetYearGoal) {
    shapes.push({
      type: 'line',
      yref: 'y',
      x0: Date.parse(`Nov 1, ${startYear - 1}`),
      y0: targetYearGoal,
      x1: Date.parse(`Feb 1, ${endYear}`),
      y1: targetYearGoal,
      line: {
        color: theme.graphColors.red070,
        width: 2,
        dash: 'dot',
      },
    });
    plotData.push({
      x: [endYear],
      y: [targetYearGoal],
      type: 'scatter',
      xaxis: 'x2',
      yaxis: 'y',
      name: `${t('target')} ${targetYear}`,
      line: {
        color: theme.graphColors.red070,
        width: 2,
        dash: 'dot',
      },
    });
  }
  const nrYears = endYear - startYear;
  const layout: Partial<Plotly.Layout> = {
    height: compact ? 200 : 300,
    margin: compact
      ? {
          t: 24,
          r: 0,
          b: 0,
          l: 42,
        }
      : {
          t: 24,
          r: 24,
          b: 48,
          l: 12,
        },
    xaxis: {
      domain: [0, 0.03],
      anchor: 'y',
      nticks: 1,
      ticklen: 10,
    },
    yaxis: {
      domain: [0, 1],
      anchor: 'x',
      ticklen: 10,
      gridcolor: theme.graphColors.grey005,
      tickcolor: theme.graphColors.grey030,
      title: {
        text: metric?.unit?.htmlShort,
      },
      rangemode: rangeMode,
    },
    xaxis2: {
      domain: [0.075, 1],
      anchor: 'y2',
      ticklen: 10,
      type: 'date',
      nticks: compact ? 10 : 20,
      // dtick: nrYears > 15 ? 'M24' : 'M12',
      range: [Date.parse(`Nov 1, ${startYear - 1}`), Date.parse(`Feb 1, ${endYear}`)],
      gridcolor: theme.graphColors.grey005,
      tickcolor: theme.graphColors.grey030,
      hoverformat: '<b>%Y</b>',
    },
    yaxis2: {
      domain: [0, 1],
      anchor: 'x2',
    },
    hovermode: 'x unified',
    hoverlabel: {
      bgcolor: 'white',
    },
    autosize: true,
    font: {
      family: systemFont,
    },
    paper_bgcolor: 'rgba(0,0,0,0)',
    showlegend: compact ? false : true,
    legend: {
      orientation: 'h',
      yanchor: 'top',
      y: -0.2,
      xanchor: 'right',
      x: 1,
    },
    grid: { rows: 1, columns: 2, pattern: 'independent' },
    shapes,
  };

  return (
    <>
      <PlotWrapper $compact={compact}>
        <Plot
          data={plotData}
          layout={layout}
          useResizeHandler
          style={{ minWidth: compact ? '320px' : '600px', width: '100%' }}
          config={{ displayModeBar: false }}
          noValidate
        />
      </PlotWrapper>
      {!compact && (
        <Tools>
          <CsvDownload
            data={downloadableTable}
            filename={`${metric?.id}.csv`}
            className="btn btn-link btn-sm"
          >
            <Icon name="download" />
            {` ${t('download-data')} (.csv)`}
          </CsvDownload>
        </Tools>
      )}
    </>
  );
};

export default NodePlot;
