import { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Button, ButtonGroup } from 'reactstrap';
import { BarChartFill, InfoSquare } from 'react-bootstrap-icons';
import styled from 'styled-components';
import { getMetricValue, beautifyValue, getMetricChange } from 'common/preprocess';
import HighlightValue from 'components/general/HighlightValue';
import EmissionsGraph from 'components/general/EmissionsGraph';

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
      <ContentWrapper>
        <EmissionsGraph
          sector={sector}
          subSectors={subSectors}
          color={color}
          year={year}
          startYear={startYear}
          endYear={endYear}
        />
      </ContentWrapper>
      )}
      { activeTabId === 'info' && (
      <ContentWrapper>
        <TabText>
          {sector.node.shortDescription && (
          <div dangerouslySetInnerHTML={{ __html: action.shortDescription }} />
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
