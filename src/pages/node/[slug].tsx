import { useEffect } from 'react';

import Head from 'next/head';
import { useRouter } from 'next/router';

import { gql, useQuery, useReactiveVar } from '@apollo/client';
import styled from '@emotion/styled';
import { Card, CardContent, Container } from '@mui/material';
import { useTranslation } from 'next-i18next';

import { logApolloError } from '@common/logging/apollo';

import type { GetNodePageQuery } from '@/common/__generated__/graphql';
import { activeScenarioVar, yearRangeVar } from '@/common/cache';
import { ActionLink } from '@/common/links';
import ContentLoader from '@/components/common/ContentLoader';
import ErrorMessage from '@/components/common/ErrorMessage';
import GraphQLError from '@/components/common/GraphQLError';
import Icon from '@/components/common/icon';
import DimensionalNodeVisualisation from '@/components/general/DimensionalNodeVisualisation';
import NodeLinks from '@/components/general/NodeLinks';
import NodePlot from '@/components/general/NodePlot';
import ScenarioPanel from '@/components/scenario/ScenarioPanel';
import { useSiteWithSetter } from '@/context/site';
import dimensionalNodePlotFragment from '@/queries/dimensionalNodePlot';

const HeaderSection = styled.div<{ $color?: string }>`
  padding: 1rem 0 1rem;
  margin-bottom: 7rem;
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

const GET_NODE_PAGE_CONTENT = gql`
  query GetNodePage($node: ID!, $scenarios: [String!]) {
    node(id: $node) {
      id
      name
      shortDescription
      description
      color
      targetYearGoal
      unit {
        htmlShort
      }
      quantity
      isAction
      metric {
        name
        id
        unit {
          htmlShort
        }
        historicalValues {
          year
          value
        }
        forecastValues {
          value
          year
        }
        baselineForecastValues {
          year
          value
        }
      }
      inputNodes {
        id
        name
        shortDescription
        color
        unit {
          htmlShort
        }
        quantity
        isAction
      }
      outputNodes {
        id
        name
        shortDescription
        color
        unit {
          htmlShort
        }
        quantity
        isAction
      }
      ...DimensionalNodeMetric
    }
  }
  ${dimensionalNodePlotFragment}
`;

export default function NodePage() {
  const router = useRouter();
  const [site] = useSiteWithSetter();
  const { t } = useTranslation();
  const { slug } = router.query;
  const yearRange = useReactiveVar(yearRangeVar);

  const { loading, error, data, refetch } = useQuery<GetNodePageQuery>(GET_NODE_PAGE_CONTENT, {
    variables: {
      node: slug,
      scenarios: null,
    },
  });

  const activeScenario = useReactiveVar(activeScenarioVar);

  useEffect(() => {
    if (!activeScenario?.id) return;
    void refetch();
  }, [activeScenario?.id, refetch]);

  if (loading) {
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
      <Head>
        <title>
          {site.title} | {node.name}
        </title>
      </Head>
      <HeaderSection $color={node.color || undefined}>
        <Container fixed maxWidth="xl">
          <PageHeader>
            <ScenarioPanel />
            <HeaderCard>
              <div>{node.isAction && <span>{t('action')}</span>}</div>
              <h1>{node.name}</h1>
              {node.shortDescription && (
                <NodeDescription>
                  <div dangerouslySetInnerHTML={{ __html: node.shortDescription }} />
                </NodeDescription>
              )}
              <div>
                {node.isAction && (
                  <ActionLink action={node}>
                    <a>
                      {t('action-impact')} <Icon name="arrowRight" />
                    </a>
                  </ActionLink>
                )}
              </div>
              {node.metricDim ? (
                <ContentWrapper>
                  <DimensionalNodeVisualisation
                    title={node.name}
                    key={node.id}
                    metric={node.metricDim}
                    startYear={yearRange[0]}
                    endYear={yearRange[1]}
                    // color={node.color}
                  />
                </ContentWrapper>
              ) : (
                node.metric && (
                  <ContentWrapper>
                    <NodePlot
                      metric={node.metric}
                      impactMetric={node.impactMetric}
                      year="2021"
                      startYear={yearRange[0]}
                      endYear={yearRange[1]}
                      color={node.color}
                      isAction={node.isAction}
                      targetYearGoal={node.targetYearGoal}
                      quantity={node.quantity}
                    />
                  </ContentWrapper>
                )
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
        <NodeLinks outputNodes={node.outputNodes} inputNodes={node.inputNodes} />
      </Container>
    </>
  );
}
