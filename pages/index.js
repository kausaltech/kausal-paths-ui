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
    path
    name
    cards {
      id
      name
      metrics {
        id
        name
        historicalValues {
          year
          value
        }
        forecastValues {
          year
          value
        }
      }
      upstreamCards {
        id
      }
      downstreamCards {
        id
      }
    }
  }
}
`;
export default function Home() {
  const { loading, error, data } = useQuery(GET_PAGE_CONTENT);
  let displayData = undefined;

  if (loading) {
    return <Spinner style={{ width: '3rem', height: '3rem' }} />
  }
  if (error) {
    console.log(error);
  }
  if (data) {
    displayData = data;
  }

  const mainCard = displayData.page.cards?.find((card) => card.downstreamCards?.length === 0);

  return (
    <Layout>
      <Head>
        <title>Kausal Paths</title>
      </Head>
      <Container fluid className="mt-4">
        <h1>{displayData.page.name}</h1>
        <Row>
          <Col>
            <EmissionsCard
              date="2030"
              unit="kt CO₂e"
              card={mainCard}
              state="active"
            ></EmissionsCard>
            <EmissionsCardSet
              cards={displayData.page.cards?.filter((card) => card.downstreamCards.length > 0)}
            />
          </Col>
        </Row>
      </Container>
    </Layout>
  )
}

Home.getInitialProps = async () => ({
  namespacesRequired: ['common'],
})
