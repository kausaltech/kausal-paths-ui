import { useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { gql, useQuery, useReactiveVar } from '@apollo/client';
import { Container, Row, Col } from 'reactstrap';
import styled from 'styled-components';
import { activeScenarioVar, settingsVar, yearRangeVar } from 'common/cache';
import Layout from 'components/Layout';
import SettingsPanel from 'components/general/SettingsPanel';
import NodePlot from 'components/general/NodePlot';
import DashCard from 'components/general/DashCard';
import NodeLinks from 'components/general/NodeLinks';
import ContentLoader from 'components/common/ContentLoader';

const HeaderSection = styled.div`
  padding: 1rem 0 1rem;
  margin-bottom: 8rem;
  background-color: ${(props) => props.theme.graphColors.grey070};
`;

const PageHeader = styled.div` 
  margin-bottom: 2rem;

  h1 {
    font-size: 1.5rem;
    color: ${(props) => props.theme.themeColors.dark};
  }
`;

const HeaderCard = styled.div` 
  margin: 3rem 0 -8rem;
  padding: 2rem;
  border-radius: 1rem;
  background-color: ${(props) => props.theme.themeColors.white};
`;

const ActionDescription = styled.div`
  margin-bottom: 2rem;
  font-size: 1.15rem;
`;

const ContentWrapper = styled.div`
  padding: 1rem;
  margin: .5rem 0;
  background-color: ${(props) => props.theme.graphColors.grey005};
  border-radius: 10px;

  .x2sstick text, .xtick text {
    text-anchor: end !important;
  }
`;

const GET_NODE_PAGE_CONTENT = gql`
query GetNodePage($node: ID!) {
  node(id: $node) {
    id
    name
    shortDescription
    body
    color
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
  const { slug } = router.query;
  // const { t } = useTranslation();
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
    return <Layout><div>{error}</div></Layout>;
  }

  const { node } = data;

  return (
    <Layout>
      <Head>
        <title>{node.name}</title>
      </Head>
      <HeaderSection>
        <Container>
          <PageHeader>
            <HeaderCard>
              <h1>
                {node.name}
              </h1>
              <ActionDescription dangerouslySetInnerHTML={{ __html: node.shortDescription }} />
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
                />
              </ContentWrapper>
              )}
            </HeaderCard>
          </PageHeader>
        </Container>
      </HeaderSection>
      <Container>
        <NodeLinks
          outputNodes={node.outputNodes}
          inputNodes={node.inputNodes}
        />
      </Container>
      { node.body && (
      <Container>
        <Row>
          <Col md={{ size: 8, offset: 2 }}>
            <DashCard>
              <div dangerouslySetInnerHTML={{ __html: node.body }} />
            </DashCard>
          </Col>
        </Row>
      </Container>
      )}
      <SettingsPanel
        defaultYearRange={[settingsVar().latestMetricYear, settingsVar().maxYear]}
      />
    </Layout>
  );
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}
