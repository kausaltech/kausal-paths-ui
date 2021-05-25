import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { gql, useQuery, useMutation } from "@apollo/client";
import _ from 'lodash';
import * as Icon from 'react-bootstrap-icons';
import { Spinner, Container, Row, Col, ButtonGroup, Button } from 'reactstrap';
import styled from 'styled-components';
import Layout from 'components/Layout';
import DashCard from 'components/general/DashCard';

const HeaderSection = styled.div`
  padding: 3rem 0 1rem; 
  background-color: ${(props) => props.theme.graphColors.grey020};
`;

const PageHeader = styled.div` 
  margin-bottom: 2rem;

  h1 {
    font-size: 1rem;
    color: ${(props) => props.theme.themeColors.dark};
  }
`;

const ActionList = styled.ul`
  margin: 1rem 0;
  list-style: none;
`;

const ActionItem = styled.li`
  margin-bottom: 1rem;
`;

const CardContent = styled.div`
  display: flex;
  padding: .5rem;
`;

const GET_PAGE_CONTENT = gql`
{
  nodes{
    id
    name
    color
    unit {
      htmlShort
    }
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
export default function ActionsPage() {
  const { loading, error, data } = useQuery(GET_PAGE_CONTENT);

  const [activeYear, setActiveYear] = useState(2030);
  const [activeSector, setActiveSector] = useState(undefined);

  if (loading) {
    return <Layout><Spinner className="m-5" style={{ width: '3rem', height: '3rem' }} /></Layout>
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
          <ActionList>
            { actions?.map((action) => (
              <ActionItem key={action.id}>
                <DashCard>
                  <CardContent>
                    <Icon.JournalCheck size={24} className="mr-3" /> 
                    <Link href={`/actions/${action.id}`}>
                      <a>
                        <h5>
                        {action.name}
                        </h5>
                      </a>
                    </Link>
                  </CardContent>
                </DashCard>
              </ActionItem>
            ))}
          </ActionList>
          </Col>
        </Row>
      </Container>
    </Layout>
  )
}

ActionsPage.getInitialProps = async ({ query }) => ({
  namespacesRequired: ['common'],
});
