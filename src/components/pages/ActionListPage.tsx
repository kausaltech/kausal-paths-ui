import { useMemo, useState } from 'react';

import { type QueryResult, useQuery, useReactiveVar } from '@apollo/client';
import styled from '@emotion/styled';
import type { TFunction } from 'i18next';
import { useTranslation } from 'next-i18next';
import { Button, ButtonGroup, Col, Container, FormGroup, Input, Label, Row } from 'reactstrap';

import {
  DecisionLevel,
  type GetActionListQuery,
  type GetActionListQueryVariables,
  type GetImpactOverviewsQuery,
  type GetPageQuery,
} from '@/common/__generated__/graphql';
import { activeGoalVar, activeScenarioVar, yearRangeVar } from '@/common/cache';
import { useInstance } from '@/common/instance';
import { summarizeYearlyValuesBetween } from '@/common/preprocess';
import ContentLoader from '@/components/common/ContentLoader';
import GraphQLError from '@/components/common/GraphQLError';
import { PageHero } from '@/components/common/PageHero';
import ScenarioBadge from '@/components/common/ScenarioBadge';
import Icon from '@/components/common/icon';
import ActionsComparison from '@/components/general/ActionsComparison';
import ActionsList from '@/components/general/ActionsList';
import ActionsMac from '@/components/general/ActionsMac';
import { CostBenefitAnalysis } from '@/components/general/CostBenefitAnalysis';
import { ReturnOnInvestment } from '@/components/general/ReturnOnInvestment';
import SettingsPanelFull from '@/components/general/SettingsPanelFull';
import { GET_ACTION_LIST } from '@/queries/getActionList';
import { GET_IMPACT_OVERVIEWS } from '@/queries/getImpactOverviews';
import type { ActionWithEfficiency, SortActionsBy, SortActionsConfig } from '@/types/actions.types';

import { SimpleEffect } from '../general/SimpleEffect';
import type { PageRefetchCallback } from './Page';

const SettingsForm = styled.form`
  display: block;
  margin: 1.5rem 0;
  padding: 0.5rem 0;
  border-top: 1px solid ${(props) => props.theme.graphColors.blue030};
  border-bottom: 1px solid ${(props) => props.theme.graphColors.blue030};
`;

const ActionCount = styled.div`
  padding: ${({ theme }) => theme.spaces.s100} 0;
  color: ${({ theme }) => theme.themeColors.white};

  span {
    margin-left: 1rem;
  }
`;

const StyledFormGroup = styled(FormGroup)`
  width: 100%;
`;

const SortButtons = styled(ButtonGroup)`
  button {
    padding-top: 0.4rem;
    padding-bottom: 0.4rem;
  }

  .icon {
    vertical-align: middle;
  }
`;

const ActionsViewTabs = styled.div`
  background-color: ${(props) => props.theme.brandDark};
  margin-bottom: ${(props) => props.theme.spaces.s400};
`;

const Tab = styled.button`
  background: ${(props) => props.theme.brandDark};
  color: ${(props) => props.theme.themeColors.white};
  display: inline-block;
  border: none;
  margin: 0;
  padding: ${(props) =>
    `${props.theme.spaces.s050} ${props.theme.spaces.s150} ${props.theme.spaces.s100}`};
  text-decoration: none;
  cursor: pointer;
  text-align: center;

  &:hover,
  &:focus {
    color: ${(props) => props.theme.brandLight};
  }
  &.active {
    color: ${(props) => props.theme.graphColors.blue070};
    background: ${(props) => props.theme.graphColors.grey030};
    &:hover {
      color: ${(props) => props.theme.themeColors.black};
    }
  }

  .icon {
    width: 1.5rem !important;
    height: 1.5rem !important;
    vertical-align: middle;
  }
`;

const getSortOptions = (
  t: TFunction,
  hasEfficiency: boolean,
  showAccumulatedEffects: boolean
): SortActionsConfig[] => [
  {
    key: 'STANDARD',
    label: t('actions-sort-default'),
  },
  {
    isHidden: !hasEfficiency,
    key: 'CUM_EFFICIENCY',
    label: t('actions-sort-efficiency'),
    sortKey: 'cumulativeEfficiency',
  },
  {
    isHidden: !showAccumulatedEffects,
    key: 'CUM_IMPACT',
    label: t('actions-sort-cumulative-impact'),
  },
  {
    key: 'IMPACT',
    label: t('actions-sort-impact'),
    sortKey: 'impactOnTargetYear',
  },
  {
    isHidden: !hasEfficiency,
    key: 'CUM_COST',
    label: t('actions-sort-cost'),
    sortKey: 'cumulativeCost',
  },
];

