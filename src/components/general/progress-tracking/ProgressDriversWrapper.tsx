import { Fade, Spinner } from 'reactstrap';
import GraphQLError from '@/components/common/GraphQLError';
import { GET_NODE_VISUALIZATIONS } from '@/queries/getNodeVisualizations';
import styled from 'styled-components';
import { DesiredOutcome, type GetNodeVisualizationsQuery } from '@/common/__generated__/graphql';
import { StyledCard } from './StyledCard';
import { useQuery } from '@apollo/client';
import { useSite } from '@/context/site';
import { getProgressTrackingScenario } from '@/utils/progress-tracking';
import { ProgressDriversVisualization } from './ProgressDriversVisualization';
import { useTranslation } from '@/common/i18n';

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
  const site = useSite();
  const { t } = useTranslation();
  const progressTrackingScenario = getProgressTrackingScenario(site.scenarios);
  const observedYears = progressTrackingScenario?.actualHistoricalYears ?? [];

  const { loading, error, data } = useQuery<GetNodeVisualizationsQuery>(GET_NODE_VISUALIZATIONS, {
    variables: { nodeId, scenarios: ['default', 'progress_tracking'] },
  });

  if (loading) {
    return (
      <StyledSpinnerContainer>
        <Spinner style={{ width: '3rem', height: '3rem' }} />
      </StyledSpinnerContainer>
    );
  }

  if (error) {
    return <GraphQLError error={error} />;
  }

  const metricDim = data?.node?.metricDim;
  const visualizations = data?.node?.visualizations;

  if ((!metricDim && !visualizations?.length) || !observedYears.length) {
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
