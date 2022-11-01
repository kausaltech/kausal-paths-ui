import _ from 'lodash';
import { getI18n } from './i18n';



// Use Finnish style numeric display formatting
export const beautifyValue = (x) => {
  const i18n = getI18n();

  let out;
  if (!Number.isInteger(x)) {
    out = x.toFixed(x < 10 ? 1 : 0);
  } else {
    out = x;
  }
  let s = out.toString();
  if (i18n.language === 'fi') {
    s = s.replace('.', ',');
    s = s.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  } else {
  }
  return s;
};

export const getInitialMetric = (node) => node.metric.historicalValues[0];

export const getMetricValue = (node, date) => (
  node.metric.forecastValues.find((dataPoint) => dataPoint.year === date)?.value
  ?? node.metric.historicalValues.find((dataPoint) => dataPoint.year === date)?.value
);

export const getImpactMetricValue = (node, date) => (
  node.impactMetric.forecastValues.find((dataPoint) => dataPoint.year === date)?.value
  ?? node.impactMetric.historicalValues.find((dataPoint) => dataPoint.year === date)?.value
  ?? 0
);

export const getMetricChange = (initial, current) => (
  (initial !== 0 ? -Math.round(((initial - current) / initial) * 100) : undefined)
);

export const getOutcomeTotal = (nodes, date) => _.sum(nodes.map((node) => getMetricValue(node, date)));

export const summarizeYearlyValues = (yearlyValues) => _.sum(yearlyValues.map((v) => v.value));

export const summarizeYearlyValuesBetween = (metric, startYear, endYear) => {
  const yearlyValues = [];
  metric.historicalValues.forEach((dataPoint) => {
    if (dataPoint.year >= startYear && dataPoint.year <= endYear) yearlyValues.push(dataPoint);
  });
  metric.forecastValues.forEach((dataPoint) => {
    if (dataPoint.year >= startYear && dataPoint.year <= endYear) yearlyValues.push(dataPoint);
  });
  return summarizeYearlyValues(yearlyValues);
};

export const metricToPlot = (metric, segment, startYear, endYear) => {
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