type ViewType = 'list' | 'mac' | 'comparison' | 'cost-benefit' | 'roi' | 'simple';

type ActionListPageProps = {
  page: NonNullable<GetPageQuery['page']> & {
    __typename: 'ActionListPage';
  };
  refetch: PageRefetchCallback;
};

type ActionPageTabProps = {
  tabId: ViewType;
  label: string;
  isActive: boolean;
  onSelectTab: (id: string) => void;
  icon: string;
};

function hasGraph(impactResponse: QueryResult<GetImpactOverviewsQuery>, graphType: string) {
  return !!impactResponse.data?.impactOverviews.find(
    (overview) => overview.graphType === graphType
  );
}

function ActionPageTab({ tabId, label, isActive, onSelectTab, icon }: ActionPageTabProps) {
  return (
    <Tab
      className={`nav-link ${isActive ? 'active' : ''}`}
      onClick={() => onSelectTab(tabId)}
      role="tab"
      tabIndex={0}
      aria-selected={isActive}
      aria-controls="tabId"
      id="list-tab"
    >
      <Icon name={icon} /> {label}
    </Tab>
  );
}

function ActionListPage({ page }: ActionListPageProps) {
  const { t } = useTranslation();
  const instance = useInstance();
  const activeGoal = useReactiveVar(activeGoalVar);

  const impactResp = useQuery<GetImpactOverviewsQuery>(GET_IMPACT_OVERVIEWS, {
    fetchPolicy: 'cache-and-network',
  });

  const actionListResp = useQuery<GetActionListQuery, GetActionListQueryVariables>(
    GET_ACTION_LIST,
    {
      variables: {
        goal: activeGoal?.id ?? null,
      },
      fetchPolicy: 'cache-and-network',
    }
  );
  const error = actionListResp.error || impactResp.error;

  const { loading: areActionsLoading, previousData } = actionListResp;
  const activeScenario = useReactiveVar(activeScenarioVar);
  const yearRange = useReactiveVar(yearRangeVar);

  const data = actionListResp.data ?? previousData;
  const hasEfficiency = data ? data.impactOverviews.length > 0 : false;
  const showReturnOnInvestment = hasGraph(impactResp, 'return_on_investment');
  const showCostBenefitAnalysis = hasGraph(impactResp, 'cost_benefit');
  const showSimpleEffect = hasGraph(impactResp, 'simple_effect');

  const sortOptions = getSortOptions(t, hasEfficiency, !!instance.features.showAccumulatedEffects);

  const [listType, setListType] = useState<ViewType>('list');
  const [ascending, setAscending] = useState(true);
  const [sortBy, setSortBy] = useState<SortActionsConfig>(
    sortOptions.find((sortOption) => sortOption.key === page.defaultSortOrder) ?? sortOptions[0]
  );
  const [activeEfficiency, setActiveEfficiency] = useState<number>(0);
  const [actionGroup, setActionGroup] = useState<string>('ALL_ACTIONS');

  const filteredActions = (data?.actions || []).filter(
    (action) =>
      !page.showOnlyMunicipalActions ||
      (page.showOnlyMunicipalActions && action.decisionLevel === DecisionLevel.Municipality)
  );

  const usableActions: ActionWithEfficiency[] = useMemo(
    () =>
      filteredActions
        .map((act) => {
          // If we have impact overviews, we augment the actions with the cumulative values
          const reductionText = `(${t('reduction')}, ${t(
            'accumulated-between'
          )} ${yearRange[0]}-${yearRange[1]})`;

          const out: ActionWithEfficiency = {
            ...act,
            impactOnTargetYear:
              [
                ...(act.impactMetric?.historicalValues ?? []),
                ...(act.impactMetric?.forecastValues ?? []),
              ].find((dataPoint) => dataPoint.year === yearRange[1])?.value ?? 0,
          };

          const efficiencyType = data?.impactOverviews[activeEfficiency];
          const efficiencyAction = efficiencyType?.actions.find((a) => a.action.id === act.id);

          if (!efficiencyType || !efficiencyAction) return out;

          out.cumulativeImpact = summarizeYearlyValuesBetween(
            efficiencyAction.impactValues,
            yearRange[0],
            yearRange[1]
          );
          out.cumulativeCost = summarizeYearlyValuesBetween(
            efficiencyAction.costValues,
            yearRange[0],
            yearRange[1]
          );
          out.unitAdjustmentMultiplier = efficiencyAction.unitAdjustmentMultiplier ?? undefined;
          if (out.unitAdjustmentMultiplier !== undefined)
            out.cumulativeEfficiency =
              (out.cumulativeCost / Math.abs(out.cumulativeImpact)) * out.unitAdjustmentMultiplier;

          const efficiencyProps: Partial<ActionWithEfficiency> = {
            cumulativeImpactId: efficiencyType?.effectNode?.id,
            cumulativeImpactUnit: efficiencyType?.effectUnit.htmlShort,
            cumulativeImpactName: `${efficiencyType?.effectNode?.name} ${
              data.impactOverviews[activeEfficiency]?.invertImpact ? reductionText : ''
            }`,
            cumulativeCostUnit: efficiencyType?.costUnit.htmlShort,
            cumulativeCostName: efficiencyType?.costNode?.name,
            cumulativeEfficiencyUnit: efficiencyType?.indicatorUnit.htmlShort,
            cumulativeEfficiencyName: efficiencyType?.label,
            efficiencyCap: efficiencyType?.plotLimitForIndicator ?? undefined,
          };
          Object.assign(out, efficiencyProps);
          return out;
        })
        .filter((action) => actionGroup === 'ALL_ACTIONS' || actionGroup === action.group?.id),
    [data, actionGroup, activeEfficiency, yearRange, filteredActions, t]
  );

  const actionGroups = filteredActions.reduce(
    (groups: NonNullable<ActionWithEfficiency['group']>[], action) =>
      !action.group || groups.find((group) => group.id === action.group?.id)
        ? groups
        : [...groups, action.group],
    []
  );

  const handleChangeSort = (sortBy: SortActionsBy) => {
    const selectedSorter = sortOptions.find((option) => option.key === sortBy);

    setSortBy(selectedSorter ?? sortOptions[0]);
  };

  if (error) {
    return (
      <Container className="pt-5">
        <GraphQLError error={error} />
      </Container>
    );
  }

  if (!data) {
    return <ContentLoader fullPage />;
  }

  return (
    <>
      <PageHero
        title={t('actions')}
        leadTitle={page.actionListLeadTitle ?? undefined}
        leadDescription={page.actionListLeadParagraph ?? undefined}
      >
        <SettingsForm className="text-light mt-4">
          <Row>
            {hasEfficiency && (
              <Col md={4} className="d-flex">
                <StyledFormGroup>
                  <Label for="impact">{t('actions-impact-on')}</Label>
                  <Input
                    id="impact"
                    name="select"
                    type="select"
                    onChange={(e) => setActiveEfficiency(Number(e.target.value))}
                  >
                    {data.impactOverviews.map((impactGroup, indx) => (
                      <option value={indx} key={indx}>
                        {impactGroup.label}
                      </option>
                    ))}
                  </Input>
                </StyledFormGroup>
              </Col>
            )}
            {actionGroups.length > 1 && (
              <Col md={4} className="d-flex">
                <StyledFormGroup>
                  <Label for="type">{t('actions-group-type')}</Label>
                  <Input
                    id="type"
                    name="select"
                    type="select"
                    onChange={(e) => setActionGroup(e.target.value)}
                  >
                    <option value="ALL_ACTIONS">{t('action-groups-all')}</option>
                    {actionGroups.map((actionGroup) => (
                      <option value={actionGroup.id} key={actionGroup.id}>
                        {actionGroup.name}
                      </option>
                    ))}
                  </Input>
                </StyledFormGroup>
              </Col>
            )}
            <Col md={4} className="d-flex">
              <div className="d-flex align-items-end me-3">
                <FormGroup>
                  <Label for="sort">{t('actions-sort-by')}</Label>
                  <Input
                    id="sort"
                    name="select"
                    type="select"
                    onChange={(e) => handleChangeSort(e.target.value as SortActionsBy)}
                  >
                    {sortOptions.map(
                      (sortOption) =>
                        !sortOption.isHidden && (
                          <option
                            key={sortOption.key}
                            value={sortOption.key}
                            selected={sortBy.key === sortOption.key}
                          >
                            {sortOption.label}
                          </option>
                        )
                    )}
                  </Input>
                </FormGroup>
              </div>
              <div className="d-flex align-items-end">
                <FormGroup>
                  <SortButtons>
                    <Button
                      color="white"
                      outline
                      onClick={(_e) => setAscending(true)}
                      active={ascending === true}
                      aria-label={t('sort-ascending')}
                    >
                      <Icon name="arrowUpWideShort" width="1.5rem" height="1.5rem" />
                    </Button>
                    <Button
                      color="white"
                      outline
                      onClick={(_e) => setAscending(false)}
                      active={ascending === false}
                      aria-label={t('sort-descending')}
                    >
                      <Icon name="arrowDownShortWide" width="1.5rem" height="1.5rem" />
                    </Button>
                  </SortButtons>
                </FormGroup>
              </div>
            </Col>
          </Row>
        </SettingsForm>
        <ActionCount>
          <ScenarioBadge>
            {t('scenario')}: {activeScenario?.name}
          </ScenarioBadge>
          <div>{t('actions-count', { count: usableActions.length })}</div>
        </ActionCount>
      </PageHero>
      <ActionsViewTabs>
        <Container fluid="lg">
          <div role="tablist">
            <ActionPageTab
              tabId="list"
              isActive={listType === 'list'}
              label={t('actions-as-list')}
              onSelectTab={() => setListType('list')}
              icon="grid"
            />

            {hasEfficiency ? (
              <ActionPageTab
                tabId="mac"
                isActive={listType === 'mac'}
                label={t('actions-as-efficiency')}
                onSelectTab={() => setListType('mac')}
                icon="chartColumn"
              />
            ) : (
              <ActionPageTab
                tabId="comparison"
                isActive={listType === 'comparison'}
                label={t('actions-as-comparison')}
                onSelectTab={() => setListType('comparison')}
                icon="chartColumn"
              />
            )}

            {showCostBenefitAnalysis && (
              <ActionPageTab
                tabId="cost-benefit"
                isActive={listType === 'cost-benefit'}
                label={t('cost-benefit')}
                onSelectTab={() => setListType('cost-benefit')}
                icon="chartColumn"
              />
            )}

            {showReturnOnInvestment && (
              <ActionPageTab
                tabId="roi"
                isActive={listType === 'roi'}
                label={t('return-on-investment')}
                onSelectTab={() => setListType('roi')}
                icon="chartColumn"
              />
            )}

            {showSimpleEffect && (
              <ActionPageTab
                tabId="simple"
                isActive={listType === 'simple'}
                label={t('simple-effect')}
                onSelectTab={() => setListType('simple')}
                icon="chartColumn"
              />
            )}
          </div>
        </Container>
      </ActionsViewTabs>
      <Container fluid="lg" className="mb-5">
        <Row>
          <Col>
            {listType === 'list' && (
              <ActionsList
                id="list-view"
                actions={usableActions}
                displayType="displayTypeYearly"
                yearRange={yearRange}
                sortBy={sortBy}
                sortAscending={ascending}
                refetching={areActionsLoading}
              />
            )}
            {listType === 'mac' && (
              <ActionsMac
                id="efficiency-view"
                actions={usableActions}
                impactOverviews={data.impactOverviews[activeEfficiency]}
                t={t}
                actionGroups={data.instance.actionGroups}
                sortBy={sortBy.sortKey}
                sortAscending={ascending}
                refetching={areActionsLoading}
              />
            )}
            {listType === 'cost-benefit' && (
              <CostBenefitAnalysis data={impactResp.data} isLoading={impactResp.loading} />
            )}
            {listType === 'roi' && (
              <ReturnOnInvestment data={impactResp.data} isLoading={impactResp.loading} />
            )}
            {listType === 'simple' && (
              <SimpleEffect data={impactResp.data} isLoading={impactResp.loading} />
            )}
            {listType === 'comparison' && (
              <ActionsComparison
                id="comparison-view"
                actions={usableActions}
                actionGroups={data.instance.actionGroups}
                sortBy={sortBy.sortKey}
                sortAscending={ascending}
                refetching={areActionsLoading}
                displayYears={yearRange}
              />
            )}
          </Col>
        </Row>
      </Container>
      <SettingsPanelFull />
    </>
  );
}

export default ActionListPage;
