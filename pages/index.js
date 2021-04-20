import Head from 'next/head';
import { gql, useQuery, useMutation } from "@apollo/client";
import { Spinner, Container, Row, Col } from 'reactstrap';
// import { useTranslation } from '../i18n';
import Layout from 'components/Layout';
import EmissionsCard from 'components/general/EmissionsCard';
import EmissionsCardSet from 'components/general/EmissionsCardSet';

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
  const observationYear = 2030;

  if (loading) {
    return <Spinner style={{ width: '3rem', height: '3rem' }} />
  }
  if (error) {
    return <div>{error}</div>
  }

  const rootSector = data?.page.emissionSectors.find((sector) => sector.parent === null);
  const subSectors = data?.page.emissionSectors.filter((sector) => sector.parent?.id === rootSector.id);

  return (
    <Layout>
      <Head>
        <title>Kausal Paths</title>
      </Head>
      <Container fluid className="mt-4">
        <h1>{data?.page.name}</h1>
        <Row>
          <Col>
            <EmissionsCard
              date={observationYear}
              unit="kt CO₂e"
              sector={rootSector}
              subSectors={subSectors}
              state="active"
            ></EmissionsCard>
          </Col>
        </Row>
      </Container>
    </Layout>
  )
}

Home.getInitialProps = async () => ({
  namespacesRequired: ['common'],
})
