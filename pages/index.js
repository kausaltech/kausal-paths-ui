import { useEffect } from 'react';
import Head from 'next/head';
import { useQuery, useReactiveVar } from '@apollo/client';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'react-i18next';
import { Container } from 'reactstrap';
import styled from 'styled-components';
import Layout from 'components/Layout';
import { GET_HOME_PAGE } from 'common/queries/getHomePage';
import SettingsPanel from 'components/general/SettingsPanel';
import EmissionsCardSet from 'components/general/EmissionsCardSet';
import { yearRangeVar, activeScenarioVar, settingsVar } from 'common/cache';
import ContentLoader from 'components/common/ContentLoader';
import FrontPageHeader from 'components/general/FrontPageHeader';

const HeaderSection = styled.div`
  padding: 3rem 0 10rem; 
  background-color: ${(props) => props.theme.graphColors.blue070};
`;

const PageHeader = styled.div` 
  margin: 1rem 0 2rem;

  h1 {
    font-size: 2rem;
    color: ${(props) => props.theme.themeColors.white};
  }
`;

const EmissionsSection = styled.div`
  margin-top: -10rem;
`;

const ActiveScenario = styled.span`
  display: inline-block;
  padding: .5rem;
  margin-left: 1rem;
  border-radius: 8px;
  background-color: ${(props) => props.theme.brandDark};
  color: ${(props) => props.theme.themeColors.white};
  font-size: 1.2rem;
  font-weight: 700;
  vertical-align: middle;
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
    return <Layout><ContentLoader /></Layout>;
  }
  if (error) {
    return <div>{error}</div>;
  }

  const rootSector = data?.page.emissionSectors.find((sector) => sector.parent === null);

  return (
    <Layout>
      <Head>
        <title>
          {settingsVar().siteTitle}
          {' '}
          |
          {' '}
          {data?.page.name}
        </title>
      </Head>
      <FrontPageHeader
        leadTitle={data.instance.leadTitle}
        leadParagraph={data.instance.leadParagraph}
      />
      <HeaderSection>
        <Container>
          <PageHeader>
            <h1>
              {t('emission-forecast')}
              <ActiveScenario>
                {t('scenario')}
                :
                {' '}
                {activeScenario?.name}
              </ActiveScenario>
            </h1>
          </PageHeader>
        </Container>
      </HeaderSection>
      <Container fluid>
        <EmissionsSection className="mx-md-4">
          <EmissionsCardSet
            sectors={data.page.emissionSectors}
            rootSector={rootSector}
            date={yearRange[1]}
            startYear={yearRange[0]}
            endYear={yearRange[1]}
            parentColor="#666"
          />
        </EmissionsSection>
      </Container>
      <SettingsPanel
        defaultYearRange={[settingsVar().baseYear, settingsVar().maxYear]}
        useBase
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
