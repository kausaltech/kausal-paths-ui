import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { Button, ButtonGroup } from 'reactstrap';
import { BarChartFill, InfoSquare } from 'react-bootstrap-icons';
import styled from 'styled-components';

import { ActionLink, Link, NodeLink } from 'common/links';
import { getMetricValue, beautifyValue, getMetricChange } from 'common/preprocess';
import HighlightValue from 'components/general/HighlightValue';
import OutcomeGraph from 'components/general/OutcomeGraph';
import { settingsVar } from 'common/cache';

const ContentWrapper = styled.div`
  padding: 1rem;
  margin: .5rem 0;
  background-color: ${(props) => props.theme.graphColors.grey005};
  border-radius:  ${(props) => props.theme.cardBorderRadius};

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

  a {
    color: ${(props) => props.theme.themeColors.dark};
  }
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

const OutcomeNodeContent = (props) => {
  const { node, subNodes, color, startYear, endYear } = props;
  const { t } = useTranslation();
  const [activeTabId, setActiveTabId] = useState('graph');

  const nodesTotal = getMetricValue(node, endYear);
  const nodesBase = getMetricValue(node, startYear);
  const outcomeChange = getMetricChange(nodesBase, nodesTotal);

  // const unit = `kt CO<sub>2</sub>e${t('abbr-per-annum')}`;
  const unit = node.unit.htmlLong || node.unit.htmlShort;

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
  
  return (
    <div>
      <CardSetHeader>
        <div>
          <h4>
            <NodeLink node={node}>
              <a>
                { node.name }
              </a>
            </NodeLink>
          </h4>
          <ButtonGroup>
            <TabButton color="light" onClick={() => setActiveTabId(activeTabId === 'graph' ? undefined : 'graph')} active={activeTabId === 'graph'}><BarChartFill /></TabButton>
            <TabButton color="light" onClick={() => setActiveTabId(activeTabId === 'info' ? undefined : 'info')} active={activeTabId === 'info'}><InfoSquare /></TabButton>
          </ButtonGroup>
        </div>
        <CardSetSummary>
          <HighlightValue
            className="figure"
            displayValue={outcomeChange ? `${outcomeChange > 0 ? '+' : ''}${outcomeChange}%` : '-'}
            header={`${startYear}–${endYear}`}
            unit=""
          />
          <HighlightValue
            className="figure"
            displayValue={beautifyValue(nodesTotal)}
            header={`${endYear}`}
            unit={unit}
          />
        </CardSetSummary>
      </CardSetHeader>
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

    </div>
  );
};

export default OutcomeNodeContent;
