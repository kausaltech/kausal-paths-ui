import { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link'
import { Button, ButtonGroup } from 'reactstrap';
import { BarChartFill, InfoSquare, Journals } from 'react-bootstrap-icons';
import { lighten } from 'polished';
import styled from 'styled-components';

// Plotly doesn't work with SSR
const DynamicPlot = dynamic(() => import('react-plotly.js'),
    { ssr: false });

const SectorContent = styled.div`
  padding: 1rem;
  margin: .5rem 0;
  border: 1px solid ${(props) => props.theme.graphColors.grey020};
  border-radius: 10px;

  .x2sstick text, .xtick text {
    text-anchor: end !important;
  }
`;

const TabButton = styled(Button)`
  padding-top: 0.2rem;
  padding-bottom: 0.4rem;
`;

const TabText = styled.div`
  max-width: 640px;
  margin-bottom: 2rem;
`;

const BASE_YEAR = 1990;

const EmissionsGraph = (props) => {
  const { sector, subSectors, color, year, startYear, endYear } = props;

  const shapes = [];
  const plotData = [];
  const basebarData = [];

  //const minLimit = startYear !== BASE_YEAR ? startYear : displaySectors[0].metric.historicalValues[1].year;
  const displaySectors = subSectors?.length > 1 ? subSectors : sector && [sector];

  displaySectors?.forEach((sector, index) => {
    const historicalValues = [];
    let baseValue;
    const forecastValues = [];
    const historicalDates = [];
    const forecastDates = [];
    sector.metric.historicalValues.forEach((dataPoint) => {
      if (dataPoint.year === BASE_YEAR) {
        baseValue = dataPoint.value;
      } else if(dataPoint.year <= endYear && dataPoint.year >= startYear){
        historicalValues.push(dataPoint.value);
        historicalDates.push(dataPoint.year);
      }
    });
    plotData.push(
      {
        x: [BASE_YEAR-1,BASE_YEAR],
        y: [baseValue, baseValue],
        name: sector.name,
        type: 'scatter',
        fill: 'tonexty',
        mode: 'none',
        stackgroup: 'group2',
        fillcolor: sector.color || color,
        xaxis: 'x1',
        yaxis: 'y1'
      }
    );
    plotData.push(
      {
        x: historicalDates,
        y: historicalValues,
        xaxis: 'x2',
        yaxis: 'y1',
        name: sector.name,
        type: 'scatter',
        fill: 'tonexty',
        mode: 'none',
        fillcolor: sector.color || color,
        stackgroup: 'group1',
        line: {
          shape: 'spline',
        },
        smoothing: true,
      }
    );
    sector.metric.forecastValues.forEach((dataPoint) => {
      if(dataPoint.year <= endYear && dataPoint.year >= startYear) {
      forecastValues.push(dataPoint.value);
      forecastDates.push(dataPoint.year);
      }
    });
    forecastValues.push(historicalValues[historicalValues.length-1]);
    forecastDates.push(historicalDates[historicalDates.length-1]);
    plotData.push(
      {
        x: forecastDates,
        y: forecastValues,
        xaxis: 'x2',
        yaxis: 'y1',
        name: `${sector.name} (pred)`,
        type: 'scatter',
        fill: 'tonexty',
        mode: 'none',
        fillcolor: lighten(0.2, sector.color || color),
        stackgroup: 'group2',
        line: {
          shape: 'spline',
        },
        smoothing: true,
      }
    )
  });

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
      r: 48,
      b: 48,
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

  // console.log('basebar', basebarData);
  // console.log('plot', plotData);
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

const EmissionSectorContent = (props) => {
  const { sector, subSectors, color, year, startYear, endYear } = props;
  const [activeTabId, setActiveTabId] = useState('graph');

  return (
    <div>
      
        { activeTabId === 'graph' && (
          <SectorContent>
            <EmissionsGraph
              sector={sector}
              subSectors={subSectors}
              color={color}
              year={year}
              startYear={startYear}
              endYear={endYear}
            />
          </SectorContent>
        )}
        { activeTabId === 'info' && (
          <SectorContent>
            <TabText>
              <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
              <h6><Journals size={24} className="mr-2" /> Päästöihin vaikuttavat toimenpiteet</h6>
              <ul>
                <li><Link href="/actions/naistenlahti3"><a>Toimenpide 1</a></Link></li>
                <li><Link href="/actions/other_renewable_district_heating"><a>Toimenpide 2</a></Link></li>
              </ul>
            </TabText>
          </SectorContent>
        )}
      <ButtonGroup>
        <TabButton color="light" onClick={() => setActiveTabId(activeTabId === 'graph' ? undefined : 'graph')} active={activeTabId === 'graph'}><BarChartFill /></TabButton>
        <TabButton color="light" onClick={() => setActiveTabId(activeTabId === 'info' ? undefined : 'info')} active={activeTabId === 'info'}><InfoSquare /></TabButton>
      </ButtonGroup> 
    </div>
  );
};

export default EmissionSectorContent;
