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
  padding: 6rem 0 10rem; 
  background-color: ${(props) => props.theme.graphColors.blue070};
`;

const PageHeader = styled.div` 
  margin-bottom: 1rem;

  h1 {
    text-align: center;
    font-size: 2rem;
    color: ${(props) => props.theme.themeColors.white};
  }
`;

const ActiveScenario = styled.span`
  display: inline-block;
  padding: .5rem;
  margin-left: 1rem;
  border-radius: 8px;
  background-color: ${(props) => props.theme.brandDark};
  font-size: 1.2rem;
  font-weight: 700;
  vertical-align: middle;
`;

const ActionList = styled.ul`
  margin: -8rem 0 2rem;
  padding: 0;
  list-style: none;
`;

const DisplaySelector = styled.div`
  text-align: right;
  margin-bottom: 2rem;
  h6 {
    color: ${(props) => props.theme.themeColors.white};
  }
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
              {t('actions')}
              :
              <ActiveScenario>
                {activeScenario?.name}
              </ActiveScenario>
            </h1>
          </PageHeader>
        </Container>
      </HeaderSection>
      <Container className="mb-5">
        <Row>
          <Col>
            <ActionList>
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
              { data?.actions?.map((action) => (
                <ActionListCard
                  key={action.id}
                  action={action}
                  displayType={displayType}
                  displayYears={yearRange}
                  level={action.decisionLevel}
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
