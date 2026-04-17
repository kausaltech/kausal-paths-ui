import { useEffect } from 'react';

import { CircularProgress } from '@mui/material';

import { useQuery } from '@apollo/client/react';
import { Fade } from 'reactstrap';

import styled from '@common/themes/styled';

import { DesiredOutcome, type NodeVisualizationsQuery } from '@/common/__generated__/graphql';
import { type TFunction, useTranslation } from '@/common/i18n';
import GraphQLError from '@/components/common/GraphQLError';
import { useSiteWithSetter } from '@/context/site';
import { GET_NODE_VISUALIZATIONS } from '@/queries/getNodeVisualizations';
import { getProgressTrackingScenario } from '@/utils/progress-tracking';
import { ProgressDriversVisualization } from './ProgressDriversVisualization';
import { StyledCard } from './StyledCard';

const VisualizationContainer = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spaces.s100};
`;

const StyledDriversTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizeMd};
  margin-top: ${({ theme }) => theme.spaces.s100};
  margin-bottom: 0;
  color: ${({ theme }) => theme.textColor.primary};
`;

const StyledGroupTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizeBase};
  margin-bottom: ${({ theme }) => theme.spaces.s100};
  color: ${({ theme }) => theme.textColor.primary};
`;

const StyledSpinnerContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: ${({ theme }) => theme.spaces.s400};
`;

const StyledChartContainer = styled.div`
  margin-bottom: ${({ theme }) => theme.spaces.s200};
`;

interface Props {
  nodeId: string;
}

type TranslationKey = Parameters<TFunction>[0];

function getChartLabel(t: TFunction, label?: string | null, shortUnit?: string) {
  if (!label) {
    return undefined;
  }

  // TODO: Remove this translation when the backend label is updated
  if (shortUnit && t.has(shortUnit as TranslationKey)) {
    return `${label} (${t(shortUnit as TranslationKey)})`;
  }

  if (shortUnit) {
    return `${label} (${shortUnit})`;
  }

  return label;
}

export function ProgressDriversWrapper({ nodeId }: Props) {
  const { t } = useTranslation();
  const [siteContext, setSiteContext] = useSiteWithSetter();

  const { loading, error, data } = useQuery<NodeVisualizationsQuery>(GET_NODE_VISUALIZATIONS, {
    variables: { nodeId, scenarios: ['default', 'progress_tracking'] },
    notifyOnNetworkStatusChange: true,
  });

  const progressTrackingScenario = getProgressTrackingScenario(data?.scenarios ?? []);
  const observedYears = progressTrackingScenario?.actualHistoricalYears;

  /**
   * Scenario data is not updated on the client side, so we need to
   * manually update the site context when the scenario data is updated.
   */
  useEffect(() => {
    if (loading || !data || !observedYears) {
      return;
    }

    const originalObservedYears =
      getProgressTrackingScenario(siteContext.scenarios)?.actualHistoricalYears ?? [];

    /**
     * If actualHistoricalYears has changed since first load, the user has updated
     * their additional historical data. Ensure this is also updated in the site context scenarios.
     */
    if (
      originalObservedYears.length !== observedYears.length ||
      originalObservedYears.every((year) => !observedYears.includes(year))
    ) {
      setSiteContext({ ...siteContext, scenarios: data.scenarios });
    }
  }, [loading, data, observedYears, siteContext, setSiteContext]);

  if (loading) {
    return (
      <StyledSpinnerContainer>
        <CircularProgress size="3rem" />
      </StyledSpinnerContainer>
    );
  }

  if (error) {
    return <GraphQLError error={error} />;
  }

  const metricDim = data?.node?.metricDim;
  const visualizations = data?.node?.visualizations;

  if ((!metricDim && !visualizations?.length) || !observedYears?.length) {
    return null;
  }

  // Use both the global list of observed years from the progress tracking scenario
  // (which includes years with observed data across all sectors), and the years that
  // this measure has observed data for. This allows us to display the most recent calculated
  // GHG emissions for a sector even if it does not have driver data behind it.
  const latestObservedYear = [...observedYears].sort().pop();
  const measureDatapointYears = metricDim?.measureDatapointYears ?? [];
  const emissionsMeasureDatapointYears =
    latestObservedYear && !measureDatapointYears.includes(latestObservedYear)
      ? [...measureDatapointYears, latestObservedYear]
      : measureDatapointYears;

  return (
    <Fade>
      <VisualizationContainer>
        {!!metricDim && (
          <StyledCard>
            <ProgressDriversVisualization
              title={`${metricDim.name} (${metricDim.unit.short})`}
              metric={metricDim}
              desiredOutcome={DesiredOutcome.Decreasing}
              isDirectlyObserved={false}
              // If there are no visualisations, ensure we don't display calculated the emissions of any other years
              parentMeasureDatapointYears={
                visualizations ? emissionsMeasureDatapointYears : undefined
              }
            />
          </StyledCard>
        )}
        {!!visualizations && (
          <>
            <StyledDriversTitle>{t('emission-drivers')}</StyledDriversTitle>

            {visualizations.map((viz, i) => (
              <StyledCard key={i}>
                {viz.label && <StyledGroupTitle>{viz.label}</StyledGroupTitle>}
                {viz.__typename === 'VisualizationGroup' &&
                  viz.children?.map(
                    (child, ii) =>
                      child.__typename === 'VisualizationNodeOutput' &&
                      child.metricDim && (
                        <StyledChartContainer key={ii}>
                          <ProgressDriversVisualization
                            key={`${loading}`}
                            title={getChartLabel(t, child.label, child.metricDim.unit.short)}
                            metric={child.metricDim}
                            desiredOutcome={child.desiredOutcome}
                            isDirectlyObserved={true}
                            parentMeasureDatapointYears={emissionsMeasureDatapointYears}
                          />
                        </StyledChartContainer>
                      )
                  )}
              </StyledCard>
            ))}
          </>
        )}
      </VisualizationContainer>
    </Fade>
  );
}
