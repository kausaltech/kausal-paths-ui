import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { gql, useQuery, useMutation } from "@apollo/client";
import _ from 'lodash';
import * as Icon from 'react-bootstrap-icons';
import { Spinner, Container, Row, Col, ButtonGroup, Button, Popover, UncontrolledPopover, PopoverHeader, PopoverBody, Badge } from 'reactstrap';
import styled from 'styled-components';
import { getMetricValue, beautifyValue } from 'common/preprocess';
import Layout from 'components/Layout';
import DashCard from 'components/general/DashCard';
import ParameterWidget from 'components/general/ParameterWidget';

const HeaderSection = styled.div`
  padding: 3rem 0 1rem; 
  background-color: ${(props) => props.theme.graphColors.grey020};
`;

const PageHeader = styled.div` 
  margin-bottom: 2rem;

  h1 {
    text-align: center;
    font-size: 2rem;
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

const CardHeader = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  margin-bottom: 1rem;
  border-bottom: 1px solid ${(props) => props.theme.graphColors.grey030};
`;

const ActionCategory = styled.div`
  flex: 1;
  text-align: right;
`;

const CardContent = styled.div`
  padding: .5rem;
`;

const CardDetails = styled.div`
  display: flex;
  justify-content: space-between;
`;

const ActionState = styled.div`
  
`;

const ActionImpact = styled.div`
  
`;

const ActionImpactFigure = styled.div`
  text-align: right;
  font-size: 2rem;
  line-height: 1;
`;

const ActionImpactUnit = styled.div`
  text-align: right;
  font-size: 0.75rem;
`;

const GET_PAGE_CONTENT = gql`
{
  nodes{
    id
    name
    description
    color
    unit {
      htmlShort
    }
    parameters {
      __typename
      id
      nodeRelativeId
      node {
        id
      }
      isCustomized
      ... on NumberParameterType {
        numberValue: value
        numberDefaultValue: defaultValue
        minValue
        maxValue
      }
      ... on BoolParameterType {
        boolValue: value
        boolDefaultValue: defaultValue
      }
      ... on StringParameterType {
        stringValue: value
        stringDefaultValue: defaultValue
      }
    }
    quantity
    isAction
    inputNodes {
      id
    }
    outputNodes {
      id
    }
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
`;
export default function ActionsPage() {
  const { loading, error, data } = useQuery(GET_PAGE_CONTENT);

  const [actionValue, setActionValue] = useState('on');

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
            <h1>Päästöskenaarion toimet</h1>
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
                    <CardHeader>
                      <Icon.Journals size={24} className="mr-3" /> 
                      <Link href={`/actions/${action.id}`}>
                        <a>
                          <h5>
                          {action.name}
                          </h5>
                        </a>
                      </Link>
                      <ActionCategory><Badge>Energia</Badge></ActionCategory>
                    </CardHeader>
                    <CardDetails>
                      <ActionState>

                        { action.parameters.map((parameter) => (
                          <ParameterWidget
                            key={parameter.id}
                            parameter={parameter}
                            parameterType={parameter.__typename}
                          />
                        ))}

                      </ActionState>
                      <ActionImpact>
                        <ActionImpactUnit>Päästövaikutus</ActionImpactUnit>
                        <ActionImpactFigure>{beautifyValue(getMetricValue(action, 2030))}</ActionImpactFigure>
                        <ActionImpactUnit>kt CO₂e</ActionImpactUnit>
                      </ActionImpact>
                    </CardDetails>
                    
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
