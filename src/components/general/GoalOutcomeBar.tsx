import { useEffect } from 'react';
import { gql, useQuery, useReactiveVar } from '@apollo/client';
import _ from 'lodash';
import styled, { useTheme } from 'styled-components';
import { Spinner, Card, CardBody, UncontrolledCollapse, Button } from 'reactstrap';
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

const AccordionHeader = styled(Button)`
  width: 100%;
  text-align: left;
  border-radius: 0;
  border: none;
  background-color: ${(props) => props.theme.graphColors.grey000};
  color: ${(props) => props.theme.graphColors.grey090};
  box-shadow: 0 0 4px 4px rgba(20,20,20,0.05);
  border-top: 2px solid ${(props) => props.theme.graphColors.grey050};
`;

const AccordionContent = styled(UncontrolledCollapse)`
  background-color: ${(props) => props.theme.graphColors.grey020};
  padding: 1rem;
  overflow-y: auto;
`;

const EmissionsBar = styled.div`
  position: relative;
  margin: 48px 0;
  max-width: 500px;
  height: 24px;
`;

const BarLabel = styled.div<{side?: 'top' | undefined, negative: boolean}>`
  font-size: 0.75rem;
  text-align: ${(props) => (props.negative ? 'right' : 'left')};
  white-space: nowrap;
  line-height: 1;
  z-index: 1001 + ${(props) => props.placement};
  position: absolute;
  padding: ${(props) => (props.side === 'top' ? `0 5px ${12+(props.placement*7)}px 5px` : `${24-(props.placement*7)}px 5px 0 5px`)};
  bottom: ${(props) => (props.side === 'top' ? '0' : 'auto')};
  left: ${(props) => (props.negative ? 'auto' : '-1px')};
  right: ${(props) => (props.negative ? '-1px' : 'auto')};
  border-left: ${(props) => !props.negative
                ? `1px solid ${props.theme.graphColors.grey070}` : 'none'};
  border-right: ${(props) => props.negative
                ? `1px solid ${props.theme.graphColors.grey070}` : 'none'};
  font-weight: 700;
`;

const Value = styled.div`
  font-size: 0.9rem;
  font-weight: 400;
`;

const Unit = styled.span`
  font-size: 0.75rem;
`;

const EmissionBar = styled.div<{barWidth: number, barColor: string, placement: number, zeroOffset: number}>`
  position: absolute;
  top: ${(props) => props.placement * 7}px;
  right: ${(props) => props.barWidth < 0 ? 0 : `${Math.abs(props.zeroOffset)}%`};
  height: 6px;
  width: ${(props) => Math.abs(props.barWidth)}%;
  background-color: ${(props) => props.barColor};
  border-right: ${(props) => props.barWidth > 0
                ? `1px solid ${props.theme.graphColors.grey070}` : 'none'};
  border-left: ${(props) => props.barWidth < 0
                ? `1px solid ${props.theme.graphColors.grey070}` : 'none'};
`;

const BarWithLabel = (props) => {
  const { label, value, unit, barWidth, barColor, labelSide, placement, zeroOffset } = props;

  return (
    <EmissionBar
      barWidth={barWidth}
      barColor={barColor}
      placement={placement}
      zeroOffset={zeroOffset}
    >
      <BarLabel
        side={labelSide}
        placement={placement}
        negative={barWidth < 0}
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
  const { compact } = props;
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
  const minOutcome = _.min([outcomeNow.actual, comparisonActual.actual, comparisonGoal.goal])!;
  const totalRange = minOutcome < 0 ? maxOutcome - minOutcome : maxOutcome;
  const zeroOffset = minOutcome < 0 ? (minOutcome / totalRange) * 100 : 0;
  const outcomeColor = comparisonActual.actual! > comparisonGoal.goal! ? theme.graphColors.red050 : theme.graphColors.green050;
  const outcomeNowWidth = (outcomeNow.actual! / totalRange) * 100;
  const outcomeTotalWidth = (comparisonActual.actual! / totalRange) * 100;
  const outcomeTargetWidth = (comparisonGoal.goal! / totalRange) * 100;

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

  const missingFromTarget = comparisonActual.actual! - comparisonGoal.goal!;
  const successText = missingFromTarget > 0 ? 'we are missing' : 'we are exceeding';
  const verbalizeOutcome =
    `On year ${comparisonActual.year} ${successText} ${beautifyValue(missingFromTarget)} ${unit} from year ${comparisonGoal.year} target ${beautifyValue(comparisonGoal.goal)} ${unit}`;
  
  return (
    <>
    { compact ? (
      <div>
        <EmissionsBar>
          { bars.map((bar, index) => (
            <BarWithLabel
              {...bar}
              key={bar.label}
              placement={index}
              zeroOffset={zeroOffset}
            />
          ))}
        </EmissionsBar>
      </div>
    ) : (
      <>
        <AccordionHeader
          color="primary"
          id="outcome-toggler"
        >
          Outcome: {verbalizeOutcome}
        </AccordionHeader>
        <UncontrolledCollapse toggler="#outcome-toggler" defaultOpen>
        <Card>
            <CardBody>
            <EmissionsBar>
              { bars.map((bar, index) => (
                <BarWithLabel
                  {...bar}
                  key={bar.label}
                  placement={index}
                  zeroOffset={zeroOffset}
                />
              ))}
            </EmissionsBar>
            </CardBody>
          </Card>
        </UncontrolledCollapse>
    </>
  )}
  </>);
};

export default GoalOutcomeBar;
