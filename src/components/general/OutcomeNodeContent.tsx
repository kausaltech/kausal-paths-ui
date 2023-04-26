import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { Button, ButtonGroup, Nav, NavItem, NavLink,  } from 'reactstrap';
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
import { OutcomeNodeFieldsFragment } from 'common/__generated__/graphql';

const ContentWrapper = styled.div`
  min-height: 300px;
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

const ActionsList = styled.ul`
  font-size: 0.9rem;
`;

const ActionsListItem = styled.li`
  padding: 0;
`;

type OutcomeNodeContentProps = {
  node: OutcomeNodeFieldsFragment,
  subNodes: OutcomeNodeFieldsFragment[],
  color?: string | null,
  startYear: number,
  endYear: number,
}

const OutcomeNodeContent = (props: OutcomeNodeContentProps) => {
  const { node, subNodes, color, startYear, endYear } = props;
  const { t } = useTranslation();
  const [activeTabId, setActiveTabId] = useState('graph');

  const nodesTotal = getMetricValue(node, endYear);
  const nodesBase = getMetricValue(node, startYear);
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

  useEffect(() => console.log('node changed'), [node]);
  useEffect(() => console.log('subNodes changed'), [subNodes]);
  const lastMeasuredYear = 2020;
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
                Recorded: {startYear}–{lastMeasuredYear}
                {` | `}
                Custom scenario: {lastMeasuredYear}–{endYear}
            </CardSetDescriptionDetails>
          </CardSetDescription>
        </div>
        <CardSetSummary>
          <HighlightValue
            className="figure"
            displayValue={beautifyValue(nodesTotal)}
            header={`Total ${endYear}`}
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
      <Nav tabs className="justify-content-start">
      <NavItem>
        <NavLink
          href="#"
          onClick={() => setActiveTabId('graph')}
          active={activeTabId === 'graph'}
        >
          Graph
        </NavLink>
      </NavItem>
      <NavItem>
        <NavLink
          href="#" onClick={() => setActiveTabId('table')}
          active={activeTabId === 'table'}
        >
          Table
        </NavLink>
      </NavItem>
      <NavItem>
        <NavLink
          href="#" onClick={() => setActiveTabId('info')}
          active={activeTabId === 'info'}
        >
          Details
        </NavLink>
      </NavItem>
    </Nav>

      { activeTabId === 'graph' && (
      <ContentWrapper>{outcomeGraph}</ContentWrapper>
      )}
      { activeTabId === 'info' && (
      <ContentWrapper>
        <TabText>
          {node.shortDescription && (
          <div dangerouslySetInnerHTML={{ __html: node.shortDescription }} />
          )}
          <p>
            <NodeLink node={node}>
              <a>
                {t('read-more')}
              </a>
            </NodeLink>
          </p>
          { node.upstreamActions.length > 0 && (
          <h5>
            { t('actions-influencing-this') }
          </h5>
          )}
          <ActionsList>
            { node.upstreamActions.map((action) => (
              <ActionsListItem key={action.id}>
                <ActionLink action={action}>
                  <a>
                    {action.name}
                  </a>
                </ActionLink>
              </ActionsListItem>
            ))}
          </ActionsList>
        </TabText>
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
      </CardContent>
    </div>
  );
};

export default OutcomeNodeContent;
