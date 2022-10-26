import { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'next-i18next';
import { useQuery, useReactiveVar } from '@apollo/client';
import { Container, Row, Col } from 'reactstrap';
import styled, { useTheme } from 'styled-components';

import { activeScenarioVar, yearRangeVar, settingsVar } from 'common/cache';
import { useSite } from 'context/site';
import { GET_ACTION_LIST } from 'common/queries/getActionList';
import GraphQLError from 'components/common/GraphQLError';
import ActionListCard from 'components/general/ActionListCard';
import SettingsPanel from 'components/general/SettingsPanel';
import FrontPageHeader from 'components/general/FrontPageHeader';
import ContentLoader from 'components/common/ContentLoader';
import ActionsSubNav from 'components/general/ActionsSubNav';

const HeaderSection = styled.div`
  padding: 4rem 0 10rem; 
  background-color: ${(props) => props.theme.graphColors.blue070};
`;

const PageHeader = styled.div` 
  h1 {
    margin-bottom: 2rem;
    font-size: 2rem;
    color: ${(props) => props.theme.themeColors.white};
  }
`;

const ActiveScenario = styled.div`
  clear: both;
  padding: .75rem;
  border-radius:  ${(props) => props.theme.cardBorderRadius};
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

const DISPLAY_YEARLY = 'displayTypeYearly';
const DISPLAY_CUMULATIVE = 'displayTypeCumulative';

export default function ActionListPage(props) {
  const { page, activeScenario: queryActiveScenario } = props;
  const { t } = useTranslation();
  const theme = useTheme();
  const site = useSite();
  const { loading, error, data, refetch } = useQuery(GET_ACTION_LIST);
  const activeScenario = useReactiveVar(activeScenarioVar);
  const yearRange = useReactiveVar(yearRangeVar);
  const [displayType, setDisplayType] = useState(DISPLAY_YEARLY);
  useEffect(() => {
    refetch();
  }, [activeScenario]);

  if (loading) {
    return <ContentLoader />;
  } if (error) {
    return <Container className="pt-5"><GraphQLError errors={error} /></Container>
  }

  return (
    <>
      { (page.actionListLeadTitle?.length > 10 || page.actionListLeadParagraph?.length > 10) && (
        <FrontPageHeader
          leadTitle={page?.actionListLeadTitle}
          leadParagraph={page?.actionListLeadParagraph}
          backgroundColor={theme.graphColors.blue070}
        />
      )}
      <HeaderSection>
        <Container>
          <PageHeader>
            <h1>
              {t('actions')}
              {' '}
            </h1>
            { data.actionEfficiencyPairs.length ? (
              <ActionsSubNav active="list"/>
            ) : null}
            <ActiveScenario>
              {t('scenario')}
              :
              {' '}
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
    </>
  );
}
