import { useState, useEffect, useContext } from 'react';
import { useQuery, useReactiveVar } from '@apollo/client';
import styled, { useTheme } from 'styled-components';

import { activeScenarioVar, yearRangeVar, settingsVar } from 'common/cache';
import { Container, Row, Col, ButtonGroup, Button, FormGroup, Input, Label } from 'reactstrap';
import { SortUp, SortDown } from 'react-bootstrap-icons';
import { useTranslation } from 'next-i18next';
import { useSite } from 'context/site';
import { GET_ACTION_EFFICIENCY } from 'common/queries/getActionEfficiency';

import Layout from 'components/Layout';
import SettingsPanel from 'components/general/SettingsPanel';
import MacGraph from 'components/graphs/MacGraph';
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

const SettingsForm = styled.form`
  display: block;
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

  const [ascending, setAscending] = useState(true);
  const [sortBy, setSortBy] = useState('efficiency');
  const [activeEfficiency, setActiveEfficiency] = useState(0);
  const [actionGroup, setActionGroup] = useState('undefined');

  useEffect(() => {
    refetch();
  }, [activeScenario]);

  if (loading) {
    return <Layout><ContentLoader /></Layout>;
  } if (error) {
    return <Layout><div>{ t('error-loading-data') }</div></Layout>;
  }

  if (!data.actionEfficiencyPairs.length) {
    // FIXME: Replace with a proper error component
    return <Layout>{ t('page-not-found') }</Layout>
  }

  // console.log(data);

  const actionData = data?.actionEfficiencyPairs[activeEfficiency].actions.map((action) => {
    return {
      id: action.action.id,
      name: action.action.name,
      group: action.action.group.id,
      color: data.instance.actionGroups.find((group) => group.id === action.action.group.id).color,
      cost: action.cumulativeCost,
      efficiency: action.cumulativeEfficiency,
      impact: action.cumulativeImpact,
    }
  })
  .sort((a,b) => ascending ? a[sortBy] - b[sortBy] : b[sortBy] - a[sortBy])
  .filter((action) => actionGroup === 'undefined' || actionGroup === action.group );

  const actionNames = actionData.map((action) => action.name);
  const actionColors = actionData.map((action) => action.color);
  const actionGroups = actionData.map((action) => action.group);
  const netcosts = actionData.map((action) => action.cost);
  const impacts = actionData.map((action) => action.impact);
  const efficiencies = actionData.map((action) => action.efficiency);
  const actionIds = actionData.map((action) => action.id);

  const macData = {
    actions: actionNames,
    colors: actionColors,
    groups: actionGroups,
    cost: netcosts,
    efficiency: efficiencies,
    impact: impacts,
  };

  const efficiencyUnit = data.actionEfficiencyPairs[activeEfficiency].efficiencyUnit.short;

  const impactName = data.actionEfficiencyPairs[activeEfficiency].impactNode.name; 
  const impactUnit = data.actionEfficiencyPairs[activeEfficiency].impactNode.unit.short; 

  const costName = data.actionEfficiencyPairs[activeEfficiency].costNode.name;
  const costUnit = data.actionEfficiencyPairs[activeEfficiency].costNode.unit.short; 

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
        <SettingsForm className="text-light mt-4">
        <Row>
        <Col md={4} className="d-flex">
          <FormGroup>
            <Label for="impact">
              Impact on
            </Label>
            <Input
              id="impact"
              name="select"
              type="select"
              onChange={(e) => setActiveEfficiency(e.target.value)}
            >
              { data.actionEfficiencyPairs.map((impactGroup, indx) =>(
              <option value={indx} key={indx}>
                { impactGroup.label }
              </option>
              ))}
            </Input>
            </FormGroup>
        </Col>
        <Col md={4} className="d-flex">
          <FormGroup>
            <Label for="type">
              Type
            </Label>
            <Input
              id="type"
              name="select"
              type="select"
              onChange={(e) => setActionGroup(e.target.value)}
            >
              <option value="undefined" default>
                All
              </option>
              { data.instance.actionGroups.map((actionGroup, indx) =>(
              <option value={actionGroup.id} key={actionGroup.id}>
                { actionGroup.name }
              </option>
              ))}             
            </Input>
            </FormGroup>
        </Col>
        <Col md={4} className="d-flex">
          <div className="d-flex align-items-end me-3">
          <FormGroup>
            <Label for="sort">
              Sort
            </Label>
            <Input
              id="sort"
              name="select"
              type="select"
              onChange={(e) =>setSortBy(e.target.value)}
            >
              <option value="efficiency">
                Efficiency
              </option>
              <option value="impact">
                Impact
              </option>
              <option value="cost">
                Cost
              </option>
            </Input>
            </FormGroup>
            </div>
            <div className="d-flex align-items-end">
            <FormGroup>
            <ButtonGroup>
              <Button
                color="white"
                outline
                onClick={(e) => setAscending(true)}
                active={ascending === true}
              >
                <SortDown />
              </Button>
              <Button
                color="white"
                outline
                onClick={(e) => setAscending(false)}
                active={ascending === false}
              >
                <SortUp />
              </Button>
            </ButtonGroup>
            </FormGroup>
            </div>
        </Col>
      </Row>
      </SettingsForm>
      </Container>
    </HeaderSection>
    <Container className="mb-5">
      <Row>
        <Col>
          <GraphCard>
            <MacGraph
              data={macData}
              impactName={`${impactName} impact`}
              impactUnit={impactUnit}
              efficiencyName={`${costName} efficiency`}
              efficiencyUnit={efficiencyUnit}
              actionIds={actionIds}
              costUnit={costUnit}
              actionGroups={data.instance.actionGroups}
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