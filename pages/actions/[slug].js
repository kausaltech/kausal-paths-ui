import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router'
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
  background-color: ${(props) => props.theme.graphColors.grey020};
`;

const PageHeader = styled.div` 
  margin-bottom: 2rem;

  h1 {
    font-size: 1.5rem;
    color: ${(props) => props.theme.themeColors.dark};
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
export default function ActionPage() {
  const router = useRouter();
  const { slug } = router.query;

  const { loading, error, data } = useQuery(GET_PAGE_CONTENT);

  if (loading) {
    return <Spinner style={{ width: '3rem', height: '3rem' }} />
  }
  if (error) {
    return <div>{error}</div>
  }

  const action = data?.nodes.find((node) => node.id === slug);

  return (
    <Layout>
      <Head>
        <title>{action.name}</title>
      </Head>
      <HeaderSection>
        <Container>
          <PageHeader>
            <h1>{action.name}</h1>
          </PageHeader>
        </Container>
      </HeaderSection>
    </Layout>
  )
}

ActionPage.getInitialProps = async ({ query }) => ({
  slug: query.slug,
  namespacesRequired: ['common'],
});
