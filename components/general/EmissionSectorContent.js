import { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link'
import { useTranslation } from 'react-i18next';
import { Button, ButtonGroup, ListGroup } from 'reactstrap';
import { BarChartFill, InfoSquare, Journals } from 'react-bootstrap-icons';
import { lighten } from 'polished';
import styled from 'styled-components';
import { getMetricValue, beautifyValue, getMetricChange } from 'common/preprocess';
import HighlightValue from 'components/general/HighlightValue';

const Plot = dynamic(() => import('components/graphs/Plot'),
    { ssr: false });

const ContentWrapper = styled.div`
  padding: 1rem;
  margin: .5rem 0;
  background-color: ${(props) => props.theme.graphColors.grey005};
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
  margin: 1rem 0;
`;

const CardSetHeader = styled.div`
  display: flex;
  justify-content: space-between;
`;

const CardSetSummary = styled.div`
  display: flex;
`;

const ActionsList = styled.ul`
  padding: 0;
  margin: 0;
  list-style: none;
`;

const ActionsListItem = styled.li`
  padding: 0;
`;

const BASE_YEAR = 1990;

const EmissionsGraph = (props) => {
  const { sector, subSectors, color, year, startYear, endYear } = props;

  const shapes = [];
  const plotData = [];
  const basebarData = [];

  //const minLimit = startYear !== BASE_YEAR ? startYear : displaySectors[0].metric.historicalValues[1].year;
  const displaySectors = subSectors?.length > 1 ? subSectors : sector && [sector];
  const formatHover = (name, color, isPred) => {
    const predText = isPred ? ' <i> (enn.)</i>' : '';
    const out = {
      hovertemplate: `${name}<br />%{x}: <b>%{y:.3r} kt</b>${predText}<extra></extra>`,
      hoverlabel: {
        bgcolor: color,
      }
    };
    return out;
  }

  displaySectors?.forEach((sector, index) => {
    const historicalValues = [];
    let baseValue;
    const forecastValues = [];
    const historicalDates = [];
    const forecastDates = [];
    const fillColor = sector.color || color;

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
        line: {
          color: '#ffffff',
          width: '0.75',
        },
        stackgroup: 'group2',
        fillcolor: fillColor,
        xaxis: 'x1',
        yaxis: 'y1',
        ...formatHover(sector.name, fillColor, false),
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
        fillcolor: fillColor,
        stackgroup: 'group1',
        line: {
          color: '#ffffff',
          shape: 'spline',
          width: '0.75',
        },
        smoothing: true,
        ...formatHover(sector.name, fillColor, false),
      }
    );
    sector.metric.forecastValues.forEach((dataPoint) => {
      if(dataPoint.year <= endYear && dataPoint.year >= startYear) {
      forecastValues.push(dataPoint.value);
      forecastDates.push(dataPoint.year);
      }
    });

    const joinData = {
      y: [historicalValues[historicalValues.length-1], forecastValues[0]],
      x: [historicalDates[historicalDates.length-1], forecastDates[0]],
      xaxis: 'x2',
      yaxis: 'y1',
      name: '',
      type: 'scatter',
      fill: 'tonexty',
      fillcolor: lighten(0.2, fillColor),
      stackgroup: 'group3',
      line: {
        color: 'white',
        shape: 'spline',
        width: '0.5',
      },
      smoothing: true,
      hoverinfo: 'skip',
    };
    plotData.push(joinData);

    plotData.push(
      {
        x: forecastDates,
        y: forecastValues,
        xaxis: 'x2',
        yaxis: 'y1',
        name: `${sector.name} (pred)`,
        type: 'scatter',
        fill: 'tonexty',
        fillcolor: lighten(0.2, fillColor),
        stackgroup: 'group2',
        line: {
          color: 'white',
          shape: 'spline',
          width: '0.5',
        },
        smoothing: true,
        ...formatHover(sector.name, fillColor, true),
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
      anchor: 'x1',
    },
    xaxis2: {
      domain: [0.075, 1],
      anchor: 'y2',
      ticklen: 5,
      tickformat: 'd',
    },
    yaxis2: {
      domain: [0, 1],
      anchor: 'x2',
      type: 'date',
      dtick: 'M12',
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
    <Plot
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
  const { t } = useTranslation();
  const [activeTabId, setActiveTabId] = useState('graph');

  const sectorsTotal = getMetricValue(sector, endYear);
  const sectorsBase = getMetricValue(sector, startYear);
  const emissionsChange = getMetricChange(sectorsBase, sectorsTotal);

  const unit = `kt CO<sub>2</sub>e${t('abbr-per-annum')}`;

  return (
    <div>
      <CardSetHeader>
        <div>
        <h4>{ sector.name }</h4>
        <ButtonGroup>
          <TabButton color="light" onClick={() => setActiveTabId(activeTabId === 'graph' ? undefined : 'graph')} active={activeTabId === 'graph'}><BarChartFill /></TabButton>
          <TabButton color="light" onClick={() => setActiveTabId(activeTabId === 'info' ? undefined : 'info')} active={activeTabId === 'info'}><InfoSquare /></TabButton>
        </ButtonGroup>
        </div>
        <CardSetSummary>
          <HighlightValue
            displayValue={emissionsChange ? `${emissionsChange > 0 ? '+' : ''}${emissionsChange}%` : '-'}
            header={`${startYear}-${endYear}`}
            unit=""
          />
          <HighlightValue
            displayValue={beautifyValue(sectorsTotal)}
            header={`${endYear}`}
            unit={unit}
          />
        </CardSetSummary>
      </CardSetHeader>
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
          <ContentWrapper>
            <TabText>
              {sector.node.description && (
                <div dangerouslySetInnerHTML={{__html: action.description}} />
              )}
              { sector.node.upstreamActions.length > 0 && (
                <h6>
                  { t('actions-influencing-this') }
                </h6>
              )}
              <ActionsList>
                { sector.node.upstreamActions.map((action) => (
                  <ActionsListItem key={action.id}>
                    <Link href={`/actions/${action.id}`}>
                      <a>
                        {action.name}
                      </a>
                    </Link>
                  </ActionsListItem>
                ))}
              </ActionsList>
            </TabText>
          </ContentWrapper>
        )}

    </div>
  );
};

export default EmissionSectorContent;
