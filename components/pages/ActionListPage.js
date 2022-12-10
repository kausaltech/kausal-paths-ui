import { useState, useEffect } from 'react';
import { useQuery, useReactiveVar } from '@apollo/client';
import styled from 'styled-components';

import { activeScenarioVar, yearRangeVar, settingsVar } from 'common/cache';
import { Container, Row, Col, ButtonGroup, Button, FormGroup, Input, Label, Alert } from 'reactstrap';
import { SortUp, SortDown } from 'react-bootstrap-icons';
import { useTranslation } from 'next-i18next';
import { GET_ACTION_LIST } from 'common/queries/getActionList';

import GraphQLError from 'components/common/GraphQLError';
import SettingsPanel from 'components/general/SettingsPanel';
import MacGraph from 'components/graphs/MacGraph';
import ContentLoader from 'components/common/ContentLoader';
import ActionsList from 'components/general/ActionsList';

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

const MacView = (props) => {
  const { actions, actionEfficiencyPairs, t, actionGroups } = props;

  // Remove actions without efficiency data
  const efficiencyActions = actions.filter((action) => action.cumulativeEfficiency);

  const macData = {
    ids: efficiencyActions.map((action) => action.id),
    actions: efficiencyActions.map((action) => action.name),
    colors: efficiencyActions.map((action) => action.color || action.group?.color),
    groups: efficiencyActions.map((action) => action.group?.id),
    cost: efficiencyActions.map((action) => action.cumulativeCost),
    efficiency: efficiencyActions.map((action) => action.cumulativeEfficiency),
    impact: efficiencyActions.map((action) => action.cumulativeImpact),
  };

  const efficiencyUnit = actionEfficiencyPairs.efficiencyUnit.short;

  const impactName = actionEfficiencyPairs.impactNode.name; 
  const impactUnit = actionEfficiencyPairs.impactNode.unit.short; 

  const costName = actionEfficiencyPairs.costNode.name;
  const costUnit = actionEfficiencyPairs.costNode.unit.short; 

  return (
    <GraphCard>
      <span>
        {t('actions-count', { count: efficiencyActions.length})}
      </span>
      <MacGraph
        data={macData}
        impactName={`${impactName} impact`}
        impactUnit={impactUnit}
        efficiencyName={`${costName} efficiency`}
        efficiencyUnit={efficiencyUnit}
        actionIds={macData.ids}
        costUnit={costUnit}
        actionGroups={actionGroups}
      />
    </GraphCard>
  )
};

function ActionListPage(props) {
  const { t } = useTranslation();
  const { loading, error, data, refetch } = useQuery(GET_ACTION_LIST);
  const activeScenario = useReactiveVar(activeScenarioVar);
  const yearRange = useReactiveVar(yearRangeVar);

  const [listType, setListType] = useState('list');
  const [ascending, setAscending] = useState(true);
  const [sortBy, setSortBy] = useState('efficiency');
  const [activeEfficiency, setActiveEfficiency] = useState(0);
  const [actionGroup, setActionGroup] = useState('undefined');

  useEffect(() => {
    refetch();
  }, [activeScenario]);

  if (loading) {
    return <ContentLoader />;
  } if (error) {
    return <Container className="pt-5"><GraphQLError errors={error} /></Container>
  }

  const hasEfficiency = data.actionEfficiencyPairs.length > 1;
  // If we have action efficiency pairs, we augment the actions with the cumulative values
  const usableActions = data.actions.map(
      (act) => {
        const efficiencyAction = hasEfficiency ? data.actionEfficiencyPairs[activeEfficiency].actions.find((a) => a.action.id === act.id) : null;
        return {
          ...act,
          cumulativeImpact: efficiencyAction ? efficiencyAction.cumulativeImpact : undefined,
          cumulativeCost: efficiencyAction ? efficiencyAction.cumulativeCost : undefined,
          cumulativeEfficiency: efficiencyAction ? efficiencyAction.cumulativeEfficiency : undefined,
        }
      });
  
  const sortActions = (a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
  
    switch (sortBy) {
      case 'impact':
        hasEfficiency ? aValue = a.cumulativeImpact : aValue = a.impactMetric.cumulativeForecastValue;
        hasEfficiency ? bValue = b.cumulativeImpact : bValue = b.impactMetric.cumulativeForecastValue;
        break;
      case 'default':
        return 0;
    };

    return hasEfficiency ?
      a.cumulativeImpact < 0 ? -1 : b.cumulativeImpact < 0 ? 0 : ascending ? aValue - bValue : bValue - aValue
      : ascending ? aValue - bValue : bValue - aValue;
  }

  const sortedActions = [...usableActions].sort(sortActions)
    .filter((action) => actionGroup === 'undefined' || actionGroup === action.group?.id );

  return (
  <>
    <HeaderSection>
      <Container>
        <PageHeader>
          <h1>
            {t('actions')}
            {' '}
          </h1>
          <ActiveScenario>
            {t('scenario')}
            :
            {' '}
            {activeScenario?.name}
          </ActiveScenario>
        </PageHeader>
        <SettingsForm className="text-light mt-4">
        { hasEfficiency && (
          <ButtonGroup
            className="my-2"
            size="sm"
          >
            <Button
              outline={listType !== 'list'}
              onClick={() => setListType('list')}
            >
              {t('actions-as-list')}
            </Button>
            <Button
              outline={listType !== 'mac'}
              onClick={() => setListType('mac')}
            >
              {t('actions-as-efficiency')}
            </Button>
          </ButtonGroup>
        )}
        <Row>
        { hasEfficiency && (
          <Col md={4} className="d-flex">
            <FormGroup>
              <Label for="impact">
              {t('actions-impact-on')}
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
        )}
        { data.instance.actionGroups.length > 1 && (
          <Col md={4} className="d-flex">
            <FormGroup>
              <Label for="type">
              {t('actions-group-type')}
              </Label>
              <Input
                id="type"
                name="select"
                type="select"
                onChange={(e) => setActionGroup(e.target.value)}
              >
                <option value="undefined" default>
                {t('action-groups-all')}
                </option>
                { data.instance.actionGroups.map((actionGroup, indx) =>(
                <option value={actionGroup.id} key={actionGroup.id}>
                  { actionGroup.name }
                </option>
                ))}             
              </Input>
              </FormGroup>
          </Col>
        )}
        <Col md={4} className="d-flex">
          <div className="d-flex align-items-end me-3">
          <FormGroup>
            <Label for="sort">
            {t('actions-sort-by')}
            </Label>
            <Input
              id="sort"
              name="select"
              type="select"
              onChange={(e) =>setSortBy(e.target.value)}
            >
              <option value="default">
                {t('actions-sort-default')}
              </option>
              { hasEfficiency && (
                <option value="efficiency">
                  {t('actions-sort-efficiency')}
                </option> )}
              <option value="impact">
                {t('actions-sort-impact')}
              </option>
              { hasEfficiency && (
                <option value="cost">
                  {t('actions-sort-cost')}
                </option> )}
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
          {listType === 'list' && (
            <ActionsList
              actions={sortedActions}
              displayType="displayTypeYearly"
              yearRange={yearRange}
            />
          )}
          {listType === 'mac' && ( 
            <MacView
              actions={sortedActions}
              actionEfficiencyPairs={data.actionEfficiencyPairs[activeEfficiency]}
              t={t}
              actionGroups={data.instance.actionGroups}
            />
          )}
        </Col>
      </Row>
    </Container>
    <SettingsPanel
      defaultYearRange={[settingsVar().latestMetricYear, settingsVar().maxYear]}
    />
  </>
  )
}

export default ActionListPage