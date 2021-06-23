import { useState, useEffect } from 'react';
import Head from 'next/head';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useQuery, useReactiveVar } from '@apollo/client';
import { Container, Row, Col, ButtonGroup, Button } from 'reactstrap';
import styled from 'styled-components';
import { activeScenarioVar, yearRangeVar, settingsVar } from 'common/cache';
import { GET_ACTION_LIST } from 'common/queries/getActionList';
import Layout from 'components/Layout';
import ActionListCard from 'components/general/ActionListCard';
import SettingsPanel from 'components/general/SettingsPanel';
import ContentLoader from 'components/common/ContentLoader';

const HeaderSection = styled.div`
  padding: 3rem 0 1rem; 
  background-color: ${(props) => props.theme.graphColors.grey020};
`;

const PageHeader = styled.div` 
  margin-bottom: 1rem;

  h1 {
    font-size: 2rem;
    color: ${(props) => props.theme.themeColors.dark};
  }
`;

const ActionList = styled.ul`
  margin: 1rem 0;
  padding: 0;
  list-style: none;
`;

const DisplaySelector = styled.div`
  text-align: right;
`;

const TabButton = styled(Button)`
  padding-top: 0.2rem;
  padding-bottom: 0.4rem;
`;

const DISPLAY_YEARLY = 'displayTypeYearly';
const DISPLAY_CUMULATIVE = 'displayTypeCumulative';

export default function ActionsPage() {
  const { t } = useTranslation();
  const { loading, error, data, refetch } = useQuery(GET_ACTION_LIST);
  const activeScenario = useReactiveVar(activeScenarioVar);
  const yearRange = useReactiveVar(yearRangeVar);
  const [displayType, setDisplayType] = useState(DISPLAY_YEARLY);
  useEffect(() => {
    refetch();
  }, [activeScenario]);

  /*
  useEffect(() => {
    if(networkStatus === NetworkStatus.refetch) console.log("let's refetch!");
  }, [networkStatus]);
  */

  if (loading) {
    return <Layout><ContentLoader /></Layout>;
  } if (error) {
    return <Layout><div>{ t('error-loading-data') }</div></Layout>;
  }

  return (
    <Layout>
      <Head>
        <title>{t('actions')}</title>
      </Head>
      <HeaderSection>
        <Container>
          <PageHeader>
            <h1>
              {t('actions-available')}
            </h1>
            <h3>
              {activeScenario?.name}
            </h3>
            <DisplaySelector>
              <h6>{t('display-effect-on-emissions')}</h6>
              <ButtonGroup>
                <TabButton
                  color="primary"
                  onClick={() => setDisplayType(DISPLAY_YEARLY)}
                  active={displayType === DISPLAY_YEARLY}
                >
                  {t('display-yearly-effect')}
                </TabButton>
                <TabButton
                  color="primary"
                  onClick={() => setDisplayType(DISPLAY_CUMULATIVE)}
                  active={displayType === DISPLAY_CUMULATIVE}
                >
                  {t('display-cumulative-effect')}
                </TabButton>
              </ButtonGroup>
            </DisplaySelector>
          </PageHeader>
        </Container>
      </HeaderSection>
      <Container className="mb-5">
        <Row>
          <Col>
            <ActionList>
              { data?.actions?.map((action) => (
                <ActionListCard
                  key={action.id}
                  action={action}
                  displayType={displayType}
                  displayYears={yearRange}
                />
              ))}
            </ActionList>
          </Col>
        </Row>
      </Container>
      <SettingsPanel
        defaultYearRange={[settingsVar().latestMetricYear, settingsVar().maxYear]}
      />
    </Layout>
  );
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}
