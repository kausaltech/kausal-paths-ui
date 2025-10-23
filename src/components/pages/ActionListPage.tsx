import {
  useMemo,
  useState,
} from 'react';

import type { TFunction } from 'i18next';
import { useTranslation } from 'next-i18next';

import {
  DecisionLevel,
  type GetActionListQuery,
  type GetActionListQueryVariables,
  type GetImpactOverviewsQuery,
  type GetPageQuery,
} from '@/common/__generated__/graphql';
import {
  activeGoalVar,
  yearRangeVar,
} from '@/common/cache';
import { useInstance } from '@/common/instance';
import { summarizeYearlyValuesBetween } from '@/common/preprocess';
import ContentLoader from '@/components/common/ContentLoader';
import GraphQLError from '@/components/common/GraphQLError';
import Icon from '@/components/common/icon';
import { PageHero } from '@/components/common/PageHero';
import ActionsComparison from '@/components/general/ActionsComparison';
import ActionsList from '@/components/general/ActionsList';
import ActionsMac from '@/components/general/ActionsMac';
import { CostBenefitAnalysis } from '@/components/general/CostBenefitAnalysis';
import { ReturnOnInvestment } from '@/components/general/ReturnOnInvestment';
import { GET_ACTION_LIST } from '@/queries/getActionList';
import { GET_IMPACT_OVERVIEWS } from '@/queries/getImpactOverviews';
import type {
  ActionWithEfficiency,
  SortActionsBy,
  SortActionsConfig,
} from '@/types/actions.types';
import {
  type QueryResult,
  useQuery,
  useReactiveVar,
} from '@apollo/client';
import styled from '@emotion/styled';
import {
  Box,
  Container,
  FormControl,
  FormLabel,
  Grid,
  MenuItem,
  Select,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';

import { SimpleEffect } from '../general/SimpleEffect';
import ScenarioPanel from '../scenario/ScenarioPanel';
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

const StyledFormControl = styled(FormControl)`
  width: 100%;
`;

const StyledFormLabel = styled(FormLabel)`
  color: inherit;
  margin-bottom: 0.25rem;

  &.Mui-focused,
  &.Mui-disabled,
  &.Mui-error,
  &.MuiFormLabel-colorPrimary,
  &.MuiFormLabel-colorSecondary {
    color: inherit;
  }
`;

const ShowLabel = styled(FormLabel)`
  color: ${(p) => p.theme.brandDark};
  margin: 0;
`;

const StyledSelect = styled(Select)<{ $custom?: boolean }>`
  .MuiSelect-select {
    padding: 0.5rem 0.75rem;
    font-size: 1rem;
    line-height: 1.5;
    background-color: ${(props) => props.theme.inputBg};
  }
`;

const SortButtons = styled(ToggleButtonGroup)`
  button {
    padding-top: 0.4rem;
    padding-bottom: 0.4rem;

    &.Mui-selected {
      background-color: ${(props) => props.theme.themeColors.white};
      svg {
        fill: ${(props) => props.theme.themeColors.black};
      }
    }

    &.Mui-selected:hover {
      background-color: ${(props) => props.theme.graphColors.grey010};
    }

    &:hover {
      background-color: ${(props) => props.theme.graphColors.grey080};
    }

    svg {
      fill: ${(props) => props.theme.themeColors.white};
    }
  }

  .icon {
    vertical-align: middle;
  }
`;

const ViewSelectorBar = styled.div`
  margin-top: 1rem;
  margin-bottom: 1rem;
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

type ViewOption = { value: ViewType; label: string; icon: string };
const getViewOption = <V extends ViewType>(value: V, label: string, icon: string): ViewOption => ({
  value,
  label,
  icon,
});

type ActionListPageProps = {
  page: NonNullable<GetPageQuery['page']> & {
    __typename: 'ActionListPage';
  };
  refetch: PageRefetchCallback;
};

function hasGraph(impactResponse: QueryResult<GetImpactOverviewsQuery>, graphType: string) {
  return !!impactResponse.data?.impactOverviews.find(
    (overview) => overview.graphType === graphType
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
            cumulativeImpactUnit: efficiencyType?.effectUnit?.htmlShort,
            cumulativeImpactName: `${efficiencyType?.effectNode?.name} ${
              data.impactOverviews[activeEfficiency]?.invertImpact ? reductionText : ''
            }`,
            cumulativeCostUnit: efficiencyType?.costUnit?.htmlShort,
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

  const displayedActionsCount = useMemo(() => {
    const hasAnyGroup = usableActions.some((a) => a.group);
    return hasAnyGroup ? usableActions.filter((a) => a.group).length : usableActions.length;
  }, [usableActions]);

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
  const handleSortDirectionChange = (
    _event: React.MouseEvent<HTMLElement>,
    newDirection: string
  ) => {
    if (newDirection === null) return;
    setAscending(newDirection === 'asc');
  };

  const viewOptions: ViewOption[] = [
    getViewOption('list', t('actions-as-list'), 'list'),
    hasEfficiency
      ? getViewOption('mac', t('actions-as-efficiency'), 'chartColumn')
      : getViewOption('comparison', t('actions-as-comparison'), 'chartColumn'),
    ...(showCostBenefitAnalysis
      ? [getViewOption('cost-benefit', t('cost-benefit'), 'chartColumn')]
      : []),
    ...(showReturnOnInvestment
      ? [getViewOption('roi', t('return-on-investment'), 'chartColumn')]
      : []),
    ...(showSimpleEffect ? [getViewOption('simple', t('simple-effect'), 'chartColumn')] : []),
  ];

  if (error) {
    return (
      <Container fixed maxWidth="xl" sx={{ pt: 5 }}>
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
        <ScenarioPanel />
        <SettingsForm className="text-light mt-4">
          <Grid container spacing={2}>
            {hasEfficiency && (
              <Grid size={{ md: 4 }} sx={{ display: 'flex' }}>
                <StyledFormControl>
                  <StyledFormLabel htmlFor="impact">{t('actions-impact-on')}</StyledFormLabel>
                  <StyledSelect
                    id="impact"
                    value={activeEfficiency}
                    onChange={(e) => setActiveEfficiency(Number(e.target.value))}
                    size="small"
                  >
                    {data.impactOverviews.map((impactGroup, indx) => (
                      <MenuItem value={indx} key={indx}>
                        {impactGroup.label}
                      </MenuItem>
                    ))}
                  </StyledSelect>
                </StyledFormControl>
              </Grid>
            )}

            {actionGroups.length > 1 && (
              <Grid size={{ md: 4 }} sx={{ display: 'flex' }}>
                <StyledFormControl>
                  <StyledFormLabel htmlFor="type">{t('actions-group-type')}</StyledFormLabel>
                  <StyledSelect
                    id="type"
                    value={actionGroup}
                    onChange={(e) => setActionGroup(e.target.value as string)}
                    size="small"
                  >
                    <MenuItem value="ALL_ACTIONS">{t('action-groups-all')}</MenuItem>
                    {actionGroups.map((group) => (
                      <MenuItem value={group.id} key={group.id}>
                        {group.name}
                      </MenuItem>
                    ))}
                  </StyledSelect>
                </StyledFormControl>
              </Grid>
            )}

            <Grid size={{ md: 4 }} sx={{ display: 'flex' }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-end', mr: 1.5 }}>
                <StyledFormControl>
                  <StyledFormLabel htmlFor="sort">{t('actions-sort-by')}</StyledFormLabel>
                  <StyledSelect
                    id="sort"
                    value={sortBy.key}
                    onChange={(e) => handleChangeSort(e.target.value as SortActionsBy)}
                    size="small"
                  >
                    {sortOptions
                      .filter((opt) => !opt.isHidden)
                      .map((opt) => (
                        <MenuItem key={opt.key} value={opt.key}>
                          {opt.label}
                        </MenuItem>
                      ))}
                  </StyledSelect>
                </StyledFormControl>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
                <StyledFormControl>
                  <StyledFormLabel>{t('sort-direction')}</StyledFormLabel>
                  <SortButtons
                    value={ascending ? 'asc' : 'desc'}
                    exclusive
                    onChange={handleSortDirectionChange}
                    aria-label={t('sort-direction')}
                  >
                    <ToggleButton value="asc" aria-label={t('sort-ascending')}>
                      <Icon name="arrowUpWideShort" width="1.5rem" height="1.5rem" />
                    </ToggleButton>
                    <ToggleButton value="desc" aria-label={t('sort-descending')}>
                      <Icon name="arrowDownShortWide" width="1.5rem" height="1.5rem" />
                    </ToggleButton>
                  </SortButtons>
                </StyledFormControl>
              </Box>
            </Grid>
          </Grid>
        </SettingsForm>
        <ActionCount>
          <div>{t('actions-count', { count: displayedActionsCount })}</div>
        </ActionCount>
      </PageHero>

      <ViewSelectorBar className="text-light">
        <Container fixed maxWidth="xl">
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1 }}>
            <ShowLabel
              id="view-select-label"
              sx={{ whiteSpace: { xs: 'normal', sm: 'nowrap' }, mr: { xs: 1, md: 0 } }}
            >
              {t('show')}
            </ShowLabel>

            <FormControl sx={{ minWidth: '12rem', maxWidth: '20rem' }}>
              <Select
                id="view-select"
                value={listType}
                onChange={(e) => setListType(e.target.value as ViewType)}
                size="small"
              >
                {viewOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    <span className="d-inline-flex align-items-center">
                      {/* Keep existing bootstrap icons */}
                      <Icon name={opt.icon} width="1.25rem" height="1.25rem" className="me-2" />
                      {opt.label}
                    </span>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Container>
      </ViewSelectorBar>

      <Container fixed maxWidth="xl" sx={{ mb: 5 }}>
        {listType === 'list' && (
          <ActionsList
            id="list-view"
            actions={usableActions}
            actionGroups={actionGroups}
            displayType="displayTypeYearly"
            yearRange={yearRange}
            sortBy={sortBy}
            sortAscending={ascending}
            refetching={areActionsLoading}
            onChangeSort={(key) => {
              handleChangeSort(key);
              setAscending(true);
            }}
            onToggleSortDirection={() => {
              setAscending((prev) => !prev);
            }}
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
          <CostBenefitAnalysis 
            data={impactResp.data?.impactOverviews[activeEfficiency]}  // Pass the selected one
            isLoading={impactResp.loading} 
          />
        )}
        {listType === 'roi' && (
          <ReturnOnInvestment 
            data={impactResp.data?.impactOverviews[activeEfficiency]}  // Pass the selected one
            isLoading={impactResp.loading} 
          />
        )}
        {listType === 'simple' && (
          <SimpleEffect 
            data={impactResp.data?.impactOverviews[activeEfficiency]}  // Pass the selected one
            isLoading={impactResp.loading} 
          />
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
      </Container>
    </>
  );
}

export default ActionListPage;
