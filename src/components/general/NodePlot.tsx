import { useMemo } from 'react';

import type { LineSeriesOption } from 'echarts';
import type { EChartsCoreOption } from 'echarts/core';
import { useLocale } from 'next-intl';
import { tint, transparentize } from 'polished';
// @ts-expect-error - No types available for react-json-to-csv
import CsvDownload from 'react-json-to-csv';

import { Chart } from '@common/components/Chart';
import { getEChartsLocaleStrings } from '@common/components/register-echarts-locales';
import { useTheme } from '@common/themes';
import styled from '@common/themes/styled';

import { useTranslation } from '@/common/i18n';
import { useInstance } from '@/common/instance';
import { useAxisLabelFormatter, useNumberFormatter } from '@/common/numbers';
import { metricToPlot } from '@/common/preprocess';
import { createAxisTooltipFormatter, stripHtml } from '@/components/charts/chartTooltip';
import Icon from '@/components/common/icon';
import { useSite } from '@/context/site';
import type { CausalGridNode } from './CausalGrid';

// The historical→forecast connector helper series is unnamed: it must not
// appear in the legend or tooltip, and the aria description then reads it as
// an anonymous line series instead of announcing an internal name
const JOIN_SERIES = '';

// Legend icon drawing a dashed horizontal line (three filled dashes), for
// symbol-less dashed series where ECharts would otherwise show a filled circle
const DASHED_LINE_ICON = 'path://M0,0 h8 v4 h-8 z M12,0 h8 v4 h-8 z M24,0 h8 v4 h-8 z';

// Stable identity so hook dependencies don't churn when there's no data
const EMPTY_PLOT: { x: number[]; y: number[] } = { x: [], y: [] };

// The subset of the ECharts locale-pack shape used for the aria description
type EChartsLocalePack = {
  aria?: {
    general?: { withTitle?: string; withoutTitle?: string };
    series?: {
      single?: { prefix?: string; withName?: string };
      multiple?: {
        prefix?: string;
        withName?: string;
        separator?: { middle?: string; end?: string };
      };
    };
  };
  series?: { typeNames?: { line?: string } };
};

