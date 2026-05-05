import { useMemo, useRef, useState } from 'react';

import { Box, Container, FormControl, FormLabel, MenuItem, Select } from '@mui/material';

import { useQuery, useReactiveVar } from '@apollo/client/react';
import { useTranslations } from 'next-intl';

import styled from '@common/themes/styled';

import {
  type ActionListQuery,
  type ActionListQueryVariables,
  type PageQuery,
} from '@/common/__generated__/graphql';
import { activeGoalVar, yearRangeVar } from '@/common/cache';
import { type TFunction } from '@/common/i18n';
import { useInstance } from '@/common/instance';
import GraphQLError from '@/components/common/GraphQLError';
import { PageHero } from '@/components/common/PageHero';
import Icon from '@/components/common/icon';
import ActionListFilters from '@/components/general/ActionListFilters';
import { ActionListGraphView } from '@/components/general/ActionListGraphView';
import ActionsList from '@/components/general/ActionsList';
import { GET_ACTION_LIST } from '@/queries/getActionList';
import type { SortActionsBy, SortActionsConfig } from '@/types/actions.types';
import ScenarioPanel from '../scenario/ScenarioPanel';
import type { PageRefetchCallback } from './Page';
import { useActionListData } from './useActionListData';

const ActionCount = styled.div`
  padding: ${({ theme }) => theme.spaces.s100} 0;
  color: ${({ theme }) => theme.themeColors.black};

  span {
    margin-left: 1rem;
  }
`;

const ViewSelectorBar = styled.div`
  margin-top: 1rem;
  margin-bottom: 1rem;
`;

const getSortOptions = (
  t: TFunction,
  graphType: string | null,
  showAccumulatedEffects: boolean
): SortActionsConfig[] => {
  const standard: SortActionsConfig = {
    key: 'STANDARD',
    label: t('actions-sort-default'),
  };

  if (graphType === 'return_on_investment') {
    return [
      standard,
      {
        key: 'CUM_EFFICIENCY',
        label: t('actions-sort-efficiency'),
        sortKey: 'cumulativeEfficiency',
      },
    ];
  }

  if (!graphType || graphType === 'simple_effect') {
    return [
      standard,
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
    ];
  }

  // cost_benefit: sort keys reuse CUM_IMPACT / CUM_COST / CUM_EFFICIENCY but read
  // from each action's computed costBenefit totals (handled in getValueForSorting).
  if (graphType === 'cost_benefit') {
    return [
      standard,
      { key: 'CUM_IMPACT', label: t('benefit') },
      { key: 'CUM_COST', label: t('cost') },
      { key: 'CUM_EFFICIENCY', label: t('net-benefit') },
    ];
  }

  // cost_efficiency and any other overview with cost + effect
  return [
    standard,
    {
      isHidden: !showAccumulatedEffects,
      key: 'CUM_IMPACT',
      label: t('actions-sort-cumulative-impact'),
    },
    {
      key: 'CUM_COST',
      label: t('actions-sort-cost'),
      sortKey: 'cumulativeCost',
    },
    {
      key: 'CUM_EFFICIENCY',
      label: t('actions-sort-efficiency'),
      sortKey: 'cumulativeEfficiency',
    },
  ];
};

type ViewType = 'list' | 'graph';

type ViewOption = { value: ViewType; label: string; icon: string };
const getViewOption = <V extends ViewType>(value: V, label: string, icon: string): ViewOption => ({
  value,
  label,
  icon,
});

type ActionListPageProps = {
  page: NonNullable<PageQuery['page']> & {
    __typename: 'ActionListPage';
  };
  refetch: PageRefetchCallback;
};

