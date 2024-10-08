import _, { range } from 'lodash';
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
  if (typeof maximumFractionDigits === 'number') {
    return value.toLocaleString(language, { maximumFractionDigits });
  }

  return parseFloat(Number(value).toPrecision(nrSignificantDigits)).toLocaleString(language);
};

export const getInitialMetric = (node) => node.metric.historicalValues[0];

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

export const getMetricChange = (initial, current) =>
  initial !== 0 ? -Math.round(((initial - current) / initial) * 100) : undefined;

export const getOutcomeTotal = (nodes, date) =>
  _.sum(nodes.map((node) => getMetricValue(node, date)));

export const summarizeYearlyValues = (yearlyValues) => _.sum(yearlyValues.map((v) => v.value));

export const summarizeYearlyValuesBetween = (metric, startYear, endYear) => {
  const yearlyValues = [];
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

export const metricToPlot = (metric, segment: string, startYear: number, endYear: number) => {
  const plot: { x: number[]; y: number[] } = { x: [], y: [] };
  (metric?.[segment] ?? []).forEach((dataPoint) => {
    if (dataPoint.year <= endYear && dataPoint.year >= startYear) {
      plot.x.push(dataPoint.year);
      plot.y.push(dataPoint.value);
    }
  });
  return plot;
};

type getRangeType = (values: number[]) => [number, number];

export const getRange: getRangeType = (values) => {
  // Try to guess a clean range for the y-axis
  const minValue: number = _.min(values) ?? 0;
  const maxValue: number = _.max(values) ?? 0;
  const rangeSize = maxValue - minValue;
  const rangeDigits = Math.floor(Math.log10(rangeSize));
  const precision = rangeSize < 10 ? -rangeDigits : -rangeDigits + 1;
  const min = minValue < 0 ? -_.ceil(Math.abs(minValue), precision) : 0;
  const max = _.ceil(maxValue, precision);
  return [min, max];
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
