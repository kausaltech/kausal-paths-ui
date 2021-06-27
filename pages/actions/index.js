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
  padding: 4rem 0 10rem; 
  background-color: ${(props) => props.theme.graphColors.blue070};
`;

const PageHeader = styled.div` 
  margin-bottom: 1rem;
  text-align: center;
  h1 {
    font-size: 2rem;
    color: ${(props) => props.theme.themeColors.white};
  }
`;

const ActiveScenario = styled.span`
  display: inline-block;
  padding: .5rem;
  margin: 0 auto;
  border-radius: 8px;
  background-color: ${(props) => props.theme.brandDark};
  color: ${(props) => props.theme.themeColors.white};
  font-size: 1rem;
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
            </h1>
            <ActiveScenario>
              {activeScenario?.name}
            </ActiveScenario>
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
