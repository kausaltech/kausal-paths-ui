'use client';

import { useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';

import { Card, CardContent, Container } from '@mui/material';

import { type TypedDocumentNode, gql } from '@apollo/client';
import { useQuery, useReactiveVar } from '@apollo/client/react';

import { logApolloError } from '@common/logging/apollo';
import styled from '@common/themes/styled';

import type {
  NodePageQuery,
  NodePageQueryVariables,
  OutcomeNodeFieldsFragment,
} from '@/common/__generated__/graphql';
import { activeScenarioVar, yearRangeVar } from '@/common/cache';
import { useTranslation } from '@/common/i18n';
import { ActionLink } from '@/common/links';
import ContentLoader from '@/components/common/ContentLoader';
import ErrorMessage from '@/components/common/ErrorMessage';
import GraphQLError from '@/components/common/GraphQLError';
import Loader from '@/components/common/Loader';
import Icon from '@/components/common/icon';
import DimensionalNodeVisualisation from '@/components/general/DimensionalNodeVisualisation';
import NodeLinks from '@/components/general/NodeLinks';
import ScenarioPanel from '@/components/scenario/ScenarioPanel';
import dimensionalNodePlotFragment from '@/queries/dimensionalNodePlot';

const HeaderSection = styled.div<{ $color?: string }>`
  padding: 1rem 0 1rem;
  background-color: ${(props) => props.$color || props.theme.graphColors.grey070};
`;

const PageHeader = styled.div`
  margin: 1rem 02rem;

  h1 {
    font-size: 2rem;
    margin-bottom: 1.5rem;
    color: ${(props) => props.theme.themeColors.dark};
  }
`;

const NodeDescription = styled.div`
  margin-bottom: 1rem;
  max-width: 720px;
`;

const HeaderCard = styled.div`
  margin: 1rem 0 0;
  padding: 2rem;
  border-radius: ${(props) => props.theme.cardBorderRadius};
  background-color: ${(props) => props.theme.themeColors.white};
`;

const NodeBodyText = styled.div`
  margin-bottom: 2rem;
`;

const ContentWrapper = styled.div`
  position: relative;
  padding: 1.5rem;
  margin: 0.5rem 0;
  background-color: ${({ theme }) => theme.cardBackground.secondary};
  border-radius: ${(props) => props.theme.cardBorderRadius};

  .x2sstick text,
  .xtick text {
    text-anchor: end !important;
  }
`;

const BodyText = styled.div`
  padding: 1rem;
`;

const GET_NODE_PAGE_CONTENT: TypedDocumentNode<NodePageQuery, NodePageQueryVariables> = gql`
  query NodePage($node: ID!, $scenarios: [String!]) {
    activeScenario {
      id
    }
    node(id: $node) {
      id
      name
      shortDescription
      description
      color
      unit {
        id
        htmlShort
      }
      quantity
      inputNodes {
        id
        name
        shortDescription
        color
        unit {
          id
          htmlShort
        }
        quantity
      }
      outputNodes {
        id
        name
        shortDescription
        color
        unit {
          id
          htmlShort
        }
        quantity
      }
      ...DimensionalNodeMetric
    }
  }
  ${dimensionalNodePlotFragment}
`;

export default function NodePage() {
  const params = useParams<{ slug: string }>();
  const { t } = useTranslation();
  const slug = params.slug;
  const yearRange = useReactiveVar(yearRangeVar);
  const activeScenario = useReactiveVar(activeScenarioVar);

  // Scenario and parameter mutations refetch all active queries, including this one
  const { loading, error, data, refetch } = useQuery(GET_NODE_PAGE_CONTENT, {
    variables: {
      node: slug,
      scenarios: null,
    },
  });

  // SSR runs this query without the user's session, so the hydrated data can be
  // for the default scenario. ScenarioSelector then corrects activeScenarioVar
  // without refetching, so refetch here when the data's scenario disagrees.
  // Mutations already refetch (the query is loading by the time they update the var).
  // Refetch at most once per scenario so a lagging backend can't cause a loop.
  const dataScenarioId = data?.activeScenario.id;
  const refetchedForScenarioRef = useRef<string | null>(null);
  useEffect(() => {
    const scenarioId = activeScenario?.id;
    if (loading || !dataScenarioId || !scenarioId || dataScenarioId === scenarioId) return;
    if (refetchedForScenarioRef.current === scenarioId) return;
    refetchedForScenarioRef.current = scenarioId;
    void refetch();
  }, [loading, dataScenarioId, activeScenario?.id, refetch]);

  // Full-page loader only on initial load; refetches keep the page mounted
  if (loading && !data) {
    return <ContentLoader fullPage />;
  }
  if (error || !data) {
    if (error) {
      logApolloError(error);
    }
    return <Container className="pt-5">{error && <GraphQLError error={error} />}</Container>;
  }

  const { node } = data;
  if (!node) {
    return (
      <Container className="pt-5">
        <ErrorMessage message={t('page-not-found')} />
      </Container>
    );
  }

  return (
    <>
      <HeaderSection $color={node.color || undefined}>
        <Container fixed maxWidth="xl">
          <PageHeader>
            <ScenarioPanel />
            <HeaderCard>
              <div>{node.__typename === 'ActionNode' && <span>{t('action')}</span>}</div>
              <h1>{node.name}</h1>
              {node.shortDescription && (
                <NodeDescription>
                  <div dangerouslySetInnerHTML={{ __html: node.shortDescription }} />
                </NodeDescription>
              )}
              <div>
                {node.__typename === 'ActionNode' && (
                  <ActionLink action={node}>
                    {t('action-impact')} <Icon name="arrowRight" />
                  </ActionLink>
                )}
              </div>
              {node.metricDim && (
                <ContentWrapper>
                  {loading && <Loader />}
                  <DimensionalNodeVisualisation
                    title={node.name}
                    key={node.id}
                    metric={node.metricDim}
                    startYear={yearRange[0]}
                    endYear={yearRange[1]}
                    color={node.color}
                  />
                </ContentWrapper>
              )}
            </HeaderCard>
          </PageHeader>
        </Container>
      </HeaderSection>
      {node.description && (
        <NodeBodyText>
          <Container fixed maxWidth="xl">
            <Card>
              <CardContent>
                <BodyText dangerouslySetInnerHTML={{ __html: node.description }} />
              </CardContent>
            </Card>
          </Container>
        </NodeBodyText>
      )}
      <Container fixed maxWidth="xl">
        <NodeLinks
          outputNodes={node.outputNodes as unknown as OutcomeNodeFieldsFragment[]}
          inputNodes={node.inputNodes as unknown as OutcomeNodeFieldsFragment[]}
        />
      </Container>
    </>
  );
}
