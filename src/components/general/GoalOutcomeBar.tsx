import { useEffect } from 'react';
import { gql, useQuery, useReactiveVar } from '@apollo/client';
import _ from 'lodash';
import styled, { useTheme } from 'styled-components';
import { Spinner } from 'reactstrap';
import { beautifyValue, getMetricValue } from 'common/preprocess';
import { activeGoalVar, activeScenarioVar, yearRangeVar } from 'common/cache';
import { useTranslation } from 'next-i18next';
import { GetInstanceGoalOutcomeQuery, GetInstanceGoalOutcomeQueryVariables, GetNetEmissionsQuery } from 'common/__generated__/graphql';

export const GET_INSTANCE_GOAL_OUTCOME = gql`
query GetInstanceGoalOutcome($goal: ID!) {
  instance {
    id
    goals(id: $goal) {
      values {
        year
        goal
        actual
        isForecast
        isInterpolated
      }
      unit {
        htmlShort
      }
    }
  }
}
`;

const EmissionsBar = styled.div`
  position: relative;
  margin: 24px 0;
  margin-left: auto;
  max-width: 500px;
  height: 24px;
`;

const BarLabel = styled.div<{side?: 'top' | undefined}>`
  font-size: 0.75rem;
  text-align: left;
  white-space: nowrap;
  line-height: 1;
  z-index: 1001;
  position: absolute;
  padding: ${(props) => (props.side === 'top' ? `0 5px ${12+(props.placement*7)}px 5px` : `${24-(props.placement*7)}px 5px 0 5px`)};
  bottom: ${(props) => (props.side === 'top' ? '0' : 'auto')};
  left: -1px;
  border-left: 1px solid ${(props) => props.theme.graphColors.grey070};
  font-weight: 700;
`;

const Value = styled.div`
  font-size: 0.9rem;
  font-weight: 400;
`;

const Unit = styled.span`
  font-size: 0.75rem;
`;

const EmissionBar = styled.div<{barWidth: number, barColor: string, placement: number}>`
  position: absolute;
  top: ${(props) => props.placement * 7}px;
  right: 0;
  height: 6px;
  width: ${(props) => props.barWidth}%;
  background-color: ${(props) => props.barColor};
  border-right: 1px solid ${(props) => props.theme.graphColors.grey070};
`;

const BarWithLabel = (props) => {
  const { label, value, unit, barWidth, barColor, labelSide, placement } = props;

  return (
    <EmissionBar
      barWidth={barWidth}
      barColor={barColor}
      placement={placement}
    >
      <BarLabel
        side={labelSide}
        placement={placement}
      >
        {label}
        <Value>
          { beautifyValue(value) }
          {' '}
          <Unit dangerouslySetInnerHTML={{ __html: unit }} />
        </Value>

      </BarLabel>
    </EmissionBar>
  );
};

const GoalOutcomeBar: React.FC<{}> = (props) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const activeScenario = useReactiveVar(activeScenarioVar);
  const yearRange = useReactiveVar(yearRangeVar);
  const activeGoal = useReactiveVar(activeGoalVar);

  if (!activeGoal) return null;

  const { loading, error, data, refetch } = useQuery<GetInstanceGoalOutcomeQuery, GetInstanceGoalOutcomeQueryVariables>(GET_INSTANCE_GOAL_OUTCOME, {
    variables: {
      goal: activeGoal.id,
    },
  });

  useEffect(() => {
    refetch();
  }, [activeScenario]);

  if (loading) return <span><Spinner size="sm" color="primary" /></span>;
  if (error) return <div>error!</div>;
  if (!data || !data.instance.goals.length) return <div>no data</div>

  const goal = data.instance.goals[0];
  const valuesByYear = new Map(goal.values.map(goal => [goal.year, goal]));
  const unit = goal.unit.htmlShort;
  const historical = goal.values.filter(val => !val.isForecast);
  const goalValues = goal.values.filter(val => val.goal !== null);
  const outcomeNow = historical[historical.length - 1];
  //const comparisonGoal = goalValues.filter(v => v.year >= yearRange[1])[0] || goalValues[goalValues.length - 1];
  const comparisonGoal = goalValues[goalValues.length - 1];
  const comparisonActual = valuesByYear.get(yearRange[1])!;

  const maxOutcome = _.max([outcomeNow.actual, comparisonActual.actual, comparisonGoal.goal])!;
  const outcomeColor = comparisonActual.actual! > comparisonGoal.goal! ? theme.graphColors.red050 : theme.graphColors.green050;
  const outcomeNowWidth = (outcomeNow.actual! / maxOutcome) * 100;
  const outcomeTotalWidth = (comparisonActual.actual! / maxOutcome) * 100;
  const outcomeTargetWidth = (comparisonGoal.goal! / maxOutcome) * 100;

  const bars = _.sortBy([
    {
      label: `${t('emissions')} ${outcomeNow.year}`,
      value: outcomeNow.actual!,
      unit,
      barColor: theme.graphColors.grey030,
      barWidth: outcomeNowWidth,
      labelSide: undefined,
    },
    {
      label: `${t('scenario')} ${comparisonActual.year}`,
      value: comparisonActual.actual!,
      unit,
      barColor: outcomeColor,
      barWidth: outcomeTotalWidth,
      labelSide: 'top',
    },
    {
      label: `${t('target')} ${comparisonGoal.year}`,
      value: comparisonGoal.goal!,
      unit,
      barColor: theme.graphColors.green050,
      barWidth: outcomeTargetWidth,
      labelSide: undefined,
    },
  ], [(bar) => -bar.value]);

  return (
    <div>
      <EmissionsBar>
        { bars.map((bar, index) => (
          <BarWithLabel
            {...bar}
            key={bar.label}
            placement={index}
          />
        ))}
      </EmissionsBar>
    </div>
  );
};

export default GoalOutcomeBar;
