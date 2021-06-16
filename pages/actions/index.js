import Head from 'next/head';
import Link from 'next/link';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useQuery, useReactiveVar } from "@apollo/client";
import _ from 'lodash';
import * as Icon from 'react-bootstrap-icons';
import { Spinner, Container, Row, Col, Badge } from 'reactstrap';
import styled from 'styled-components';
import { summarizeYearlyValues, beautifyValue } from 'common/preprocess';
import { activeScenarioVar } from 'common/cache';
import { GET_ACTION_LIST } from 'common/queries/getActionList';
import Layout from 'components/Layout';
import DashCard from 'components/general/DashCard';
import ActionParameters from 'components/general/ActionParameters';
import SettingsPanel from 'components/general/SettingsPanel';

const HeaderSection = styled.div`
  padding: 3rem 0 1rem; 
  background-color: ${(props) => props.theme.graphColors.grey020};
`;

const PageHeader = styled.div` 
  margin-bottom: 1rem;

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
  color: ${(props) => props.isActive ? props.theme.graphColors.grey090 : props.theme.graphColors.grey050 };

  .card {
    background-color: ${(props) => props.isActive ? props.theme.themeColors.white : props.theme.graphColors.grey005 };
  }
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

export default function ActionsPage() {
  const { t } = useTranslation();
  const { loading, error, data, refetch } = useQuery(GET_ACTION_LIST);
  const activeScenario = useReactiveVar(activeScenarioVar);
  /*
  useEffect(() => {
    if(networkStatus === NetworkStatus.refetch) console.log("let's refetch!");
  }, [networkStatus]);
  */

  const handleParamChange = () => {
    refetch();
  };

  if (loading) {
    return <Layout><Spinner className="m-5" style={{ width: '3rem', height: '3rem' }} /></Layout>;
  } else if (error) {
    return <Layout><div>{ t('error-loading-data') }</div></Layout>;
  };

  const unit = `kt CO<sub>2</sub>e${t('abbr-per-annum')}`;

  return (
    <Layout>
      <Head>
        <title>{t('actions')}</title>
      </Head>
      <HeaderSection>
        <Container>
          <PageHeader>
            <h1>{t('actions-available')}: {activeScenario?.name}</h1>
          </PageHeader>
        </Container>
      </HeaderSection>
      <Container className="mb-5">
        <Row>
          <Col>
          <ActionList>
            { data?.actions?.map((action) => (
              <ActionItem
                key={action.id}
                isActive={action.parameters.find((param) => param.__typename == 'BoolParameterType')?.boolValue}
              >
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
                      <ActionCategory><Badge>Category</Badge></ActionCategory>
                    </CardHeader>
                    <CardDetails>
                      <div>
                      {action.description && (
                        <div dangerouslySetInnerHTML={{__html: action.description}} />
                      )}
                      <ActionState>
                        <ActionParameters
                          parameters={action.parameters}
                          handleParamChange={handleParamChange}
                        />
                      </ActionState>
                      </div>
                      {action.impactMetric && (
                        <ActionImpact>
                          <ActionImpactUnit>{t('action-impact')}</ActionImpactUnit>
                          <ActionImpactFigure>{beautifyValue(summarizeYearlyValues(action.impactMetric.forecastValues))}</ActionImpactFigure>
                          <ActionImpactUnit dangerouslySetInnerHTML={{ __html: unit }} />
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
      <SettingsPanel
        defaultYearRange={[2018,2030]}
      />
    </Layout>
  )
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}
