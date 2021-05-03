import { useState } from 'react';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import Link from 'next/link';
import { gql, useQuery, useMutation } from "@apollo/client";
import _ from 'lodash';
import { Spinner, Container, Row, Col, ButtonGroup, Button } from 'reactstrap';
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
  nodes{
    id
    name
    color
    unit
    quantity
    isAction
    inputNodes {
      id
    }
    outputNodes {
      id
    }
  }
}
`;
export default function Actions() {
  const { loading, error, data } = useQuery(GET_PAGE_CONTENT);

  const [activeYear, setActiveYear] = useState(2030);
  const [activeSector, setActiveSector] = useState(undefined);

  if (loading) {
    return <Spinner style={{ width: '3rem', height: '3rem' }} />
  }
  if (error) {
    return <div>{error}</div>
  }

  const actions = data?.nodes.filter((node) => node.isAction);

  return (
    <Layout>
      <Head>
        <title>Toimet</title>
      </Head>
      <HeaderSection>
        <Container>
          <PageHeader>
            <h1>Toimet</h1>
          </PageHeader>
        </Container>
      </HeaderSection>
      <Container className="my-5">
        <Row>
          <Col>
          <ul>
            { actions?.map((action) => (
              <li key={action.id}>
                <Link href={`/actions/${action.id}`}>
                  {action.name}
                </Link>
              </li>
            ))}
          </ul>
          </Col>
        </Row>
      </Container>
    </Layout>
  )
}

export const getStaticProps = async ({ locale }) => ({
  props: {
    ...await serverSideTranslations(locale, ['common']),
  }
})
