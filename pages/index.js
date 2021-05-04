import { useState } from 'react';
import Head from 'next/head';
import { gql, useQuery } from "@apollo/client";
import _ from 'lodash';
import { Spinner, Container, Row, Col } from 'reactstrap';
import styled from 'styled-components';
import Layout from 'components/Layout';
import EmissionsCard from 'components/general/EmissionsCard';
import EmissionsCardSet from 'components/general/EmissionsCardSet';
import RangeSelector from 'components/general/RangeSelector';

const HeaderSection = styled.div`
  padding: 3rem 0 1rem; 
  background-color: ${(props) => props.theme.graphColors.grey070};
`;

const PageHeader = styled.div` 
  margin-bottom: 2rem;

  h1 {
    font-size: 1.5rem;
    color: ${(props) => props.theme.themeColors.white};
  }
`;

const GET_PAGE_CONTENT = gql`
{
  page(path: "/") {
    id
    name
    ... on EmissionPageNode {
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
          unit
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
export default function Home() {
  const { loading, error, data } = useQuery(GET_PAGE_CONTENT);

  const [activeYear, setActiveYear] = useState(2030);
  const [activeSector, setActiveSector] = useState(undefined);

  const unit = 'kt CO₂e';

  if (loading) {
    return <Spinner style={{ width: '3rem', height: '3rem' }} />
  }
  if (error) {
    return <div>{error}</div>
  }

  const rootSector = data?.page.emissionSectors.find((sector) => sector.parent === null);
  const subSectors = data?.page.emissionSectors.filter((sector) => sector.parent?.id === rootSector.id);

  const baseYear = rootSector.metric.historicalValues[0].year;
  const currentYear = rootSector.metric.historicalValues[rootSector.metric.historicalValues.length-1].year;
  const targetYear = 2030;

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
      <Container className="my-5">
        <Row>
          <Col>
            <RangeSelector 
              historicalYears={rootSector.metric.historicalValues.map((metric) => metric.year)}
              forecastYears={rootSector.metric.forecastValues.map((metric) => metric.year)}
              handleChange={setActiveYear}
            />
            <EmissionsCard
              date={activeYear}
              unit={unit}
              sector={rootSector}
              subSectors={subSectors}
              state="root"
              active
              onHover={() => null}
              handleClick={() => null}
            />
          </Col>
        </Row>
        <EmissionsCardSet
          sectors={data.page.emissionSectors}
          rootSector={rootSector}
          unit={unit}
          date={activeYear}
          parentColor="#666"
        />
      </Container>
    </Layout>
  )
}

Home.getInitialProps = async ({ query }) => ({
  namespacesRequired: ['common'],
});