function ActionListPage({ page }: ActionListPageProps) {
  const t = useTranslations('common');
  const instance = useInstance();
  const activeGoal = useReactiveVar(activeGoalVar);
  const yearRange = useReactiveVar(yearRangeVar);

  const [listType, setListType] = useState<ViewType>('list');
  const [ascending, setAscending] = useState(true);

  const actionListResp = useQuery<ActionListQuery, ActionListQueryVariables>(GET_ACTION_LIST, {
    variables: {
      goal: activeGoal?.id ?? null,
    },
    fetchPolicy: 'cache-and-network',
  });
  const { error, loading: areActionsLoading, previousData } = actionListResp;

  const data = actionListResp.data ?? previousData;

  // True only when we're re-fetching on top of already-visible data
  // (e.g. scenario change, year-range change). On the very first load
  // `previousData` is undefined, so we don't hide cells while the initial fetch runs.
  const isRefetchingWithStaleData = areActionsLoading && previousData !== undefined;

  const [activeEfficiency, setActiveEfficiency] = useState<number>(0);
  const [actionGroup, setActionGroup] = useState<string>('ALL_ACTIONS');

  const {
    usableActions,
    displayedActionsCount,
    totalActionsCount,
    actionGroups,
    hasEfficiency,
    activeOverview,
  } = useActionListData({
    data,
    showOnlyMunicipalActions: !!page.showOnlyMunicipalActions,
    activeEfficiency,
    yearRange,
    actionGroup,
  });

  // Mirror the list's ungrouped-hiding rule so graph views show the same set of actions
  const visibleActionIds = useMemo(() => {
    const hasAnyGroup = usableActions.some((a) => a.group);
    const visible = hasAnyGroup ? usableActions.filter((a) => a.group) : usableActions;
    return new Set(visible.map((a) => a.id));
  }, [usableActions]);

  const sortOptions = useMemo(
    () =>
      getSortOptions(
        t,
        activeOverview?.graphType ?? null,
        !!instance.features.showAccumulatedEffects
      ),
    [t, activeOverview?.graphType, instance.features.showAccumulatedEffects]
  );

  const [sortKey, setSortKey] = useState<SortActionsBy>(
    (page.defaultSortOrder as SortActionsBy | null) ?? 'STANDARD'
  );

  // Derive the effective sort config from the (possibly filtered) options.
  // If the desired key isn't in the current graph-type's options, fall back to STANDARD
  // while keeping sortKey sticky for when the overview switches back.
  const sortBy = useMemo<SortActionsConfig>(
    () => sortOptions.find((opt) => opt.key === sortKey && !opt.isHidden) ?? sortOptions[0],
    [sortOptions, sortKey]
  );

  // When entering cost_benefit mode, default the sort to Net Benefit descending so
  // the list matches the graph and the dropdown reflects what's actually applied.
  const prevGraphType = useRef<string | null>(null);
  const newGraphType = activeOverview?.graphType ?? null;
  if (prevGraphType.current !== newGraphType) {
    prevGraphType.current = newGraphType;
    if (newGraphType === 'cost_benefit') {
      setSortKey('CUM_EFFICIENCY');
      setAscending(false);
    }
  }

  const handleChangeSort = (key: SortActionsBy) => {
    setSortKey(key);
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
    ...(hasEfficiency ? [getViewOption('graph', t('actions-as-graph'), 'chartColumn')] : []),
  ];
  const hasMultipleViews = viewOptions.length > 1;

  if (error) {
    return (
      <Container fixed maxWidth="xl" sx={{ pt: 5 }}>
        <GraphQLError error={error} />
      </Container>
    );
  }

  return (
    <>
      <PageHero
        leadTitle={page.actionListLeadTitle ?? t('actions')}
        leadDescription={page.actionListLeadParagraph ?? undefined}
      >
        <ScenarioPanel />

        {data && (
          <ActionListFilters
            hasEfficiency={hasEfficiency}
            impactOverviews={data.impactOverviews}
            activeEfficiency={activeEfficiency}
            setActiveEfficiency={setActiveEfficiency}
            actionGroups={actionGroups}
            actionGroup={actionGroup}
            setActionGroup={setActionGroup}
            sortBy={sortBy}
            sortOptions={sortOptions}
            handleChangeSort={handleChangeSort}
            ascending={ascending}
            handleSortDirectionChange={handleSortDirectionChange}
          />
        )}
      </PageHero>

      {hasMultipleViews && (
        <ViewSelectorBar className="text-light">
          <Container
            fixed
            maxWidth="xl"
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <ActionCount>
              {areActionsLoading ? (
                <span>{t('loading')}</span>
              ) : (
                <span>
                  {t('actions-count', { count: `${displayedActionsCount}/${totalActionsCount}` })}
                </span>
              )}
            </ActionCount>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1 }}>
              <FormControl
                sx={{
                  minWidth: '12rem',
                  maxWidth: '20rem',
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <FormLabel
                  id="view-select-label"
                  sx={{ whiteSpace: { xs: 'normal', sm: 'nowrap' }, mr: { xs: 1, md: 0 } }}
                >
                  {t('show')}
                </FormLabel>
                <Select
                  id="view-select"
                  labelId="view-select-label"
                  value={listType}
                  onChange={(e) => setListType(e.target.value as ViewType)}
                  size="small"
                  MenuProps={{ disablePortal: true }}
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
      )}

      <Container fixed maxWidth="xl" sx={{ mb: 5, mt: hasMultipleViews ? 0 : 4 }}>
        {listType === 'list' ? (
          <ActionsList
            id="list-view"
            actions={usableActions}
            actionGroups={actionGroups}
            displayType="displayTypeYearly"
            yearRange={yearRange}
            sortBy={sortBy}
            sortAscending={ascending}
            activeOverview={activeOverview}
            isLoading={areActionsLoading}
            refetching={isRefetchingWithStaleData}
            onChangeSort={(key) => {
              handleChangeSort(key);
              setAscending(true);
            }}
            onToggleSortDirection={() => {
              setAscending((prev) => !prev);
            }}
          />
        ) : (
          <ActionListGraphView
            usableActions={usableActions}
            visibleActionIds={visibleActionIds}
            activeEfficiency={activeEfficiency}
            instanceActionGroups={data?.instance.actionGroups ?? []}
            sortBy={sortBy}
            sortAscending={ascending}
            refetching={isRefetchingWithStaleData}
            yearRange={yearRange}
          />
        )}
      </Container>
    </>
  );
}

export default ActionListPage;
