import styled from 'styled-components';
import { Row, Col } from 'reactstrap';
import ActionListCard from 'components/general/ActionListCard';
import { ActionWithEfficiency, SortActionsConfig } from 'types/actions.types';
import { useMemo } from 'react';

const ActionListList = styled(Row)`
  list-style: none;
  padding: 0;
`;

const ActionListItem = styled(Col)`
  margin-bottom: ${(props) => props.theme.spaces.s200};
  > div {
    height: 100%;
  }
`;

const ActionListCategory = styled.div`
  padding: ${(props) => props.theme.spaces.s100};
  margin-bottom: ${(props) => props.theme.spaces.s200};
  background-color: ${({ theme }) => theme.cardBackground.primary};

  h3 {
    margin: 0;
  }
`;

const getValueForSorting = (
  action: ActionWithEfficiency,
  sortBy: SortActionsConfig
): number => {
  if (sortBy.key === 'CUM_IMPACT') {
    return action.impactMetric?.cumulativeForecastValue ?? 0;
  }

  if (sortBy.sortKey) {
    const sortValue = action[sortBy.sortKey];

    if (typeof sortValue === 'number') {
      return sortValue;
    }
  }

  return 0;
};

type ActionsListProps = {
  id?: string;
  actions: ActionWithEfficiency[];
  displayType: 'displayTypeYearly';
  yearRange: [number, number];
  sortBy: SortActionsConfig;
  sortAscending: boolean;
  refetching: boolean;
};

const ActionsList = ({
  id,
  actions,
  displayType,
  yearRange,
  sortBy,
  sortAscending,
  refetching,
}: ActionsListProps) => {
  // possible sort: default, impact, cumulativeImpact, cumulativeCost, cumulativeEfficiency

  //console.log("action list", actions);
  const sortActions = (a, b) => {
    if (sortBy.key === 'STANDARD') {
      return sortAscending ? 0 : -1;
    }

    const aValue = getValueForSorting(a, sortBy);
    const bValue = getValueForSorting(b, sortBy);

    return sortAscending ? aValue - bValue : bValue - aValue;
  };

  const sortedActions = useMemo(() => {
    return [...actions].sort(sortActions);
  }, [actions, sortBy, sortAscending]);

  // Group actions by group
  const actionGroups = useMemo<string[]>(() => {
    const groups = new Set<string>();
    actions.forEach((action) => {
      if (action.group) groups.add(action.group.name);
    });
    return [...groups];
  }, [actions]);

  return (
    <div id={id}>
      {actionGroups?.map((group) => (
        <div key={group}>
          <ActionListCategory>
            <h3>{group}</h3>
          </ActionListCategory>
          <ActionListList tag="ul">
            {sortedActions?.map(
              (action) =>
                action.group?.name === group && (
                  <ActionListItem tag="li" key={action.id} sm={6} md={4} xl={3}>
                    <ActionListCard
                      action={action}
                      displayType={displayType}
                      displayYears={yearRange}
                      refetching={refetching}
                    />
                  </ActionListItem>
                )
            )}
          </ActionListList>
        </div>
      ))}
      {actionGroups.length < 1 && (
        <ActionListList>
          {sortedActions?.map(
            (action) =>
              !action.group && (
                <ActionListCard
                  key={action.id}
                  action={action}
                  displayType={displayType}
                  displayYears={yearRange}
                  refetching={refetching}
                />
              )
          )}
        </ActionListList>
      )}
    </div>
  );
};

export default ActionsList;
