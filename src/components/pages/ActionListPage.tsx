import { useState, useEffect, useMemo } from 'react';
import { useQuery, useReactiveVar, NetworkStatus, useSuspenseQuery_experimental } from '@apollo/client';
import styled from 'styled-components';
import { summarizeYearlyValuesBetween } from 'common/preprocess';
import { activeGoalVar, activeScenarioVar, yearRangeVar, } from 'common/cache';
import { Container, Row, Col, ButtonGroup, Button, FormGroup, Input, Label, Alert } from 'reactstrap';
import { SortUp, SortDown } from 'react-bootstrap-icons';
import { useTranslation } from 'next-i18next';
import { GET_ACTION_LIST } from 'common/queries/getActionList';

import GraphQLError from 'components/common/GraphQLError';
import SettingsPanelFull from 'components/general/SettingsPanelFull';
import ActionsMac from 'components/general/ActionsMac';
import ContentLoader from 'components/common/ContentLoader';
import ActionsList from 'components/general/ActionsList';
import { useSite } from 'context/site';
import { GetActionListQuery, GetActionListQueryVariables, GetPageQuery } from 'common/__generated__/graphql';

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
  border-radius: 0;
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

const HeaderCard = styled.div` 
  margin: ${({ theme }) => theme.spaces.s200} 0;
  padding: ${({ theme }) => theme.spaces.s100} ${({ theme }) => theme.spaces.s200};
  border-radius: 0;
  background-color: ${(props) => props.theme.themeColors.white};
`;

const Description = styled.div`
`;


export type ActionWithEfficiency = GetActionListQuery['actions'][0] & {
  cumulativeImpact?: number,
  cumulativeImpactUnit?: string,
  cumulativeImpactName?: string,
  efficiencyDivisor?: number,
  cumulativeEfficiency?: number,
  cumulativeEfficiencyUnit?: string,
  cumulativeEfficiencyName?: string
  cumulativeCost?: number,
  cumulativeCostUnit?: string,
  cumulativeCostName?: string,
  efficiencyCap?: number,
};

type ActionListPageProps = {
  page: NonNullable<GetPageQuery['page']> & {
    __typename: 'ActionListPage',
  }
}

function ActionListPage(props: ActionListPageProps) {
  const { t } = useTranslation();
  const { page } = props;
  const activeGoal = useReactiveVar(activeGoalVar);
  const queryResp = (
    useQuery<GetActionListQuery, GetActionListQueryVariables>(GET_ACTION_LIST, {
      variables: {
        goal: activeGoal?.id,
      },
      fetchPolicy: 'cache-and-network',
      notifyOnNetworkStatusChange: true,
    })
  );
  const { error, loading, networkStatus, previousData } = queryResp;
  const activeScenario = useReactiveVar(activeScenarioVar);
  const yearRange = useReactiveVar(yearRangeVar);
  const site = useSite();

  const [listType, setListType] = useState('list');
  const [ascending, setAscending] = useState(true);
  const [sortBy, setSortBy] = useState('default');
  const [activeEfficiency, setActiveEfficiency] = useState<number>(0);
  const [actionGroup, setActionGroup] = useState('undefined');

  const data = queryResp.data ?? previousData;
  const hasEfficiency = data ? data.actionEfficiencyPairs.length > 0 : false;
  // TODO: set default sort by efficiency if we have efficiency data
  // Maybe this needs a useEffect hook?
  // if (hasEfficiency) setSortBy('cumulativeEfficiency');

  // If we have action efficiency pairs, we augment the actions with the cumulative values
  const reductionText = `(${t('reduction')})`;
  const usableActions: ActionWithEfficiency[] = useMemo(() => (data?.actions || []).map((act) => {
    const out: ActionWithEfficiency = {
      ...act,
    };
    const efficiencyType = data?.actionEfficiencyPairs[activeEfficiency];
    const efficiencyAction = efficiencyType?.actions.find((a) => a.action.id === act.id);
    if (!efficiencyType || !efficiencyAction) return out;

    out.cumulativeImpact = (efficiencyType.invertImpact ? -1 : 1) * summarizeYearlyValuesBetween(efficiencyAction.impactValues, yearRange[0], yearRange[1]);
    out.cumulativeCost = (efficiencyType.invertCost ? -1 : 1) * summarizeYearlyValuesBetween(efficiencyAction.costValues, yearRange[0], yearRange[1]);
    out.efficiencyDivisor = efficiencyAction.efficiencyDivisor ?? undefined;
    if (out.efficiencyDivisor !== undefined)
      out.cumulativeEfficiency = out.cumulativeCost/Math.abs(out.cumulativeImpact)/out.efficiencyDivisor;

    const efficiencyProps: Partial<ActionWithEfficiency> = {
      cumulativeImpactUnit: efficiencyType?.impactUnit.htmlShort,
      cumulativeImpactName: `${efficiencyType?.impactNode?.name} ${data.actionEfficiencyPairs[activeEfficiency]?.invertImpact ? reductionText : ''}`,
      cumulativeCostUnit: efficiencyType?.costUnit.htmlShort,
      cumulativeCostName: efficiencyType?.costNode?.name,
      cumulativeEfficiencyUnit: efficiencyType?.efficiencyUnit.htmlShort,
      cumulativeEfficiencyName: efficiencyType?.label,
      efficiencyCap: efficiencyType?.plotLimitEfficiency ?? undefined,
    };
    Object.assign(out, efficiencyProps);
    return out;
  }).filter((action) => actionGroup === 'undefined' || actionGroup === action.group?.id), [data, actionGroup, activeEfficiency]);

  const refetching = networkStatus === NetworkStatus.refetch;

  if (error) {
    return <Container className="pt-5"><GraphQLError errors={error} /></Container>
  }

  if (!data) {
    return <ContentLoader />
  }

  return (
  <>
    <HeaderSection>
      <Container fluid="lg">
        <PageHeader>
          <h1>
            {t('actions')}
            {' '}
          </h1>
        </PageHeader>
        { (page.actionListLeadParagraph || page.actionListLeadTitle) && (
          <Row>
            <Col md={{ size: 10, offset: 1 }}>
              <PageHeader>
                <HeaderCard>
                  <h2>
                  { page.actionListLeadTitle }
                  </h2>
                  <Description dangerouslySetInnerHTML={{ __html: page.actionListLeadParagraph }} />
                </HeaderCard>
              </PageHeader>
            </Col>
          </Row>
        )}
      </Container>
      <Container fluid="lg">
        <ActiveScenario>
          {t('scenario')}
          :
          {' '}
          {activeScenario?.name}
        </ActiveScenario>
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
                onChange={(e) => setActiveEfficiency(Number(e.target.value))}
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
                <option value="cumulativeEfficiency">
                  {t('actions-sort-efficiency')}
                </option> )}
              <option value="cumulativeImpact">
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
    <Container fluid="lg" className="mb-5">
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
    <SettingsPanelFull />
  </>
  )
}

export default ActionListPage