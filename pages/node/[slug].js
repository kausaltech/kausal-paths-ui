import { useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { gql, useQuery, useReactiveVar } from '@apollo/client';
import { Container, Row, Col } from 'reactstrap';
import styled from 'styled-components';
import { ArrowRight } from 'react-bootstrap-icons';

import { activeScenarioVar, settingsVar, yearRangeVar } from 'common/cache';
import { useSite } from 'context/site';
import { logError } from 'common/log';
import Layout from 'components/Layout';
import SettingsPanel from 'components/general/SettingsPanel';
import NodePlot from 'components/general/NodePlot';
import DashCard from 'components/general/DashCard';
import NodeLinks from 'components/general/NodeLinks';
import ContentLoader from 'components/common/ContentLoader';

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
  }
}
`;

export default function NodePage() {
  const router = useRouter();
  const site = useSite();
  const { t } = useTranslation();
  const { slug } = router.query;
  const yearRange = useReactiveVar(yearRangeVar);

  const { loading, error, data, refetch } = useQuery(GET_NODE_PAGE_CONTENT, {
    variables: {
      node: slug,
    },
  });

  const activeScenario = useReactiveVar(activeScenarioVar);

  useEffect(() => {
    refetch();
  }, [activeScenario]);

  if (loading) {
    return <Layout><ContentLoader /></Layout>;
  }
  if (error) {
    logError(error, {query: GET_NODE_PAGE_CONTENT});
    return <Layout><Container><h2 className="p-5">{t('error-loading-data')}</h2></Container></Layout>;
  }

  const { node } = data;

  return (
    <Layout>
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
        <Container>
          <PageHeader>
            <HeaderCard>
              { node.isAction && <span>Toimenpide</span> }
              <h1>
                {node.name}
              </h1>
                <NodeDescription>
                  <div dangerouslySetInnerHTML={{ __html: node.shortDescription }} />
                </NodeDescription>
                { node.isAction && (
                  <Link href={`/actions/${node.id}`}>
                    <a>
                      {t('action-impact')}
                      {' '}
                      <ArrowRight />
                    </a>
                  </Link>
                  )}
              { node.metric && (
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
              )}
            </HeaderCard>
          </PageHeader>
        </Container>
      </HeaderSection>
      { node.description && (
      <NodeBodyText>
        <Container>
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
      <Container>
        <NodeLinks
          outputNodes={node.outputNodes}
          inputNodes={node.inputNodes}
        />
      </Container>
      <SettingsPanel
        defaultYearRange={[settingsVar().minYear, settingsVar().maxYear]}
      />
    </Layout>
  );
}
