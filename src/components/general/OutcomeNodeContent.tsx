import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { Button, ButtonGroup, Nav, NavItem, NavLink, TabContent, TabPane } from 'reactstrap';
import { 
  BarChartFill as GraphIcon,
  Table as TableIcon,
  InfoSquare as DetailsIcon } from 'react-bootstrap-icons';
import styled from 'styled-components';

import { ActionLink, Link, NodeLink } from 'common/links';
import { getMetricValue, beautifyValue, getMetricChange } from 'common/preprocess';
import HighlightValue from 'components/general/HighlightValue';
import OutcomeGraph from 'components/general/OutcomeGraph';
import DataTable from './DataTable';
import OutcomeNodeDetails from './OutcomeNodeDetails';
import { OutcomeNodeFieldsFragment } from 'common/__generated__/graphql';
import ScenarioBadge from 'components/common/ScenarioBadge';
import { last } from 'lodash';

const DisplayTab = styled(NavItem)`
  font-size: 0.9rem;
`;

const ContentWrapper = styled.div`
  min-height: 300px;
  max-height: 400px;
  overflow-y: auto;
  padding: 1rem;
  background-color: white;
  border-radius: 0;
  border: 1px solid ${(props) => props.theme.graphColors.grey010};
  border-top: 0;

  .x2sstick text, .xtick text {
    text-anchor: end !important;
  }
`;

const CardContent = styled.div`
  //background-color: white;
  //padding: 0.5rem;

  .nav-pills {
    //margin-bottom: 0.5rem;
  }

  .nav-pills .nav-link {
    padding: 0.2rem 0.5rem;
    margin-right: 0.5rem;
  }

  .nav-pills .nav-link.active {
    background-color: ${(props) => props.theme.graphColors.grey050};
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
  margin-bottom: 0.5rem;

  a {
    color: ${(props) => props.theme.themeColors.dark};
  }
`;

const CardSetDescription = styled.div`
  margin-bottom: 1rem;
  h4 {
    margin-bottom: 1rem;
  }
`;

const CardSetDescriptionDetails = styled.div`
  font-size: 0.9rem;
  line-height: 1.2;
  color: ${(props) => props.theme.graphColors.grey050};
`;

const CardSetSummary = styled.div`
  display: flex;

  .figure {
    margin-left: 1rem;
  }
`;



type OutcomeNodeContentProps = {
  node: OutcomeNodeFieldsFragment,
  subNodes: OutcomeNodeFieldsFragment[],
  color?: string | null,
  startYear: number,
  endYear: number,
}

const OutcomeNodeContent = (props: OutcomeNodeContentProps) => {
  const { node, subNodes, color, startYear, endYear, activeScenario } = props;
  const { t } = useTranslation();
  const [activeTabId, setActiveTabId] = useState('graph');

  const nodesTotal = getMetricValue(node, endYear);
  const nodesBase = getMetricValue(node, startYear);
  const lastMeasuredYear = node?.metric.historicalValues[node.metric.historicalValues.length - 1].year;
  const firstForecastYear = node?.metric.forecastValues[0].year;
  const isForecast = endYear > lastMeasuredYear;
  const outcomeChange = getMetricChange(nodesBase, nodesTotal);

  // const unit = `kt CO<sub>2</sub>e${t('abbr-per-annum')}`;
  const unit = node.metric?.unit?.htmlLong || node.metric?.unit?.htmlShort;

  const outcomeGraph = useMemo(() => (
    <OutcomeGraph
      node={node}
      subNodes={subNodes}
      color={color}
      startYear={startYear}
      endYear={endYear}
    />
  ), [node, subNodes, color, startYear, endYear])

  // useEffect(() => console.log('node changed'), [node]);
  // useEffect(() => console.log('subNodes changed'), [subNodes]);

  return (
    <div>
      <CardSetHeader>
        <div>
          <CardSetDescription> 
            <h4>
              <NodeLink node={node}>
                <a>
                  { node.shortName || node.name }
                </a>
              </NodeLink>
            </h4>
            <CardSetDescriptionDetails>
                 { startYear < lastMeasuredYear && <ScenarioBadge color="neutralDark" type="recorded">{startYear}—{lastMeasuredYear} Recorded</ScenarioBadge>}
                 {' '}
                 { firstForecastYear < endYear && (
                  <ScenarioBadge color="neutralLight" type="activeScenario">
                    {Math.max(startYear, firstForecastYear)}—{endYear} Predicted: { activeScenario || 'Current'}
                  </ScenarioBadge> )}
            </CardSetDescriptionDetails>
          </CardSetDescription>
        </div>
        <CardSetSummary>
          <HighlightValue
            className="figure"
            displayValue={beautifyValue(nodesTotal)}
            header={`${ isForecast ? 'Predicted' : 'Recorded'} ${endYear}`}
            unit={unit}
          />
          <HighlightValue
            className="figure"
            displayValue={outcomeChange ? `${outcomeChange > 0 ? '+' : ''}${outcomeChange}` : '-'}
            header={`Change ${startYear}–${endYear}`}
            unit="%"
          />
        </CardSetSummary>
      </CardSetHeader>
      <CardContent>
      <Nav tabs className="justify-content-end">
      <DisplayTab>
        <NavLink
          href="#"
          onClick={() => setActiveTabId('graph')}
          active={activeTabId === 'graph'}
        >
          <GraphIcon /> Graph
        </NavLink>
      </DisplayTab>
      <DisplayTab>
        <NavLink
          href="#" onClick={() => setActiveTabId('table')}
          active={activeTabId === 'table'}
        >
          <TableIcon /> Table
        </NavLink>
      </DisplayTab>
      <DisplayTab>
        <NavLink
          href="#" onClick={() => setActiveTabId('info')}
          active={activeTabId === 'info'}
        >
          <DetailsIcon />  Details
        </NavLink>
      </DisplayTab>
    </Nav>
    <TabContent activeTab={ activeTabId}>
      { activeTabId === 'graph' && (
      <ContentWrapper>{outcomeGraph}</ContentWrapper>
      )}
      { activeTabId === 'info' && (
      <ContentWrapper>
        <OutcomeNodeDetails
          node={node}
          t={t}
        />
      </ContentWrapper>
      )}
      { activeTabId === 'table' && (
        <ContentWrapper>
          <DataTable
            node={node}
            subNodes={subNodes}
            color={color}
            startYear={startYear}
            endYear={endYear}
          />  
        </ContentWrapper>
      )}
      </TabContent>
      </CardContent>
    </div>
  );
};

export default OutcomeNodeContent;
