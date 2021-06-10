import { useState, useContext } from 'react';
import Head from 'next/head';
import { gql, useQuery } from '@apollo/client';
import _ from 'lodash';
import { Spinner, Container, Row, Col } from 'reactstrap';
import styled from 'styled-components';
import Layout from 'components/Layout';
import SettingsPanel from 'components/general/SettingsPanel';
import EmissionsCardSet from 'components/general/EmissionsCardSet';
import SettingsContext from 'common/settings-context';

const HeaderSection = styled.div`
  padding: 3rem 0 0; 
`;

const PageHeader = styled.div` 
  margin-bottom: 2rem;

  h1 {
    text-align: center;
    font-size: 1.5rem;
    color: ${(props) => props.theme.themeColors.dark};
  }
`;

const GET_PAGE_CONTENT = gql`
{
  page(path: "/") {
    id
    name
    ... on EmissionPageType {
      emissionSectors {
        id
        name
        color
        parent {
          id
        }
        metric {
          id
          name
          unit {
            htmlShort
          }
          forecastValues {
            year
            value
          }
          baselineForecastValues {
            year
            value
          }
          historicalValues {
            year
            value
          }
        }
      }
    }
  }
}
`;

const BASE_YEAR = 1990;
const TARGET_YEAR = 2030;
export default function Home() {
  const { loading, error, data } = useQuery(GET_PAGE_CONTENT);

  const [activeYear, setActiveYear] = useState([BASE_YEAR, TARGET_YEAR]);
  const [activeSector, setActiveSector] = useState(undefined);
  const settings = useContext(SettingsContext);

  const unit = 'kt CO₂e';

  if (loading) {
    return <Layout><Spinner className="m-5" style={{ width: '3rem', height: '3rem' }} /></Layout>;
  }
  if (error) {
    return <div>{error}</div>;
  }

  const rootSector = data?.page.emissionSectors.find((sector) => sector.parent === null);
  const subSectors = data?.page.emissionSectors.filter((sector) => sector.parent?.id === rootSector.id);

  // remove base year from years scale
  const historicalYears = _.remove(rootSector.metric.historicalValues.map((metric) => metric.year), (y) => y !== BASE_YEAR);
  const forecastYears = rootSector.metric.forecastValues.map((metric) => metric.year);

  return (
    <Layout>
      <Head>
        <title>{data?.page.name}</title>
      </Head>
      <HeaderSection>
        <Container>
          <PageHeader>
            <h1>{data?.page.name}</h1>
          </PageHeader>
        </Container>
      </HeaderSection>
      <Container className="my-2">
        <EmissionsCardSet
          sectors={data.page.emissionSectors}
          rootSector={rootSector}
          unit={unit}
          date={settings.yearRange[1]}
          startYear={settings.yearRange[0]}
          endYear={settings.yearRange[1]}
          parentColor="#666"
        />
      </Container>
      <SettingsPanel />
    </Layout>
  );
}

Home.getInitialProps = async ({ query }) => ({
  namespacesRequired: ['common'],
});
