import { useQuery } from '@apollo/client';
import { Fade, Spinner } from 'reactstrap';
import GraphQLError from '@/components/common/GraphQLError';
import { GET_NODE_VISUALIZATIONS } from '@/queries/getNodeVisualizations';
import styled, { useTheme } from 'styled-components';
import type { GetNodeVisualizationsQuery } from '@/common/__generated__/graphql';
import { StyledCard } from './StyledCard';
import { useSite } from '@/context/site';
import { getProgressTrackingScenario } from '@/utils/progress-tracking';
import { ProgressDriversVisualization } from './ProgressDriversVisualization';

const VisualizationContainer = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spaces.s200};
`;

const StyledGroupTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizeMd};
  margin-bottom: ${({ theme }) => theme.spaces.s050};
`;

const StyledChartTitle = styled.h4`
  font-size: ${({ theme }) => theme.fontSizeBase};
  margin-bottom: ${({ theme }) => theme.spaces.s050};
`;

const StyledSpinnerContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: ${({ theme }) => theme.spaces.s400};
`;

interface Props {
  nodeId: string;
}

export function ProgressDriversWrapper({ nodeId }: Props) {
  const site = useSite();
  const theme = useTheme();
  const progressTrackingScenario = getProgressTrackingScenario(site.scenarios);
  const observedYears = progressTrackingScenario?.actualHistoricalYears ?? [];
  const yearRange = [observedYears[0], observedYears[observedYears.length - 1]];

  const { loading, error, data } = useQuery<GetNodeVisualizationsQuery>(GET_NODE_VISUALIZATIONS, {
    variables: { nodeId },
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

  if (!data?.node?.visualizations?.length || !observedYears.length) {
    return null;
  }

  console.log('🌝D🌝A🌝T🌝A🌝', data);

  return (
    <Fade>
      <VisualizationContainer>
        {data.node.visualizations.map((viz, i) => (
          <div key={i}>
            {viz.label && <StyledGroupTitle>{viz.label}</StyledGroupTitle>}

            <StyledCard>
              {viz.__typename === 'VisualizationGroup' &&
                viz.children?.map((child, ii) => (
                  <div key={ii}>
                    {child.label && <StyledChartTitle>{child.label}</StyledChartTitle>}
                    {child.__typename === 'VisualizationNodeOutput' && child.metricDim && (
                      <ProgressDriversVisualization
                        metric={child.metricDim}
                        desiredOutcome={child.desiredOutcome}
                      />
                    )}
                  </div>
                ))}
            </StyledCard>
          </div>
        ))}
      </VisualizationContainer>
    </Fade>
  );
}
