import { useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { gql, useQuery, useReactiveVar } from '@apollo/client';
import { Spinner, Container } from 'reactstrap';
import styled from 'styled-components';
import { activeScenarioVar, settingsVar } from 'common/cache';
import Layout from 'components/Layout';
import SettingsPanel from 'components/general/SettingsPanel';
import NodePlot from 'components/general/NodePlot';

const HeaderSection = styled.div`
  padding: 3rem 0 1rem; 
  background-color: ${(props) => props.theme.graphColors.grey020};
`;

const PageHeader = styled.div` 
  margin-bottom: 2rem;

  h1 {
    font-size: 1.5rem;
    color: ${(props) => props.theme.themeColors.dark};
  }
`;

const GET_NODE_PAGE_CONTENT = gql`
query GetNodePage($node: ID!) {
  node(id: $node) {
    id
    name
    shortDescription
    description
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
    return <Layout><Spinner className="m-5" style={{ width: '3rem', height: '3rem' }} /></Layout>;
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
            <h1>
              {node.name}
            </h1>
            <div dangerouslySetInnerHTML={{ __html: node.description }} />
            <NodePlot
              metric={node.metric}
              startYear={settingsVar().minYear}
              endYear={settingsVar().maxYear}
              color={node.color}
            />
          </PageHeader>
        </Container>
      </HeaderSection>
      <Container>
        { node.inputNodes.length > 0 && (
        <>
          <h2>Tähän vaikuttaa</h2>
          <ul>
            { node.inputNodes.map((inputNode, index) => (
              <li key={inputNode.id}>
                <Link href={`/${inputNode.isAction ? 'actions' : 'node'}/${inputNode.id}`}>
                  <a>
                    { inputNode.name }
                  </a>
                </Link>
              </li>
            ))}
          </ul>
        </>
        )}
        { node.outputNodes.length > 0 && (
        <>
          <h2>Tämä vaikuttaa</h2>
          <ul>
            { node.outputNodes.map((outputNode, index) => (
              <li key={outputNode.id}><Link href={`/node/${outputNode.id}`}><a>{ outputNode.name }</a></Link></li>
            ))}
          </ul>
        </>
        )}
      </Container>
      <Container>
        <div dangerouslySetInnerHTML={{ __html: node.body }} />
      </Container>
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
