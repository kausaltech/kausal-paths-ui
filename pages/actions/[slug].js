import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router'
import Link from 'next/link';
import { gql, useQuery } from "@apollo/client";
import * as Icon from 'react-bootstrap-icons';
import _ from 'lodash';
import { Spinner, Container, Row, Col, ButtonGroup, Button } from 'reactstrap';
import styled from 'styled-components';
import Layout from 'components/Layout';
import DashCard from 'components/general/DashCard';
import { I18nContext } from 'react-i18next';

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

const ActionLinks = styled.div`
  margin-bottom: 8rem;
`;

const NodeCard = styled.div`
  margin-bottom: 1rem;

  &.action .card {
    border:${(props) => props.theme.graphColors.grey030} 2px solid;
  }

  &.emissions .card {

  }
`;

const Causality = styled.div`
  text-align: center;
  margin: 1rem 0;
`;

const GET_PAGE_CONTENT = gql`
query GetNodeContent($node: ID!) {
  node(id: $node) {
    id
    name
    color	
    unit {
      htmlShort
    }
    quantity
    isAction
    metric {
      name
      id
      unit {
        htmlShort
      }
      historicalValues {
        year
        value
      }
      forecastValues {
        value
        year
      }
      baselineForecastValues {
        year
        value
      }
    }
    inputNodes {
      id
      name
      color	
      unit {
        htmlShort
      }
      quantity
      isAction
      metric {
        name
        id
        unit {
          htmlShort
        }
        historicalValues {
          year
          value
        }
        forecastValues {
          value
          year
        }
        baselineForecastValues {
          year
          value
        }
      }
    }
    outputNodes {
      id
      name
      color	
      unit {
        htmlShort
      }
      quantity
      isAction
      metric {
        name
        id
        unit {
          htmlShort
        }
        historicalValues {
          year
          value
        }
        forecastValues {
          value
          year
        }
        baselineForecastValues {
          year
          value
        }
      }
    }
  }
}
`;

const getNode = (nodes, nodeId) => nodes.find((node) => node.id === nodeId);

const CausalCard = (props) => {
  const { node, nodeId } = props;
  const thisNode = node;

  const [actionValue, setActionValue] = useState('on');
  // emission_factor file-x
  // action journal-check
  // emission    patch-exclamation cloud-fog

  return (
    <ActionLinks>
    <NodeCard className={`${thisNode.isAction && 'action'} ${thisNode.quantity}`}>
      <DashCard>
        { thisNode.isAction && <Icon.Journals size={24} className="mb-3" /> }
        { thisNode.quantity === 'emission_factor' && <Icon.ClipboardX size={24} className="mb-3" /> }
        { thisNode.quantity === 'emissions' && <Icon.CloudFog size={24} className="mb-3" /> }
        <h4>{thisNode.name}</h4>
        <p><strong>00</strong> <span dangerouslySetInnerHTML={{__html: thisNode.unit?.htmlShort}} /></p>

        { thisNode.isAction && (
          <ButtonGroup size="sm">
            <Button color="primary" onClick={() => setActionValue('on')} active={actionValue === 'on'}>Toteutetaan</Button>
            <Button color="primary" onClick={() => setActionValue('off')} active={actionValue === 'off'}>Ei toteuteta</Button>
          </ButtonGroup>
        )}
      </DashCard>
    </NodeCard>
    </ActionLinks>
  )
}
export default function ActionPage() {
  const router = useRouter();
  const { slug } = router.query;

  const { loading, error, data } = useQuery(GET_PAGE_CONTENT, {
    variables: {
      node: slug,
    }
  });

  if (loading) {
    return <Layout><Spinner className="m-5" style={{ width: '3rem', height: '3rem' }} /></Layout>
  }
  if (error) {
    return <Layout><div>{error}</div></Layout>
  }

  console.log(data)
  const action = data.node;

  return (
    <Layout>
      <Head>
        <title>{action.name}</title>
      </Head>
      <HeaderSection>
        <Container>
          <PageHeader>
            <h1>
              <Link href="/actions">
                <a>
                  Toimet
                </a>
              </Link>
              {' '}/{' '}
              {action.name}
            </h1>
          </PageHeader>
        </Container>
      </HeaderSection>
      <Container>
        <Row>
          <Col md={{size: 6, offset: 3}} className="py-5">
            <CausalCard
              node={action}
              nodeId={action.id}
            />

            {action.outputNodes?.map((node) =>(
            <>
              <Causality>
                <Icon.ArrowDown
                  size={36}
                  color="#999999"
                />
              </Causality>
              <CausalCard
                node={node}
              />
            </>
            ))} 
          </Col>
        </Row>
      </Container>
    </Layout>
  )
}

ActionPage.getInitialProps = async ({ query }) => ({
  slug: query.slug,
  namespacesRequired: ['common'],
});
