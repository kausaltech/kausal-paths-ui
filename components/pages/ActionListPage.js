import { useState, useEffect } from 'react';
import { useQuery, useReactiveVar, NetworkStatus } from '@apollo/client';
import styled from 'styled-components';
import { summarizeYearlyValuesBetween } from 'common/preprocess';
import { activeScenarioVar, yearRangeVar, settingsVar } from 'common/cache';
import { Container, Row, Col, ButtonGroup, Button, FormGroup, Input, Label, Alert } from 'reactstrap';
import { SortUp, SortDown } from 'react-bootstrap-icons';
import { useTranslation } from 'next-i18next';
import { GET_ACTION_LIST } from 'common/queries/getActionList';

import GraphQLError from 'components/common/GraphQLError';
import SettingsPanel from 'components/general/SettingsPanel';
import ActionsMac from 'components/general/ActionsMac';
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

const ActionCount = styled.div`
  margin: -8rem 0 ${({ theme }) => theme.spaces.s100};
  color: ${({ theme }) => theme.themeColors.white};
`;



function ActionListPage(props) {
  const { t } = useTranslation();
  const { loading, error, data, previousData, refetch, networkStatus } = useQuery(GET_ACTION_LIST, {
    notifyOnNetworkStatusChange: true,
  });
  const activeScenario = useReactiveVar(activeScenarioVar);
  const yearRange = useReactiveVar(yearRangeVar);

  const [listType, setListType] = useState('list');
  const [ascending, setAscending] = useState(true);
  const [sortBy, setSortBy] = useState('cumulativeEfficiency');
  const [activeEfficiency, setActiveEfficiency] = useState(0);
  const [actionGroup, setActionGroup] = useState('undefined');

  const refetching = (networkStatus === NetworkStatus.refetch);

  if (loading && !previousData) {
    return <ContentLoader />;
  } if (error) {
    return <Container className="pt-5"><GraphQLError errors={error} /></Container>
  }
  
  // console.log("----------> actionListPage Props", data);

  const hasEfficiency = data.actionEfficiencyPairs.length > 0;
  // If we have action efficiency pairs, we augment the actions with the cumulative values

  // summarizeYearlyValuesBetween(efficiencyAction?.impactValues, yearRange[0], yearRange[1])
  const usableActions = data.actions.map(
      (act) => {
        const efficiencyAction = hasEfficiency ? data.actionEfficiencyPairs[activeEfficiency].actions.find((a) => a.action.id === act.id) : null;
        const efficiencyType = data.actionEfficiencyPairs[activeEfficiency];
        const cumulativeImpact = efficiencyAction 
          ? (data.actionEfficiencyPairs[activeEfficiency].invertImpact ? -1 : 1) * summarizeYearlyValuesBetween(efficiencyAction?.impactValues, yearRange[0], yearRange[1])
          : undefined;
        const cumulativeCost = efficiencyAction
          ? (data.actionEfficiencyPairs[activeEfficiency].invertCost ? -1 : 1) *summarizeYearlyValuesBetween(efficiencyAction?.costValues, yearRange[0], yearRange[1])
          : undefined;
        //const cumulativeImpact = efficiencyAction?.cumulativeImpact;
        //const cumulativeCost = efficiencyAction?.cumulativeCost;
        const cumulativeEfficiency = efficiencyAction
          ? cumulativeCost/Math.abs(cumulativeImpact)
          : undefined;

        return {
          ...act,
          cumulativeImpact: efficiencyAction ? cumulativeImpact : undefined,
          cumulativeImpactUnit: efficiencyAction?.cumulativeImpactUnit?.htmlShort,
          cumulativeImpactName: efficiencyType?.impactNode?.name,
          cumulativeCost: efficiencyAction ? cumulativeCost : undefined,
          cumulativeCostUnit: efficiencyAction?.cumulativeCostUnit.htmlShort,
          cumulativeCostName: efficiencyType?.costNode?.name,
          cumulativeEfficiency: cumulativeEfficiency,
          cumulativeEfficiencyUnit: efficiencyType?.efficiencyUnit.htmlShort,
          cumulativeEfficiencyName: efficiencyType?.label,
          efficiencyCap: efficiencyAction ? data?.actionEfficiencyPairs[activeEfficiency].plotLimitEfficiency : undefined,
        }
      }).filter((action) => actionGroup === 'undefined' || actionGroup === action.group?.id );
  
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
              { hasEfficiency && (
                <option value="cumulativeEfficiency" default>
                  {t('actions-sort-efficiency')}
                </option> )}
              <option value="cumulativeImpact" default={!hasEfficiency}>
                {t('actions-sort-impact')}
              </option>
              { hasEfficiency && (
                <option value="cumulativeCost">
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
            <>
              <ActionCount>
                {t('actions-count', { count: usableActions.length})}
              </ActionCount>
              <ActionsList
                actions={usableActions}
                displayType="displayTypeYearly"
                yearRange={yearRange}
                sortBy={sortBy}
                sortAscending={ascending}
                refetching={refetching}
              />
            </>
          )}
          {listType === 'mac' && ( 
            <ActionsMac
              actions={usableActions}
              actionEfficiencyPairs={data.actionEfficiencyPairs[activeEfficiency]}
              t={t}
              actionGroups={data.instance.actionGroups}
              sortBy={sortBy}
              sortAscending={ascending}
              refetching={refetching}
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