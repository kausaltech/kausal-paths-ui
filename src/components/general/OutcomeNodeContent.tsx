import { useMemo, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { Nav, NavItem, NavLink, TabContent } from 'reactstrap';
import Icon from 'components/common/icon';
import styled from 'styled-components';
import Loader from 'components/common/Loader';

import { NodeLink } from 'common/links';
import { getMetricValue, beautifyValue, getMetricChange } from 'common/preprocess';
import HighlightValue from 'components/general/HighlightValue';
import DimensionalBarGraph from 'components/general/DimensionalBarGraph';
import DataTable from './DataTable';
import OutcomeNodeDetails from './OutcomeNodeDetails';
import type { OutcomeNodeFieldsFragment } from 'common/__generated__/graphql';
import ScenarioBadge from 'components/common/ScenarioBadge';
import { useFeatures, useInstance } from 'common/instance';
import DimensionalNodePlot from './DimensionalNodePlot';
import { ProgressIndicator } from './progress-tracking/ProgressIndicator';
import { getLatestProgressYear, hasProgressTracking } from '@/utils/progress-tracking';
import { useSite } from '@/context/site';
import PopoverTip from '../common/PopoverTip';
import { getHelpText } from './progress-tracking/utils';

const DisplayTab = styled(NavItem)`
  font-size: 0.9rem;

  .icon {
    width: 1.2rem !important;
    height: 1.2rem !important;
    margin-right: 0.2rem;
    vertical-align: middle;
  }
`;

const ContentWrapper = styled.div`
  min-height: 300px;
  max-height: 1000px;
  overflow-y: auto;
  padding: 1rem;
  background-color: white;
  border-radius: 0;
  border: 1px solid ${(props) => props.theme.graphColors.grey010};
  border-top: 0;
  &:focus {
    outline: 2px solid ${(props) => props.theme.graphColors.grey010};
  }
  .x2sstick text,
  .xtick text {
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

const TabNavigation = styled(Nav)`
  flex-wrap: nowrap;
  width: 100%;
  border-bottom: 0;
`;

const CardSetHeader = styled.div`
  display: flex;
  justify-content: space-between;
  flex-direction: column;
  margin-bottom: 0.5rem;

  a {
    color: ${(props) => props.theme.themeColors.dark};
  }

  @media (min-width: ${(props) => props.theme.breakpointMd}) {
    flex-direction: row;
  }
`;

const CardSetDescription = styled.div`
  margin-bottom: ${({ theme }) => theme.spaces.s100};
  h4 {
    margin-bottom: ${({ theme }) => theme.spaces.s050};
  }
`;

const CardSetDescriptionDetails = styled.div`
  font-size: 0.9rem;
  line-height: 1.2;
  color: ${(props) => props.theme.graphColors.grey050};
`;

const CardSetSummary = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  margin-bottom: ${(props) => props.theme.spaces.s100};
  .figure {
    margin-left: 1rem;
  }
`;

type OutcomeNodeContentProps = {
  isRootNode: boolean;
  node: OutcomeNodeFieldsFragment;
  subNodes: OutcomeNodeFieldsFragment[];
  color?: string | null;
  startYear: number;
  endYear: number;
  activeScenario: string;
  refetching: boolean;
};

const OutcomeNodeContent = ({
  isRootNode,
  node,
  subNodes,
  color,
  startYear,
  endYear,
  activeScenario,
  refetching,
}: OutcomeNodeContentProps) => {
  const { t } = useTranslation();
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const instance = useInstance();
  const site = useSite();

  const [selectedProgressYear, setSelectedProgressYear] = useState<number | null>(() =>
    getLatestProgressYear(site)
  );
  const showProgressTrackingStatus =
    node.metricDim && hasProgressTracking(node.metricDim, site.scenarios, site.minYear);

  const { showRefreshPrompt } = useFeatures();
  const [activeTabId, setActiveTabId] = useState('graph');
  const showDistribution = instance.id === 'zuerich' && subNodes.length > 1;
  const nodesTotal = getMetricValue(node, endYear);
  const nodesBase = getMetricValue(node, startYear);
  const lastMeasuredYear =
    node?.metric?.historicalValues[node.metric.historicalValues.length - 1]?.year;
  const firstForecastYear = node?.metric?.forecastValues[0]?.year;
  const isForecast = endYear > lastMeasuredYear;
  const outcomeChange = getMetricChange(nodesBase, nodesTotal);
  const unit = node.metric?.unit?.htmlLong || node.metric?.unit?.htmlShort;
  const nodeName = node.shortName || node.name;
  const showNodeLinks = !instance.features?.hideNodeDetails;
  const maximumFractionDigits = instance.features?.maximumFractionDigits ?? undefined;
  // TODO: Remove showRefreshPrompt check when node help text is moved to the backend
  const helpText = showRefreshPrompt ? getHelpText(node.id) : undefined;
  function onClickMeasuredEmissions(year: number) {
    setSelectedProgressYear(year);
    setProgressModalOpen(true);
  }

  const outcomeGraph = useMemo(
    () =>
      node.metricDim ? (
        <DimensionalNodePlot
          node={node}
          metric={node.metricDim}
          startYear={startYear}
          endYear={endYear}
          color={color}
          withControls={false}
          baselineForecast={node.metric?.baselineForecastValues ?? undefined}
          withReferenceYear
          withTools={false}
          onClickMeasuredEmissions={onClickMeasuredEmissions}
        />
      ) : (
        <h5>
          {t('time-series')}, {t('coming-soon')}
        </h5>
      ),
    [node, color, startYear, endYear]
  );

  const singleYearGraph = useMemo(
    () => (
      <div>
        <DimensionalBarGraph metric={node.metricDim!} endYear={endYear} />
      </div>
    ),
    [node, endYear, color]
  );

  return (
    <div role="tabpanel" id={`tabpanel-${node.id}`}>
      <CardSetHeader>
        <div>
          <CardSetDescription>
            <h4>
              {showNodeLinks ? (
                <NodeLink node={node}>
                  <a>{nodeName}</a>
                </NodeLink>
              ) : (
                nodeName
              )}
              {helpText && (
                <PopoverTip identifier={`${node.id}-card-help-text`} content={helpText} />
              )}
            </h4>
            <CardSetDescriptionDetails>
              {startYear <= lastMeasuredYear && (
                <ScenarioBadge startYear={startYear} endYear={lastMeasuredYear}>
                  {t('table-historical')}
                </ScenarioBadge>
              )}{' '}
              {typeof firstForecastYear === 'number' && firstForecastYear < endYear && (
                <ScenarioBadge startYear={Math.max(startYear, firstForecastYear)} endYear={endYear}>
                  {t('table-scenario-forecast')}
                  {activeScenario && ` (${activeScenario})`}
                </ScenarioBadge>
              )}
            </CardSetDescriptionDetails>
          </CardSetDescription>
        </div>
        <CardSetSummary>
          {showProgressTrackingStatus && selectedProgressYear && node.metricDim && (
            <ProgressIndicator
              color={node.color ?? undefined}
              metric={node.metricDim}
              isModalOpen={progressModalOpen}
              onModalOpenChange={setProgressModalOpen}
              selectedYear={selectedProgressYear}
              onSelectedYearChange={setSelectedProgressYear}
              showViewDetails={isRootNode}
            />
          )}
          {nodesTotal && (
            <HighlightValue
              className="figure"
              displayValue={'' + beautifyValue(nodesTotal, undefined, maximumFractionDigits)}
              header={`${
                isForecast ? t('table-scenario-forecast') : t('table-historical')
              } ${endYear}`}
              unit={unit || ''}
            />
          )}
          <HighlightValue
            className="figure"
            displayValue={outcomeChange ? `${outcomeChange > 0 ? '+' : ''}${outcomeChange}` : '-'}
            header={`${t('change-over-time')} ${startYear}–${endYear}`}
            unit="%"
          />
        </CardSetSummary>
      </CardSetHeader>
      <CardContent>
        <TabNavigation
          tabs
          className="justify-content-end"
          role="tablist"
          aria-label={t('outcome-tabs-label')}
        >
          {showDistribution && (
            <DisplayTab role="presentation">
              <NavLink
                href="#"
                onClick={() => setActiveTabId('year')}
                active={activeTabId === 'year'}
                disabled={subNodes.length < 2}
                role="tab"
                aria-selected={activeTabId === 'year'}
                aria-controls={`${node.id}-panel-year`}
                id={`${node.id}-tab-year`}
                tabIndex={0}
              >
                <Icon name="chartTreeMap" /> {t('distribution')}
              </NavLink>
            </DisplayTab>
          )}
          <DisplayTab role="presentation">
            <NavLink
              href="#"
              onClick={() => setActiveTabId('graph')}
              active={activeTabId === 'graph'}
              role="tab"
              aria-selected={activeTabId === 'graph'}
              aria-controls={`${node.id}-panel-graph`}
              id={`${node.id}-tab-graph`}
              tabIndex={0}
            >
              <Icon name="chartArea" /> {t('time-series')}
            </NavLink>
          </DisplayTab>
          <DisplayTab role="presentation">
            <NavLink
              href="#"
              onClick={() => setActiveTabId('table')}
              active={activeTabId === 'table'}
              role="tab"
              aria-selected={activeTabId === 'table'}
              aria-controls={`${node.id}-panel-table`}
              id={`${node.id}-tab-table`}
              tabIndex={0}
            >
              <Icon name="table" /> {t('table')}
            </NavLink>
          </DisplayTab>
          {showNodeLinks && (
            <DisplayTab role="presentation">
              <NavLink
                href="#"
                onClick={() => setActiveTabId('info')}
                active={activeTabId === 'info'}
                role="tab"
                aria-selected={activeTabId === 'info'}
                aria-controls={`${node.id}-panel-info`}
                id={`${node.id}-tab-info`}
                tabIndex={0}
              >
                <Icon name="circleInfo" /> {t('details')}
              </NavLink>
            </DisplayTab>
          )}
        </TabNavigation>

        {refetching && <Loader />}

        <TabContent
          activeTab={activeTabId}
          id={`${node.id}-panel-${activeTabId}`}
          role="tabpanel"
          tabIndex={0}
          aria-labelledby={`${node.id}-tab-${activeTabId}}`}
        >
          {activeTabId === 'year' && <ContentWrapper>{singleYearGraph}</ContentWrapper>}
          {activeTabId === 'graph' && <ContentWrapper>{outcomeGraph}</ContentWrapper>}
          {activeTabId === 'info' && (
            <ContentWrapper>
              <OutcomeNodeDetails node={node} t={t} />
            </ContentWrapper>
          )}
          {activeTabId === 'table' && (
            <ContentWrapper tabIndex={0}>
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
