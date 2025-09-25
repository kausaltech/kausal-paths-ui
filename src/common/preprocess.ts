import * as _ from 'lodash-es';
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
  _.sum(nodes.map((node) => getMetricValue(node, date)));

export const summarizeYearlyValues = (yearlyValues: MetricValue[]) =>
  _.sum(yearlyValues.map((v) => v.value));

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

// Attempt to sanitize HTML unit strings to make them more readable where html can not be rendered
export const sanitizeHtmlUnit = (unit: string) => {
  let text = unit || '';

  // Convert specific HTML sub/sup tags to Unicode before stripping all tags
  text = text
    .replace(/\<sub\>0\<\/sub\>/g, '₀')
    .replace(/\<sub\>1\<\/sub\>/g, '₁')
    .replace(/\<sub\>2\<\/sub\>/g, '₂')
    .replace(/\<sub\>3\<\/sub\>/g, '₃')
    .replace(/\<sub\>4\<\/sub\>/g, '₄')
    .replace(/\<sub\>5\<\/sub\>/g, '₅')
    .replace(/\<sub\>6\<\/sub\>/g, '₆')
    .replace(/\<sub\>7\<\/sub\>/g, '₇')
    .replace(/\<sub\>8\<\/sub\>/g, '₈')
    .replace(/\<sub\>9\<\/sub\>/g, '₉')
    .replace(/\<sup\>0\<\/sup\>/g, '⁰')
    .replace(/\<sup\>1\<\/sup\>/g, '¹')
    .replace(/\<sup\>2\<\/sup\>/g, '²')
    .replace(/\<sup\>3\<\/sup\>/g, '³')
    .replace(/\<sup\>4\<\/sup\>/g, '⁴')
    .replace(/\<sup\>5\<\/sup\>/g, '⁵')
    .replace(/\<sup\>6\<\/sup\>/g, '⁶')
    .replace(/\<sup\>7\<\/sup\>/g, '⁷')
    .replace(/\<sup\>8\<\/sup\>/g, '⁸')
    .replace(/\<sup\>9\<\/sup\>/g, '⁹');

  // Keep removing remaining tags until none remain (prevents pattern re-emergence)
  let previousLength;
  do {
    previousLength = text.length;
    // Remove both complete tags and incomplete tags (missing closing >)
    text = text.replace(/<[^>]*>?/g, '');
  } while (text.length !== previousLength);

  // Basic entity decoding for common unit symbols
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&deg;/g, '°')
    .replace(/&sup2;/g, '²')
    .replace(/&sup3;/g, '³')
    .replace(/&micro;/g, 'µ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
};
