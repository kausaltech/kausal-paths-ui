import { useContext } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link'
import { Button, ButtonGroup } from 'reactstrap';
import { BarChartFill, Filter, InfoSquare, Journals } from 'react-bootstrap-icons';
import { lighten } from 'polished';
import { ThemeContext } from 'styled-components';
import { getMetricValue, beautifyValue, getMetricChange } from 'common/preprocess';

// Plotly doesn't work with SSR
const DynamicPlot = dynamic(() => import('react-plotly.js'),
    { ssr: false });

const metricToPlot = (metric, segment, startYear, endYear) => {
  const plot = {x:[],y:[]};
  metric[segment].forEach((dataPoint) => {
    if(dataPoint.year <= endYear && dataPoint.year >= startYear) {
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

  const theme = useContext(ThemeContext);

  const plotColor = color || theme.graphColors.blue070;
  const shapes = [];
  const plotData = [];

  const hasImpact = impactMetric?.forecastValues.length && impactMetric.forecastValues.find((dataPoint) => dataPoint.value !== 0);

  const baselineForecast = metricToPlot(metric, "baselineForecastValues", startYear, endYear);
  const historical = metricToPlot(metric, "historicalValues", startYear, endYear);
  const forecast = metricToPlot(metric, "forecastValues", startYear, endYear);

  plotData.push(
    {
      x: historical.x,
      y: historical.y,
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

  if (!isAction) {
    plotData.push(
      {
        x: baselineForecast.x,
        y: baselineForecast.y,
        xaxis: 'x2',
        yaxis: 'y1',
        mode: 'lines',
        name: 'pohjaennuste',
        type: 'scatter',
        line: {
          color: theme.graphColors.grey030,
          shape: 'spline',
          width: '3',
          dash: 'dash',
        },
        smoothing: true,
      }
    )
  }

  if (hasImpact) {
    const impact = metricToPlot(metric, "forecastValues", startYear, endYear);

    impact.y.map((dataPoint, index) => {
      impact.y[index] = impact.y[index]-impactMetric.forecastValues[index].value;
    });
  
    plotData.push(
      {
        x: impact.x,
        y: impact.y,
        xaxis: 'x2',
        yaxis: 'y1',
        mode: 'lines',
        name: 'ei toimenpidettä',
        type: 'scatter',
        line: {
          color: lighten(0.25, plotColor),
          shape: 'spline',
          width: '3',
          dash: 'dash',
        },
        smoothing: true,
      }
    )
  }

    //forecastValues.unshift(historicalValues[historicalValues.length-1]);
    //forecastDates.unshift(historicalDates[historicalDates.length-1]);

  plotData.push(
    {
      x: forecast.x,
      y: forecast.y,
      xaxis: 'x2',
      yaxis: 'y1',
      marker: {size: 8},
      name: 'skenaario',
      type: 'scatter',
      line: {
        color: hasImpact || isAction ? theme.graphColors.green050 : lighten(0.25, plotColor),
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
    showlegend: true,
    legend: {
      x: 1,
      xanchor: 'right',
      y: 1
    },
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
