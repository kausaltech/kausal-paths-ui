import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { gql, useQuery, NetworkStatus } from "@apollo/client";
import _ from 'lodash';
import * as Icon from 'react-bootstrap-icons';
import { Spinner, Container, Row, Col, ButtonGroup, Button, Popover, UncontrolledPopover, PopoverHeader, PopoverBody, Badge } from 'reactstrap';
import styled from 'styled-components';
import { summarizeYearlyValues, beautifyValue } from 'common/preprocess';
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

const GET_ACTION_LIST = gql`
query GetActionList {
  actions {
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
    inputNodes {
      id
    }
    outputNodes {
      id
    }
    impactMetric {
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
    }
  }
}
`;
export default function ActionsPage() {

  const { loading, error, data, refetch, networkStatus } = useQuery(GET_ACTION_LIST, {
    fetchPolicy: "no-cache"
  });

  useEffect(() => {
    console.log(networkStatus)
  }, [networkStatus]);

  let actions;
  let refetching = false;

  if (networkStatus === NetworkStatus.refetch) {
    console.log("refetching");
    refetching = true;
  }

  if (loading) {
    return <Layout><Spinner className="m-5" style={{ width: '3rem', height: '3rem' }} /></Layout>;
  } else if (error) {
    <Layout><div>Error loading data</div></Layout>;
  } else {
    actions = data?.actions
    refetching = false
    console.log(actions) };

  const onScenarioChange = (evt) => {
    refetch();
    console.log("refereshing data");
  }

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
                      <div>
                      {action.description && (
                        <div dangerouslySetInnerHTML={{__html: action.description}} />
                      )}
                      <ActionState>
                        { action.parameters.map((parameter) => (
                          <ParameterWidget
                            key={parameter.id}
                            parameter={parameter}
                            parameterType={parameter.__typename}
                            handleChange={onScenarioChange}
                          />
                        ))}
                      </ActionState>
                      </div>
                      {action.impactMetric && !refetching && (
                        <ActionImpact>
                          <ActionImpactUnit>Päästövaikutus</ActionImpactUnit>
                          <ActionImpactFigure>{beautifyValue(summarizeYearlyValues(action.impactMetric.forecastValues))}</ActionImpactFigure>
                          <ActionImpactUnit>kt CO₂e</ActionImpactUnit>
                        </ActionImpact>
                      )}
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
