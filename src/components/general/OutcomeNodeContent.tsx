import { useMemo, useState } from 'react';

import styled from '@emotion/styled';
import { Box, IconButton, MenuItem } from '@mui/material';
import { Menu } from '@mui/material';
import { useTranslation } from 'next-i18next';
import { ThreeDotsVertical } from 'react-bootstrap-icons';
import { TabContent } from 'reactstrap';

import type { OutcomeNodeFieldsFragment } from '@/common/__generated__/graphql';
import { useInstance } from '@/common/instance';
//import { beautifyValue, getMetricChange, getMetricValue } from '@/common/preprocess';
import Loader from '@/components/common/Loader';
import DimensionalBarGraph from '@/components/general/DimensionalBarGraph';
import { useSiteWithSetter } from '@/context/site';
import { getLatestProgressYear, hasProgressTracking } from '@/utils/progress-tracking';

import DataTable from './DataTable';
import DimensionalNodeVisualisation from './DimensionalNodeVisualisation';
import OutcomeNodeDetails from './OutcomeNodeDetails';
import { ProgressIndicator } from './progress-tracking/ProgressIndicator';

//import { getHelpText } from './progress-tracking/utils';

const ContentWrapper = styled.div`
  min-height: 300px;
  max-height: 1000px;
  overflow-y: auto;
  padding: 1rem;
  background-color: ${({ theme }) => theme.cardBackground.primary};
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

const ViewSelector = ({
  activeTabId,
  setActiveTabId,
  showDistribution,
}: {
  activeTabId: string;
  setActiveTabId: (tabId: string) => void;
  showDistribution: boolean;
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const { t } = useTranslation();
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  return (
    <Box display="flex" justifyContent="flex-end">
      <IconButton
        id="basic-button"
        aria-controls={open ? 'basic-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
      >
        <ThreeDotsVertical />
      </IconButton>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{
          list: {
            'aria-labelledby': 'basic-button',
          },
        }}
      >
        {showDistribution && (
          <MenuItem onClick={() => setActiveTabId('year')} selected={activeTabId === 'year'}>
            {t('distribution')}
          </MenuItem>
        )}
        <MenuItem onClick={() => setActiveTabId('graph')} selected={activeTabId === 'graph'}>
          {t('time-series')}
        </MenuItem>
        <MenuItem onClick={() => setActiveTabId('table')} selected={activeTabId === 'table'}>
          {' '}
          {t('table')}
        </MenuItem>
        <MenuItem onClick={() => setActiveTabId('info')} selected={activeTabId === 'info'}>
          {t('details')}
        </MenuItem>
      </Menu>
    </Box>
  );
};

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
  const instance = useInstance();
  const [site] = useSiteWithSetter();

  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [selectedProgressYear, setSelectedProgressYear] = useState<number | null>(() =>
    getLatestProgressYear(site)
  );

  const showProgressTrackingStatus =
    node.metricDim && hasProgressTracking(node.metricDim, site.scenarios, site.minYear);
  /*


  const { showRefreshPrompt } = useFeatures();
*/
  const [activeTabId, setActiveTabId] = useState('graph');
  const showDistribution = instance.id === 'zuerich' && subNodes.length > 1;
  /*
  const nodesTotal = getMetricValue(node, endYear);
  const nodesBase = getMetricValue(node, startYear);
  const lastMeasuredYear =
    node?.metric?.historicalValues[node.metric.historicalValues.length - 1]?.year;

  const firstForecastYear = node?.metric?.forecastValues[0]?.year;
  const isForecast = endYear > lastMeasuredYear;
  const outcomeChange = getMetricChange(nodesBase, nodesTotal);
  const unit = node.metric?.unit?.htmlLong || node.metric?.unit?.htmlShort;

  const showNodeLinks = !instance.features?.hideNodeDetails;
  const maximumFractionDigits = instance.features?.maximumFractionDigits ?? undefined;
  
  // TODO: Remove showRefreshPrompt check when node help text is moved to the backend
  const helpText = showRefreshPrompt ? getHelpText(node.id) : undefined;
  */
  const nodeName = node.shortName || node.name;
  function onClickMeasuredEmissions(year: number) {
    setSelectedProgressYear(year);
    setProgressModalOpen(true);
  }

  const outcomeGraph = useMemo(
    () =>
      node.metricDim ? (
        <DimensionalNodeVisualisation
          title={nodeName}
          metric={node.metricDim}
          startYear={startYear}
          endYear={endYear}
          color={color ?? undefined}
          withControls={false}
          baselineForecast={node.metric?.baselineForecastValues ?? undefined}
          withTools={false}
          onClickMeasuredEmissions={onClickMeasuredEmissions}
          forecastTitle={activeScenario}
        />
      ) : (
        <h5>
          {t('time-series')}, {t('coming-soon')}
        </h5>
      ),
    [node, startYear, endYear, nodeName, t, activeScenario, color]
  );

  const singleYearGraph = useMemo(
    () => (
      <div>
        <DimensionalBarGraph metric={node.metricDim!} endYear={endYear} />
      </div>
    ),
    [node, endYear]
  );

  return (
    <div role="tabpanel" id={`tabpanel-${node.id}`}>
      <CardContent>
        {refetching && <Loader />}
        <ContentWrapper>
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
          <ViewSelector
            activeTabId={activeTabId}
            setActiveTabId={setActiveTabId}
            showDistribution={showDistribution}
          />
          <TabContent
            activeTab={activeTabId}
            id={`${node.id}-panel-${activeTabId}`}
            role="tabpanel"
            tabIndex={0}
            aria-labelledby={`${node.id}-tab-${activeTabId}}`}
          >
            {activeTabId === 'year' && singleYearGraph}
            {activeTabId === 'graph' && outcomeGraph}
            {activeTabId === 'info' && <OutcomeNodeDetails node={node} t={t} />}
            {activeTabId === 'table' && (
              <DataTable
                node={node}
                subNodes={subNodes}
                color={color}
                startYear={startYear}
                endYear={endYear}
              />
            )}
          </TabContent>
        </ContentWrapper>
      </CardContent>
    </div>
  );
};

export default OutcomeNodeContent;