const PlotWrapper = styled.div<{ $compact?: boolean }>`
  margin: 0 auto;
  padding: 1em 0.5rem;
  max-width: ${(props) => (props.$compact ? '480px' : '100%')};
  overflow-x: auto;
  background-color: ${({ theme }) => theme.themeColors.white};

  > div {
    min-width: ${(props) => (props.$compact ? '320px' : '600px')};
  }
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
  quantity?: string | null | undefined;
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
  const locale = useLocale();
  const instance = useInstance();
  const theme = useTheme();
  const site = useSite();
  const formatNumber = useNumberFormatter();
  const formatAxisLabel = useAxisLabelFormatter();

  const plotColor = color || theme.graphColors.blue070;

  const hasImpact = Boolean(
    impactMetric?.forecastValues.length &&
    impactMetric.forecastValues.find((dataPoint) => dataPoint.value !== 0)
  );
  const scenarioPlotColor =
    hasImpact || isAction ? theme.graphColors.green050 : tint(0.3, plotColor);

  const baselineForecast = metric
    ? metricToPlot(metric, 'baselineForecastValues', startYear, endYear)
    : EMPTY_PLOT;
  const historical = metric
    ? metricToPlot(metric, 'historicalValues', startYear, endYear)
    : EMPTY_PLOT;
  const forecast = metric ? metricToPlot(metric, 'forecastValues', startYear, endYear) : EMPTY_PLOT;
  const impactHistorical =
    hasImpact && impactMetric
      ? metricToPlot(impactMetric, 'historicalValues', startYear, endYear)
      : null;
  const impactForecast =
    hasImpact && impactMetric
      ? metricToPlot(impactMetric, 'forecastValues', startYear, endYear)
      : null;

  const baselineName = site.baselineName;
  // Extracted so the memo below can depend on the specific properties
  // (whole-object deps would defeat the React Compiler's memoization)
  const metricName = metric?.name;
  const unitHtml = metric?.unit?.htmlShort ?? '';
  const showBaseline = !isAction && !!baselineName && instance.features.baselineVisibleInGraphs;
  const showGoal = !compact && targetYearGoal != null;
  const targetName = `${t('target')} ${targetYear}`;

  // create downloadable table
  const tableColumns = [
    t('table-year'),
    t('table-historical'),
    t('table-scenario-forecast'),
    site.baselineName ?? '',
    t('table-action-impact'),
  ];

  const downloadableHistorical = historical.x.map((date, index) => ({
    [tableColumns[0]]: date,
    [tableColumns[1]]: historical.y[index],
    [tableColumns[2]]: '',
    [tableColumns[3]]: '',
    [tableColumns[4]]: impactHistorical ? impactHistorical.y[index] : '',
  }));

  const downloadableForecast = forecast.x.map((date, index) => ({
    [tableColumns[0]]: date,
    [tableColumns[1]]: '',
    [tableColumns[2]]: forecast.y[index],
    [tableColumns[3]]: baselineForecast.y[index],
    [tableColumns[4]]: impactForecast ? impactForecast.y[index] : '',
  }));

  const downloadableTable = downloadableHistorical.concat(downloadableForecast);

  const chartData: EChartsCoreOption = useMemo(() => {
    // The full requested range, like Plotly's explicit axis range — the axis
    // shows all years even when the data covers only part of them
    const years: number[] = [];
    for (let year = startYear; year <= endYear; year++) {
      years.push(year);
    }
    const yearIndex = new Map(years.map((year, i) => [year, i]));

    const align = (xs: number[], ys: (number | null)[]) => {
      const values: (number | null)[] = years.map(() => null);
      xs.forEach((year, i) => {
        const idx = yearIndex.get(year);
        if (idx != null) values[idx] = ys[i];
      });
      return values;
    };

    // The impact band's legend/series name and fill color
    const bandName = t('plot-action-impact');
    const bandColor = transparentize(0.85, scenarioPlotColor);

    // Fill styles for the `filled` variant: solid area, thin white line
    const filledStyles: Partial<LineSeriesOption> = filled
      ? {
          areaStyle: { opacity: 1 },
          lineStyle: { color: theme.themeColors.white, width: 1 },
          showSymbol: false,
        }
      : {};

    const series: LineSeriesOption[] = [];

    series.push({
      type: 'line',
      name: t('plot-actualized'),
      data: align(historical.x, historical.y),
      color: plotColor,
      smooth: true,
      lineStyle: { width: 3 },
      showSymbol: historical.x.length <= 8,
      symbolSize: 8,
      ...filledStyles,
      // Horizontal dotted goal line spanning the whole plot
      markLine: showGoal
        ? {
            silent: true,
            symbol: 'none',
            label: { show: false },
            lineStyle: {
              color: theme.graphColors.red070,
              width: 2,
              type: 'dotted',
            },
            data: [{ yAxis: targetYearGoal }],
          }
        : undefined,
    });

    // Dotted two-point connector between the last historical and the first
    // forecast point; hidden from the legend and the tooltip. Deliberately
    // unnamed so the aria description reads it as an anonymous line series
    // instead of announcing an internal name.
    const lastHistYear = historical.x[historical.x.length - 1];
    const firstForecastYear = forecast.x[0];
    if (lastHistYear != null && firstForecastYear != null) {
      series.push({
        type: 'line',
        name: JOIN_SERIES,
        data: align(
          [lastHistYear, firstForecastYear],
          [historical.y[historical.y.length - 1], forecast.y[0]]
        ),
        color: scenarioPlotColor,
        lineStyle: { width: 3, type: 'dotted' },
        showSymbol: false,
        ...(filled ? { areaStyle: { color: scenarioPlotColor, opacity: 1 } } : {}),
      });
    }

    const forecastSeries: LineSeriesOption = {
      type: 'line',
      name: t('plot-scenario'),
      data: align(forecast.x, forecast.y),
      color: scenarioPlotColor,
      smooth: true,
      lineStyle: { width: 3 },
      showSymbol: forecast.x.length <= 8,
      symbolSize: 8,
      ...filledStyles,
    };

    // The forecast level if this action weren't applied (only on charts
    // showing an action's impact); also feeds the aria description below
    const withoutActionY =
      hasImpact && impactMetric
        ? isAction
          ? // An action's visualised impact without this action applied is always the value of the most recent actualised datapoint or zero
            new Array<number>(forecast.y.length).fill(
              historical.y.length ? historical.y[historical.y.length - 1] : 0
            )
          : forecast.y.map((dataPoint, index) => {
              if (impactMetric.forecastValues.length > index) {
                return dataPoint - impactMetric.forecastValues[index].value;
              }
              return dataPoint;
            })
        : null;

    if (withoutActionY) {
      // The impact band shows the difference between the forecast with and
      // without this action: the forecast series doubles as the stack base
      // and a delta series fills the area up to the "without action" level.
      // The delta usually has the opposite sign of the forecast, so the
      // default 'samesign' strategy would start a separate stack at zero —
      // 'all' stacks it onto the forecast regardless of sign.
      forecastSeries.stack = 'impact-band';
      forecastSeries.stackStrategy = 'all';

      series.push(forecastSeries);

      // The band series is named for its legend entry ("Action impact" with
      // a colored box), but its values are deltas, so it stays hidden from
      // the tooltip — the "without action" series below carries the readable
      // absolute values there.
      series.push({
        type: 'line',
        name: bandName,
        stack: 'impact-band',
        stackStrategy: 'all',
        data: align(
          forecast.x,
          withoutActionY.map((value, i) => value - forecast.y[i])
        ),
        color: bandColor,
        lineStyle: { width: 0 },
        showSymbol: false,
        silent: true,
        areaStyle: {
          color: bandColor,
          opacity: 1,
        },
      });

      // Invisible line carrying the absolute "without action" values for the
      // tooltip (not shown in the legend).
      series.push({
        type: 'line',
        name: t('plot-without-action'),
        data: align(forecast.x, withoutActionY),
        color: tint(0.45, scenarioPlotColor),
        lineStyle: { width: 0 },
        showSymbol: false,
      });
    } else {
      series.push(forecastSeries);
    }

    if (showBaseline) {
      series.push({
        type: 'line',
        name: baselineName,
        data: align(baselineForecast.x, baselineForecast.y),
        color: theme.graphColors.grey060,
        smooth: true,
        lineStyle: { width: 2, type: 'dashed' },
        // 'none' (rather than showSymbol: false) also removes the round
        // marker from the legend entry
        symbol: 'none',
      });
    }

    // Single point at the target year, mainly to get a legend entry for the
    // goal line
    if (showGoal && yearIndex.has(endYear)) {
      series.push({
        type: 'line',
        name: targetName,
        data: align([endYear], [targetYearGoal]),
        color: theme.graphColors.red070,
        lineStyle: { width: 2, type: 'dotted' },
        symbolSize: 8,
      });
    }

    // Series without any data points are left out of the legend (like they
    // are left out of the aria description)
    const legendItems = [
      ...(historical.x.length > 0 ? [t('plot-actualized')] : []),
      ...(forecast.x.length > 0 ? [t('plot-scenario')] : []),
      // Colored box marking the impact band
      ...(hasImpact ? [{ name: bandName, icon: 'rect' }] : []),
      ...(showBaseline && baselineForecast.x.length > 0
        ? [{ name: baselineName, icon: DASHED_LINE_ICON }]
        : []),
      ...(showGoal ? [targetName] : []),
    ];

    const baseFormatter = createAxisTooltipFormatter((value) =>
      value == null ? '—' : `${formatNumber(value)} ${unitHtml}`
    );

    // Screen-reader description in ECharts' own style and wording, composed
    // from the locale packs' aria templates (no translations to maintain) —
    // but with our own title (node name + unit) and series selection: helper
    // and dataless series are skipped, and each series carries its year
    // range with the first and last values. The native generator can't do
    // this: it describes every series by its literal name and enumerates
    // raw data (null-padded years as NaN).
    const unitText = stripHtml(unitHtml);
    const describeSeries = (name: string, xs: number[], ys: number[]) => {
      if (xs.length === 0) return null;
      const point = (i: number) => `${xs[i]}: ${formatNumber(ys[i])} ${unitText}`;
      return xs.length === 1
        ? `${name} (${point(0)})`
        : `${name} (${point(0)} – ${point(xs.length - 1)})`;
    };
    const describedSeries = [
      describeSeries(t('plot-actualized'), historical.x, historical.y),
      // Unlike in the legend, spell out that the scenario series is a
      // forecast ("Valittu skenaario – Ennuste"); composed from two existing
      // keys with their own casing (German nouns must stay capitalized)
      describeSeries(`${t('plot-scenario')} – ${t('forecast')}`, forecast.x, forecast.y),
      ...(withoutActionY
        ? [
            describeSeries(
              bandName,
              forecast.x,
              withoutActionY.map((value, i) => value - forecast.y[i])
            ),
            describeSeries(t('plot-without-action'), forecast.x, withoutActionY),
          ]
        : []),
      showBaseline ? describeSeries(baselineName, baselineForecast.x, baselineForecast.y) : null,
      showGoal ? `${targetName}: ${formatNumber(targetYearGoal)} ${unitText}` : null,
    ].filter((entry): entry is string => entry != null);
    const localePack = getEChartsLocaleStrings(locale) as EChartsLocalePack;
    const fmt = (template: string | undefined, values: Record<string, string | number> = {}) =>
      (template ?? '').replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''));
    const many = describedSeries.length > 1;
    const seriesTpl = many ? localePack.aria?.series?.multiple : localePack.aria?.series?.single;
    const lineTypeName = localePack.series?.typeNames?.line ?? 'line chart';
    const chartTitle = metricName ? `${metricName}, ${unitText}` : null;
    const ariaDescription =
      (chartTitle
        ? fmt(localePack.aria?.general?.withTitle, { title: chartTitle })
        : fmt(localePack.aria?.general?.withoutTitle)) +
      fmt(seriesTpl?.prefix, { seriesCount: describedSeries.length }) +
      describedSeries
        .map((name, idx) =>
          fmt(seriesTpl?.withName, { seriesId: idx, seriesType: lineTypeName, seriesName: name })
        )
        .join(localePack.aria?.series?.multiple?.separator?.middle ?? '') +
      (many ? (localePack.aria?.series?.multiple?.separator?.end ?? '') : '');

    return {
      backgroundColor: theme.themeColors.white,
      aria: { enabled: true, label: { description: ariaDescription } },
      tooltip: {
        trigger: 'axis',
        formatter: (params: unknown) => {
          // Hide helper series and series without data at the hovered year
          const list: unknown[] = Array.isArray(params) ? params : [params];
          const items = list.filter((p) => {
            const { seriesName, value } = p as { seriesName?: string; value?: unknown };
            // Unnamed series = the join helper
            if (!seriesName || seriesName === bandName) return false;
            return value != null;
          });
          if (items.length === 0) return '';
          return baseFormatter(items as Parameters<typeof baseFormatter>[0]);
        },
      },
      grid: {
        containLabel: true,
        top: 24,
        left: 10,
        right: 15,
        bottom: compact ? 10 : 40,
      },
      legend: {
        show: !compact,
        type: 'plain',
        bottom: 0,
        data: legendItems,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: years.map(String),
      },
      yAxis: {
        type: 'value',
        name: unitText,
        axisLabel: {
          formatter: (value: number) => formatAxisLabel(value),
        },
        // Fewer, coarser ticks (the default hint of 5 often rounds down to a
        // small interval and produces ~10 labels)
        splitNumber: compact ? 3 : 4,
        // Plotly's rangemode: emissions are clamped to zero, other quantities
        // may float
        scale: quantity !== 'emissions',
      },
      series,
    };
  }, [
    historical,
    forecast,
    baselineForecast,
    impactMetric,
    hasImpact,
    isAction,
    filled,
    compact,
    quantity,
    showBaseline,
    showGoal,
    targetYearGoal,
    targetName,
    startYear,
    endYear,
    plotColor,
    scenarioPlotColor,
    unitHtml,
    metricName,
    locale,
    baselineName,
    formatNumber,
    formatAxisLabel,
    t,
    theme,
  ]);

  if (!metric?.historicalValues?.length && !metric?.forecastValues?.length) return null;

  return (
    <>
      <PlotWrapper $compact={compact}>
        <Chart
          isLoading={false}
          data={chartData}
          height={compact ? '200px' : '300px'}
          withResizeLegend={!compact}
          locale={locale}
        />
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
      </PlotWrapper>
    </>
  );
};

export default NodePlot;
