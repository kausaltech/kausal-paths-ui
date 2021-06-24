import { useEffect } from 'react';
import Head from 'next/head';
import { useQuery, useReactiveVar } from '@apollo/client';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'react-i18next';
import { Container } from 'reactstrap';
import styled from 'styled-components';
import { GET_ACTION_CONTENT } from 'common/queries/getActionContent';
import { yearRangeVar, activeScenarioVar, settingsVar } from 'common/cache';
import Layout from 'components/Layout';
import SettingsPanel from 'components/general/SettingsPanel';
import CausalGrid from 'components/general/CausalGrid';
import NodePlot from 'components/general/NodePlot';
import ActionParameters from 'components/general/ActionParameters';
import ContentLoader from 'components/common/ContentLoader';

const HeaderSection = styled.div`
  padding: 3rem 0 1rem;
  margin-bottom: 4rem;
  background-color: ${(props) => props.theme.graphColors.blue070};
`;

const HeaderCard = styled.div` 
  margin: 1rem 0 -8rem;
  padding: 2rem;
  border-radius: 1rem;
  background-color: ${(props) => props.theme.themeColors.white};
`;

const ActionDescription = styled.div`
  margin-bottom: 2rem;
  font-size: 1.15rem;
`;

const PageHeader = styled.div` 
  margin-bottom: 2rem;

  h1 {
    margin-bottom: 2rem;
    font-size: 1.5rem;
    color: ${(props) => props.theme.themeColors.dark};
  }
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

export default function ActionPage() {
  const router = useRouter();
  const { slug } = router.query;
  const { t } = useTranslation();
  const yearRange = useReactiveVar(yearRangeVar);
  const activeScenario = useReactiveVar(activeScenarioVar);

  const { loading, error, data, refetch } = useQuery(GET_ACTION_CONTENT, {
    fetchPolicy: 'no-cache',
    variables: {
      node: slug,
    },
  });

  useEffect(() => {
    refetch();
  }, [activeScenario]);

  if (loading) {
    return <Layout><ContentLoader /></Layout>;
  }
  if (error) {
    return <Layout><div>{error}</div></Layout>;
  }

  const action = data.node;
  const causalNodes = data.node.descendantNodes;

  // actionTree.filter((node) => node.inputNodes.find((input) => input.id === parentId));

  return (
    <Layout>
      <Head>
        <title>{action.name}</title>
      </Head>
      <HeaderSection>
        <Container>
          <PageHeader>
            <HeaderCard>
              <h1>
                <Link href="/actions">
                  <a>
                    { t('actions') }
                  </a>
                </Link>
                {' '}
                /
                {' '}
                {action.name}
              </h1>
              <ActionDescription dangerouslySetInnerHTML={{ __html: action.description }} />
              <ActionParameters
                parameters={action.parameters}
              />
              { action.metric && (
              <ContentWrapper>
                <NodePlot
                  metric={action.metric}
                  impactMetric={action.impactMetric}
                  year="2021"
                  startYear={yearRange[0]}
                  endYear={yearRange[1]}
                  color={action.color}
                  isAction={action.isAction}
                />
              </ContentWrapper>
              )}
            </HeaderCard>
          </PageHeader>
        </Container>
      </HeaderSection>
      <CausalGrid
        nodes={causalNodes}
        yearRange={yearRange}
      />
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
