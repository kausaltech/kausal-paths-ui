import { useEffect } from 'react';

import { useQuery } from '@apollo/client';
import styled from '@emotion/styled';
import { CircularProgress } from '@mui/material';
import { Fade } from 'reactstrap';

import { DesiredOutcome, type GetNodeVisualizationsQuery } from '@/common/__generated__/graphql';
import { useTranslation } from '@/common/i18n';
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

export function ProgressDriversWrapper({ nodeId }: Props) {
  const { t } = useTranslation();
  const [siteContext, setSiteContext] = useSiteWithSetter();

  const { loading, error, data } = useQuery<GetNodeVisualizationsQuery>(GET_NODE_VISUALIZATIONS, {
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

  return (
    <Fade>
      <VisualizationContainer>
        {!!metricDim && (
          <StyledCard>
            <ProgressDriversVisualization
              title={`${metricDim.name} (${metricDim.unit.short})`}
              metric={metricDim}
              desiredOutcome={DesiredOutcome.Decreasing}
              forceObservedValues
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
                            title={
                              child.label
                                ? `${child.label} ${
                                    child.metricDim.unit.short
                                      ? /* TODO: Remove this translation when the backend label is updated */
                                        `(${t(child.metricDim.unit.short as any)})`
                                      : ''
                                  }`
                                : undefined
                            }
                            metric={child.metricDim}
                            desiredOutcome={child.desiredOutcome}
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
