import { useQuery } from '@apollo/client';
import { Fade, Spinner } from 'reactstrap';
import GraphQLError from '@/components/common/GraphQLError';
import { GET_NODE_VISUALIZATIONS } from '@/queries/getNodeVisualizations';
import DimensionalNodePlot from '../DimensionalNodePlot';
import styled from 'styled-components';
import type { GetNodeVisualizationsQuery } from '@/common/__generated__/graphql';
import { StyledCard } from './StyledCard';

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

export function NodeDriversVisualization({ nodeId }: Props) {
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

  if (!data?.node?.visualizations?.length) {
    return null;
  }

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
                    {child.__typename === 'VisualizationNodeOutput' && (
                      <pre>{JSON.stringify(child, null, 2)}</pre>
                      // <DimensionalNodePlot metric={child} withControls={true} withTools={true} />
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
