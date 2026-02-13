import { ceil, max, min, sum } from 'lodash-es';
import numbro from 'numbro';

let nrSignificantDigits = 3;

export function setSignificantDigits(nr: number) {
  nrSignificantDigits = nr;
}

/**
 * fractionDigits overrides significant digits
 */
export const beautifyValue = (x: number, significantDigits?: number, fractionDigits?: number) => {
  if (!significantDigits) significantDigits = nrSignificantDigits;

  if (!x) return x;

  if (typeof fractionDigits === 'number') {
    return x.toLocaleString(undefined, { maximumFractionDigits: fractionDigits });
  }

  const rounded =
    Math.abs(x) < 1
      ? Number(x.toFixed(significantDigits))
      : Number(x.toPrecision(significantDigits));

  const format: numbro.Format = {
    thousandSeparated: true,
  };

  const formatted = numbro(rounded).format(format);
  return formatted;
};

// Use Format number to locale and round to 3 decimals
export const formatNumber = (value: number, language = 'en', maximumFractionDigits?: number) => {
  if (value == null || !Number.isFinite(value)) {
    return '–';
  }
  if (typeof maximumFractionDigits === 'number') {
    return value.toLocaleString(language, { maximumFractionDigits });
  }

  return parseFloat(Number(value).toPrecision(nrSignificantDigits)).toLocaleString(language);
};

export const getInitialMetric = (node: { metric: NodeMetric }) => node.metric.historicalValues[0];

type MetricValue = {
  year: number;
  value: number;
};

type NodeMetric = {
  forecastValues: MetricValue[];
  historicalValues: MetricValue[];
};

export const getMetricValue = (node: { metric: NodeMetric }, year: number) =>
  node.metric.forecastValues.find((dataPoint) => dataPoint.year === year)?.value ??
  node.metric.historicalValues.find((dataPoint) => dataPoint.year === year)?.value;

export const getImpactMetricValue = (node: { impactMetric: NodeMetric }, date) =>
  node.impactMetric.forecastValues.find((dataPoint) => dataPoint.year === date)?.value ??
  node.impactMetric.historicalValues.find((dataPoint) => dataPoint.year === date)?.value ??
  0;

export const getMetricChange = (initial: number, current: number) =>
  initial !== 0 ? -Math.round(((initial - current) / initial) * 100) : undefined;

export const getOutcomeTotal = (nodes: { metric: NodeMetric }[], date: number) =>
  sum(nodes.map((node) => getMetricValue(node, date)));

export const summarizeYearlyValues = (yearlyValues: MetricValue[]) =>
  sum(yearlyValues.map((v) => v.value));

export const summarizeYearlyValuesBetween = (
  metric: NodeMetric,
  startYear: number,
  endYear: number
) => {
  const yearlyValues: MetricValue[] = [];
  if (metric?.historicalValues)
    metric.historicalValues.forEach((dataPoint) => {
      if (dataPoint.year >= startYear && dataPoint.year <= endYear) yearlyValues.push(dataPoint);
    });
  if (metric?.forecastValues)
    metric.forecastValues.forEach((dataPoint) => {
      if (dataPoint.year >= startYear && dataPoint.year <= endYear) yearlyValues.push(dataPoint);
    });
  if (metric?.length)
    metric.forEach((dataPoint) => {
      if (dataPoint.year >= startYear && dataPoint.year <= endYear) yearlyValues.push(dataPoint);
    });
  return summarizeYearlyValues(yearlyValues);
};

type MetricLike<K extends string> = {
  [key in K]: MetricValue[] | null;
};

export function metricToPlot<M extends MetricLike<K>, K extends string>(
  metric: M,
  segment: K,
  startYear: number,
  endYear: number
) {
  const plot: { x: number[]; y: number[] } = { x: [], y: [] };
  if (!metric[segment]) return plot;
  (metric[segment] ?? []).forEach((dataPoint) => {
    if (dataPoint.year <= endYear && dataPoint.year >= startYear) {
      plot.x.push(dataPoint.year);
      plot.y.push(dataPoint.value);
    }
  });
  return plot;
}

type getRangeType = (values: number[]) => [number, number];

export const getRange: getRangeType = (values) => {
  // Try to guess a clean range for the y-axis
  const minValue: number = min(values) ?? 0;
  const maxValue: number = max(values) ?? 0;
  const rangeSize = maxValue - minValue;
  const rangeDigits = Math.floor(Math.log10(rangeSize));
  const precision = rangeSize < 10 ? -rangeDigits : -rangeDigits + 1;
  const minimum = minValue < 0 ? ceil(Math.abs(minValue), precision) : 0;
  const maximum = ceil(maxValue, precision);
  return [minimum, maximum];
};

export interface ActionEnabledParam {
  node?: object | null;
  nodeRelativeId: string | null;
  __typename: string;
}

export function findActionEnabledParam<ParamType extends ActionEnabledParam>(params: ParamType[]) {
  const param = params.find((param) => {
    if (!param.node) return false;
    if (param.nodeRelativeId !== 'enabled') return false;
    return true;
  }) as (ParamType & { __typename: 'BoolParameterType' }) | undefined;
  if (!param) return null;
  return param;
}
