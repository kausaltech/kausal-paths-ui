import _ from 'lodash';

// Use Finnish style numeric display formatting
export const beautifyValue = (x) => {
  let out;
  if (!Number.isInteger(x)) {
    out = x.toFixed(x<10 ? 1 : 0);
  } else {
    out = x;
  }
  const s = out.toString();
  const displayNumber = s.replace('.', ',');
  return displayNumber.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export const getInitialMetric = (sector) => sector.metric.historicalValues[0];

export const getMetricValue = (sector, date) => sector.metric.forecastValues.find((dataPoint) => dataPoint.year === date)?.value || sector.metric.historicalValues.find((dataPoint) => dataPoint.year === date)?.value;

export const getMetricChange = (initial, current) =>  initial !== 0 ? -Math.round(((initial-current)/initial)*100) : undefined;

export const getSectorsTotal = (sectors, date)  => _.sum(sectors.map((sector) => getMetricValue(sector, date)));
