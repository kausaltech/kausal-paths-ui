import { useContext } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link'
import { Button, ButtonGroup } from 'reactstrap';
import { BarChartFill, InfoSquare, Journals } from 'react-bootstrap-icons';
import { lighten } from 'polished';
import { ThemeContext } from 'styled-components';
import { getMetricValue, beautifyValue, getMetricChange } from 'common/preprocess';

// Plotly doesn't work with SSR
const DynamicPlot = dynamic(() => import('react-plotly.js'),
    { ssr: false });

const NodePlot = (props) => {
  const {
    metric,
    year,
    startYear,
    endYear,
    color
  } = props;

  const theme = useContext(ThemeContext);

  const plotColor = color || theme.graphColors.blue070;
  const shapes = [];
  const plotData = [];

    const historicalValues = [];
    const forecastValues = [];
    const baselineForecastValues = [];
  
    const historicalDates = [];
    const forecastDates = [];
    const baselineForecastDates = [];

    metric.baselineForecastValues.forEach((dataPoint) => {
      if(dataPoint.year <= endYear && dataPoint.year >= startYear) {
        baselineForecastValues.push(dataPoint.value);
        baselineForecastDates.push(dataPoint.year);
      }
    });

    plotData.push(
      {
        x: baselineForecastDates,
        y: baselineForecastValues,
        xaxis: 'x2',
        yaxis: 'y1',
        marker: {size: 8},
        name: 'pohjaennuste',
        type: 'scatter',
        line: {
          color: theme.graphColors.grey030,
          shape: 'spline',
          width: '3',
          dash: 'dot',
        },
        smoothing: true,
      }
    )

    metric.historicalValues.forEach((dataPoint) => {
      if(dataPoint.year <= endYear && dataPoint.year >= startYear){
        historicalValues.push(dataPoint.value);
        historicalDates.push(dataPoint.year);
      }
    });

    plotData.push(
      {
        x: historicalDates,
        y: historicalValues,
        xaxis: 'x2',
        yaxis: 'y1',
        marker: {size: 8},
        name: 'toteutunut',
        type: 'scatter',
        line: {
          color: plotColor,
          shape: 'spline',
          width: '3',
        },
        smoothing: true,
      }
    );

    metric.forecastValues.forEach((dataPoint) => {
      if(dataPoint.year <= endYear && dataPoint.year >= startYear) {
      forecastValues.push(dataPoint.value);
      forecastDates.push(dataPoint.year);
      }
    });

    forecastValues.unshift(historicalValues[historicalValues.length-1]);
    forecastDates.unshift(historicalDates[historicalDates.length-1]);

    plotData.push(
      {
        x: forecastDates,
        y: forecastValues,
        xaxis: 'x2',
        yaxis: 'y1',
        marker: {size: 8},
        name: 'skenaario',
        type: 'scatter',
        line: {
          color: lighten(0.25, plotColor),
          shape: 'spline',
          width: '3',
        },
        smoothing: true,
      }
    )

  const todaymarker =
  {
    type: 'line',
    yref: 'paper',
    x0: year,
    y0: 0,
    x1: year,
    y1: 1,
    line: {
      color: '#D46262',
      width: 2,
      dash: "dot",
    }
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
      anchor: 'x1'
    },
    xaxis2: {
      domain: [0.075, 1],
      anchor: 'y2',
      ticklen: 5,
    },
    yaxis2: {
      domain: [0, 1],
      anchor: 'x2'
    },
    autosize: true,
    font: {
      family: 'Inter',
    },
    paper_bgcolor: 'rgba(0,0,0,0)',
    showlegend: false,
    grid: {rows: 1, columns: 2, pattern: 'independent'},
  }

  return (
    <DynamicPlot
      data={plotData}
      layout={layout}
      useResizeHandler
      style={{width: '100%'}}
      config={{displayModeBar: false}}
    />
  )
}

export default NodePlot;
