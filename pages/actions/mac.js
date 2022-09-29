import { useState, useEffect, useContext } from 'react';
import { useQuery, useReactiveVar } from '@apollo/client';
import styled, { useTheme } from 'styled-components';

import { activeScenarioVar, yearRangeVar, settingsVar } from 'common/cache';
import { Container, Row, Col, ButtonGroup, Button } from 'reactstrap';
import { useTranslation } from 'next-i18next';
import { useSite } from 'context/site';
import { GET_ACTION_EFFICIENCY } from 'common/queries/getActionEfficiency';

import Layout from 'components/Layout';
import SettingsPanel from 'components/general/SettingsPanel';
import MacGraph from 'components/graphs/MacGraph';
import ContentLoader from 'components/common/ContentLoader';
import ActionsSubNav from 'components/general/ActionsSubNav';

const MOCK_DATA = {
  actions: [
    'Low-energy lamps',
    'Pressure-controlled fans',
    'Adjustment ventilation system',
    'Sneak-flushing luminaires',
    'Presence controlled LED',
    'Replacement thermostats/valves + adjustment heating system',
    'Wind insulation 300mm',
    'Painting/sealing windows/doors',
    'New entrance/basement doors',
    'Heat exchanger wastewater',
    'IMD hot water',
    'FVP COP 3.0',
    'FTX 85 %',
    'Additional insulation windows',
    'Facade insulation 100mm',
    'Window replacement (U = 1.0)',
    ],  
  netcost:  [
    -3.08,
    -2.71,
    -2.11,
    -2.01,
    -1.78,
    -1.75,
    -1.71,
    -1.36,
    -1.35,
    -1.19,
    -1.19,
    -0.5,
    -0.19,
    -0.16,
    2.02,
    2.27,
    ],  
    energySaving: [
    10.400000,
    41.600000,
    52.000000,
    62.400000,
    10.400000,
    135.200000,
    36.400000,
    20.800000,
    26.000000,
    52.000000,
    52.000000,
    166.400000,
    78.000000,
    78.000000,
    43.680000,
    31.200000,
    ], 
};

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

const GraphCard = styled.div` 
  margin: -8rem 0 3rem;
  padding: 2rem;
  border-radius:  ${(props) => props.theme.cardBorderRadius};
  background-color: ${(props) => props.theme.themeColors.white};
  box-shadow: 3px 3px 12px rgba(33,33,33,0.15);
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

function MacPage(props) {
  const { page, activeScenario: queryActiveScenario } = props;
  const { t } = useTranslation();
  const theme = useTheme();
  const site = useSite();
  const { loading, error, data, refetch } = useQuery(GET_ACTION_EFFICIENCY);
  const activeScenario = useReactiveVar(activeScenarioVar);
  const yearRange = useReactiveVar(yearRangeVar);

  useEffect(() => {
    refetch();
  }, [activeScenario]);

  if (loading) {
    return <Layout><ContentLoader /></Layout>;
  } if (error) {
    return <Layout><div>{ t('error-loading-data') }</div></Layout>;
  }

  // console.log(data);

  /* trying to sort actions by cost, but... */
  const actionData = data?.actionEfficiencyPairs[0].actions.map((action) => {
    return {
      id: action.action.id,
      name: action.action.name,
      cost: action.cumulativeCost,
      efficiency: action.cumulativeEfficiency,
      impact: action.cumulativeImpact,
    }
  }).sort((a,b) => a.efficiency - b.efficiency);

  const actionNames = actionData.map((action) => action.name);
  const netcosts = actionData.map((action) => action.cost);
  const impacts = actionData.map((action) => action.impact);
  const efficiencies = actionData.map((action) => action.efficiency);
  const actionIds = actionData.map((action) => action.id);

  const macData = {
    actions: actionNames,
    netcost: netcosts,
    efficiency: efficiencies,
    impact: impacts,
  };

  const efficiencyUnit = data.actionEfficiencyPairs[0].efficiencyUnit.short;

  const impactName = data.actionEfficiencyPairs[0].impactNode.name; 
  const impactUnit = data.actionEfficiencyPairs[0].impactNode.unit.short; 

  const costName = data.actionEfficiencyPairs[0].costNode.name;
  const costUnit = data.actionEfficiencyPairs[0].costNode.unit.short; 

  return (
  <Layout>
    <HeaderSection>
      <Container>
        <PageHeader>
          <h1>
            {t('actions')}
            {' '}
          </h1>
          <ActionsSubNav active="mac"/>
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
          <GraphCard>
            <MacGraph
              data={macData}
              actions={data?.actions}
              impactName={`${impactName} impact`}
              impactUnit={impactUnit}
              efficiencyName={`${costName} efficiency`}
              efficiencyUnit={efficiencyUnit}
              actionIds={actionIds}
            />
          </GraphCard>
        </Col>
      </Row>
    </Container>
    <SettingsPanel
      defaultYearRange={[settingsVar().latestMetricYear, settingsVar().maxYear]}
    />
  </Layout>
  )
}

export default MacPage