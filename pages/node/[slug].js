import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { gql, useQuery } from '@apollo/client';
import * as Icon from 'react-bootstrap-icons';
import _ from 'lodash';
import { Spinner, Container, Row, Col, ButtonGroup, Button } from 'reactstrap';
import styled from 'styled-components';
import { getMetricValue, beautifyValue } from 'common/preprocess';
import Layout from 'components/Layout';
import NodePlot from 'components/general/NodePlot';
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
  margin-bottom: 1rem;
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
query GetPageContent($node: ID!) {
  node(id: $node) {
    id
    name
    description
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
      description
      color	
      unit {
        htmlShort
      }
      quantity
      isAction
    }
    outputNodes {
      id
      name
      description
      color	
      unit {
        htmlShort
      }
      quantity
      isAction
    }
  }
}
`;

const getNode = (nodes, nodeId) => nodes.find((node) => node.id === nodeId);

const CausalCard = (props) => {
  const { node, index } = props;

  const [actionValue, setActionValue] = useState('on');
  // emission_factor file-x
  // action journal-check
  // emission    patch-exclamation cloud-fog

  return (
    <ActionLinks>
      { index !== 0 && (
      <Causality>
        <Icon.ArrowDown
          size={36}
          color="#999999"
        />
      </Causality>
      )}
      <NodeCard className={`${node.isAction && 'action'} ${node.quantity}`}>
        <DashCard>
          { node.isAction && <Icon.Journals size={24} className="mb-3" /> }
          { node.quantity === 'emission_factor' && <Icon.ClipboardX size={24} className="mb-3" /> }
          { node.quantity === 'emissions' && <Icon.CloudFog size={24} className="mb-3" /> }
          <h4>{node.name}</h4>
          <p>{node.description}</p>
          <p>
            <strong>{beautifyValue(getMetricValue(node, 2030))}</strong>
            {' '}
            <span dangerouslySetInnerHTML={{ __html: node.unit?.htmlShort }} />
          </p>

          { node.isAction && (
            <ButtonGroup size="sm">
              <Button color="primary" onClick={() => setActionValue('on')} active={actionValue === 'on'}>Toteutetaan</Button>
              <Button color="primary" onClick={() => setActionValue('off')} active={actionValue === 'off'}>Ei toteuteta</Button>
            </ButtonGroup>
          )}
        </DashCard>
      </NodeCard>
    </ActionLinks>
  );
};
export default function ActionPage() {
  const router = useRouter();
  const { slug } = router.query;

  const { loading, error, data } = useQuery(GET_PAGE_CONTENT, {
    variables: {
      node: slug,
    },
  });

  if (loading) {
    return <Layout><Spinner className="m-5" style={{ width: '3rem', height: '3rem' }} /></Layout>;
  }
  if (error) {
    return <Layout><div>{error}</div></Layout>;
  }

  const { node } = data;

  return (
    <Layout>
      <Head>
        <title>{node.name}</title>
      </Head>
      <HeaderSection>
        <Container>
          <PageHeader>
            <h1>
              {node.name}
            </h1>
            <p>
              {node.description}
            </p>
            <NodePlot
              metric={node.metric}
              year="2021"
              startYear="2010"
              endYear="2030"
              color={node.color}
            />
          </PageHeader>
        </Container>
      </HeaderSection>
      <Container>
        { node.inputNodes.length > 0 && (
        <>
          <h2>Tähän vaikuttaa</h2>
          <ul>
            { node.inputNodes.map((inputNode, index) => (
              <li key={inputNode.id}>
                <Link href={`/${inputNode.isAction ? 'actions' : 'node'}/${inputNode.id}`}>
                  <a>
                    { inputNode.name }
                  </a>
                </Link>
              </li>
            ))}
          </ul>
        </>
        )}
        { node.outputNodes.length > 0 && (
        <>
          <h2>Tämä vaikuttaa</h2>
          <ul>
            { node.outputNodes.map((outputNode, index) => (
              <li key={outputNode.id}><Link href={`/node/${outputNode.id}`}><a>{ outputNode.name }</a></Link></li>
            ))}
          </ul>
        </>
        )}
      </Container>
    </Layout>
  );
}

ActionPage.getInitialProps = async ({ query }) => ({
  slug: query.slug,
  namespacesRequired: ['common'],
});
