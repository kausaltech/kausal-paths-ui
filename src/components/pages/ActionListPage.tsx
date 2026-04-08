import { useState } from 'react';

import { useQuery, useReactiveVar } from '@apollo/client';
import styled from '@emotion/styled';
import { Box, Container, FormControl, FormLabel, MenuItem, Select } from '@mui/material';
import { useTranslations } from 'next-intl';

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

const ShowLabel = styled(FormLabel)`
  color: ${(p) => p.theme.brandDark};
  margin: 0;
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

  const [activeEfficiency, setActiveEfficiency] = useState<number>(0);
  const [actionGroup, setActionGroup] = useState<string>('ALL_ACTIONS');

  const { usableActions, displayedActionsCount, actionGroups, hasEfficiency } = useActionListData({
    data,
    showOnlyMunicipalActions: !!page.showOnlyMunicipalActions,
    activeEfficiency,
    yearRange,
    actionGroup,
  });

  const sortOptions = getSortOptions(t, hasEfficiency, !!instance.features.showAccumulatedEffects);

  const [sortBy, setSortBy] = useState<SortActionsConfig>(
    sortOptions.find((sortOption) => sortOption.key === page.defaultSortOrder) ?? sortOptions[0]
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
                <span>{t('actions-count', { count: displayedActionsCount })}</span>
              )}
            </ActionCount>
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
            refetching={areActionsLoading}
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
            activeEfficiency={activeEfficiency}
            instanceActionGroups={data?.instance.actionGroups ?? []}
            sortBy={sortBy}
            sortAscending={ascending}
            refetching={areActionsLoading}
            yearRange={yearRange}
          />
        )}
      </Container>
    </>
  );
}

export default ActionListPage;
