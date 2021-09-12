import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useQuery, useReactiveVar } from '@apollo/client';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { config } from '@react-spring/web';
import useScrollTo from 'react-spring-scroll-to-hook';
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
  background: ${(props) => props.theme.brandDark};
  background: linear-gradient(180deg, ${(props) => props.theme.brandDark} 0%, ${(props) => props.theme.brandDark} 100%);
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
  border-radius: calc(${(props) => props.theme.cardBorderRadius}/2);
  background-color: ${(props) => props.theme.brandDark};
  color: ${(props) => props.theme.themeColors.white};
  font-size: 1.2rem;
  font-weight: 700;
  vertical-align: middle;
`;

const findVisibleSectors = (allSectors, lastSectorId, visibleSectors = []) => {
  // Using last active sector Id, create an array of all visible sectors
  const lastSector = allSectors.find((sector) => sector.id === lastSectorId);
  visibleSectors.unshift(lastSector);
  if (lastSector.parent !== null) findVisibleSectors(allSectors, lastSector.parent.id, visibleSectors);
  return visibleSectors;
};

export default function Home() {
  const { loading, error, data, refetch } = useQuery(GET_HOME_PAGE);

  const { t } = useTranslation();
  const yearRange = useReactiveVar(yearRangeVar);
  const activeScenario = useReactiveVar(activeScenarioVar);
  const router = useRouter();
  const [lastActiveSectorId, setLastActiveSectorId] = useState(router.query.sector || undefined);

  useEffect(() => {
    refetch();
  }, [activeScenario]);

  useEffect(() => {
    router.push({
      pathname: '/',
      query: { sector: lastActiveSectorId },
    },
    undefined, { shallow: true });
  }, [lastActiveSectorId]);

  if (loading) {
    return <Layout><ContentLoader /></Layout>;
  }
  if (error) {
    return <div>{error}</div>;
  }
  // console.log(data?.page.emissionSectors);
  const rootSector = data?.page.emissionSectors.find((sector) => sector.parent === null);
  const visibleSectors = findVisibleSectors(data?.page.emissionSectors, lastActiveSectorId || rootSector.id);
  // console.log(visibleSectors);

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
      <HeaderSection>
        <Container>
          <PageHeader>
            <h1>
              {t('emission-forecast')}
              {' '}
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
      <Container>
        <EmissionsSection className="mx-md-4">
          { visibleSectors.map((sector, index) => (
            <EmissionsCardSet
              key={sector.id}
              sectors={data.page.emissionSectors}
              rootSector={sector}
              date={yearRange[1]}
              startYear={yearRange[0]}
              endYear={yearRange[1]}
              parentColor="#666"
              activeSectorId={index < visibleSectors.length - 1 ? visibleSectors[index + 1].id : undefined}
              lastActiveSectorId={lastActiveSectorId}
              setLastActiveSectorId={setLastActiveSectorId}
            />
          ))}
        </EmissionsSection>
      </Container>
      <SettingsPanel
        defaultYearRange={[settingsVar().minYear, settingsVar().maxYear]}
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
