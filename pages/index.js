import { useEffect } from 'react';
import Head from 'next/head';
import { useQuery, useReactiveVar } from '@apollo/client';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'react-i18next';
import { Spinner, Container } from 'reactstrap';
import styled from 'styled-components';
import Layout from 'components/Layout';
import { GET_HOME_PAGE } from 'common/queries/getHomePage';
import SettingsPanel from 'components/general/SettingsPanel';
import EmissionsCardSet from 'components/general/EmissionsCardSet';
import { yearRangeVar, activeScenarioVar } from 'common/cache';

const HeaderSection = styled.div`
  padding: 3rem 0 0; 
`;

const PageHeader = styled.div` 
  margin-bottom: 2rem;

  h1 {
    text-align: center;
    font-size: 2rem;
    color: ${(props) => props.theme.themeColors.dark};
  }
`;

export default function Home() {
  const { loading, error, data, refetch } = useQuery(GET_HOME_PAGE);

  const { t } = useTranslation();
  const yearRange = useReactiveVar(yearRangeVar);
  const activeScenario = useReactiveVar(activeScenarioVar);

  useEffect(() => {
    refetch();
  }, [activeScenario]);

  if (loading) {
    return <Layout><Spinner className="m-5" style={{ width: '3rem', height: '3rem' }} /></Layout>;
  }
  if (error) {
    return <div>{error}</div>;
  }

  const rootSector = data?.page.emissionSectors.find((sector) => sector.parent === null);

  return (
    <Layout>
      <Head>
        <title>{data?.page.name}</title>
      </Head>
      <HeaderSection>
        <Container>
          <PageHeader>
            <h1>
              { `${t('emissions')}: ${activeScenario?.name} ` }
            </h1>
          </PageHeader>
        </Container>
      </HeaderSection>
      <Container className="my-2">
        <EmissionsCardSet
          sectors={data.page.emissionSectors}
          rootSector={rootSector}
          date={yearRange[1]}
          startYear={yearRange[0]}
          endYear={yearRange[1]}
          parentColor="#666"
        />
      </Container>
      <SettingsPanel
        defaultYearRange={yearRange}
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
