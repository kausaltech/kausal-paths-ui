import styled from 'styled-components';
import { Row, Col } from 'reactstrap';
import ActionListCard from 'components/general/ActionListCard';
import { ActionWithEfficiency } from 'components/pages/ActionListPage';
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
  background-color: ${({ theme }) => theme.cardBackground.secondary};

  h3 {
    margin: 0;
  }
`;

type ActionsListProps = {
  actions: ActionWithEfficiency[];
  displayType: 'displayTypeYearly';
  yearRange: [number, number];
  sortBy: string;
  sortAscending: boolean;
  refetching: boolean;
};

const ActionsList = (props: ActionsListProps) => {
  const { actions, displayType, yearRange, sortBy, sortAscending, refetching } =
    props;

  // possible sort: default, impact, cumulativeImpact, cumulativeCost, cumulativeEfficiency

  //console.log("action list", actions);
  const sortActions = (a, b) => {
    if (sortBy === 'default') return sortAscending ? 0 : -1;
    // check if we are using efficiency
    const aValue = a[sortBy]
      ? a[sortBy]
      : a.impactMetric?.cumulativeForecastValue;
    const bValue = b[sortBy]
      ? b[sortBy]
      : b.impactMetric?.cumulativeForecastValue;
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

  // console.log("action groups", actionGroups);
  return (
    <div>
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
