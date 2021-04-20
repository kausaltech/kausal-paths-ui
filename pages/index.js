import { useState } from 'react';
import Head from 'next/head';
import { gql, useQuery, useMutation } from "@apollo/client";
import { Spinner, Container, Row, Col, ButtonGroup, Button } from 'reactstrap';
import styled from 'styled-components';
import Layout from 'components/Layout';
import EmissionsCard from 'components/general/EmissionsCard';
import EmissionsCardSet from 'components/general/EmissionsCardSet';

const PageHeader = styled.div` 
  margin-bottom: 2rem;
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
        <title>Kausal Paths</title>
      </Head>
      <Container fluid className="mt-4">
        <PageHeader>
          <h1>{data?.page.name}</h1>
          <ButtonGroup>
            <Button size="sm" color="primary" onClick={() => setActiveYear(baseYear)} active={activeYear === baseYear}>{baseYear}</Button>
            <Button size="sm" color="primary" disabled> - </Button>
            <Button size="sm" color="primary" onClick={() => setActiveYear(currentYear)} active={activeYear === currentYear}>{currentYear}</Button>
            <Button size="sm" color="primary" disabled> - </Button>
            <Button size="sm" color="primary" onClick={() => setActiveYear(targetYear)} active={activeYear === targetYear}>{targetYear}</Button>
          </ButtonGroup>
        </PageHeader>
        <Row>
          <Col>
            <EmissionsCard
              date={activeYear}
              unit={unit}
              sector={rootSector}
              subSectors={subSectors}
              state="active"
              onHover={()=>undefined}
            />
          </Col>
        </Row>
        <EmissionsCardSet
          sectors={data.page.emissionSectors}
          rootSector={rootSector.id}
          unit={unit}
          date={activeYear}
        />
      </Container>
    </Layout>
  )
}

Home.getInitialProps = async () => ({
  namespacesRequired: ['common'],
})
