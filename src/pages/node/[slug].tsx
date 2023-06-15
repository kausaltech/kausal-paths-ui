import { useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { gql, useQuery, useReactiveVar } from '@apollo/client';
import { Container, Row, Col } from 'reactstrap';
import styled from 'styled-components';
import { ArrowRight } from 'react-bootstrap-icons';

import { activeScenarioVar, yearRangeVar } from 'common/cache';
import { useSite } from 'context/site';
import { logError } from 'common/log';
import GraphQLError from 'components/common/GraphQLError';
import SettingsPanelFull from 'components/general/SettingsPanelFull';
import NodePlot from 'components/general/NodePlot';
import DashCard from 'components/general/DashCard';
import NodeLinks from 'components/general/NodeLinks';
import ContentLoader from 'components/common/ContentLoader';
import { ActionLink } from 'common/links';
import DimensionalNodePlot from 'components/general/DimensionalNodePlot';
import { GetNodePageQuery } from 'common/__generated__/graphql';
import ErrorMessage from 'components/common/ErrorMessage';

const HeaderSection = styled.div`
  padding: 1rem 0 1rem;
  margin-bottom: 7rem;
  background-color: ${(props) => props.color || props.theme.graphColors.grey070};
`;

const PageHeader = styled.div` 
  margin-bottom: 2rem;

  h1 {
    font-size: 2rem;
    margin-bottom: 1.5rem;
    color: ${(props) => props.theme.themeColors.dark};
  }
`;

const NodeDescription = styled.div`
  margin-bottom: 1rem;
  font-size: 1.25rem;
  max-width: 720px;
`;

const HeaderCard = styled.div` 
  margin: 3rem 0 -8rem;
  padding: 2rem;
  border-radius:  ${(props) => props.theme.cardBorderRadius};
  background-color: ${(props) => props.theme.themeColors.white};
`;

const NodeBodyText = styled.div`
  margin-bottom: 2rem;
`;

const ContentWrapper = styled.div`
  padding: 1.5rem;
  margin: .5rem 0;
  background-color: ${(props) => props.theme.graphColors.grey005};
  border-radius:  ${(props) => props.theme.cardBorderRadius};

  .x2sstick text, .xtick text {
    text-anchor: end !important;
  }
`;

const BodyText = styled.div`
  padding: 1rem;
`;

const GET_NODE_PAGE_CONTENT = gql`
query GetNodePage($node: ID!) {
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
${DimensionalNodePlot.fragment}
`;

export default function NodePage() {
  const router = useRouter();
  const site = useSite();
  const { t } = useTranslation();
  const { slug } = router.query;
  const yearRange = useReactiveVar(yearRangeVar);

  const { loading, error, data, refetch } = useQuery<GetNodePageQuery>(GET_NODE_PAGE_CONTENT, {
    variables: {
      node: slug,
    },
  });

  const activeScenario = useReactiveVar(activeScenarioVar);

  useEffect(() => {
    refetch();
  }, [activeScenario]);

  if (loading) {
    return <ContentLoader />;
  } if (error || !data) {
    logError(error, {query: GET_NODE_PAGE_CONTENT});
    return <Container className="pt-5"><GraphQLError errors={error} /></Container>
  }

  const { node } = data;
  if (!node) {
    return <Container className="pt-5"><ErrorMessage message={t('page-not-found')} /></Container>
  }

  return (
    <>
      <Head>
        <title>
          {site.title}
          {' '}
          |
          {' '}
          {node.name}
        </title>
      </Head>
      <HeaderSection color={node.color}>
        <Container fluid="lg">
          <PageHeader>
            <HeaderCard>
              <div>{ node.isAction && <span>{t('action')}</span> }</div>
              <h1>
                {node.name}
              </h1>
                <NodeDescription>
                  <div dangerouslySetInnerHTML={{ __html: node.shortDescription }} />
                </NodeDescription>
                <div>
                { node.isAction && (
                  <ActionLink action={node}>
                    <a>
                      {t('action-impact')}
                      {' '}
                      <ArrowRight />
                    </a>
                  </ActionLink>
                  )}
                  </div>
              { node.metricDim ? (
                <ContentWrapper>
                  <DimensionalNodePlot
                    key={node.id}
                    node={node}
                    metric={node.metricDim}
                    startYear={yearRange[0]}
                    endYear={yearRange[1]}
                    color={node.color}
                  />
                </ContentWrapper>
              ) : (node.metric && (
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
              ))}
            </HeaderCard>
          </PageHeader>
        </Container>
      </HeaderSection>
      { node.description && (
      <NodeBodyText>
        <Container fluid="lg">
          <Row>
            <Col lg={{ size: 10, offset: 1 }}>
              <DashCard>
                <BodyText dangerouslySetInnerHTML={{ __html: node.description }} />
              </DashCard>
            </Col>
          </Row>
        </Container>
      </NodeBodyText>
      )}
      <Container fluid="lg">
        <NodeLinks
          outputNodes={node.outputNodes}
          inputNodes={node.inputNodes}
        />
      </Container>
      <SettingsPanelFull />
    </>
  );
}
