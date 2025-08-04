import { gql, useQuery, useReactiveVar } from '@apollo/client';
import { Box, Skeleton, Typography } from '@mui/material';
import _ from 'lodash';
import { useTranslation } from 'next-i18next';

import type {
  GetInstanceGoalOutcomeQuery,
  GetInstanceGoalOutcomeQueryVariables,
} from '@/common/__generated__/graphql';
import { activeScenarioVar } from '@/common/cache';
import { useFeatures } from '@/common/instance';
import type { InstanceGoal } from '@/common/instance';
import { beautifyValue } from '@/common/preprocess';

import ScenarioOutcomeAsText from './ScenarioOutcomeAsText';

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

/*
Different ways to visualise the scenario outcome
- Active goal: user activated or plan's default goal
- Target year: user selected or plan's default target year
*/
type ScenarioOutcomeProps = {
  compact?: boolean;
  activeGoal: InstanceGoal;
  targetYear: number;
  variant?: 'default' | 'verbose' | 'compact';
};

const ScenarioOutcome = (props: ScenarioOutcomeProps) => {
  const { activeGoal, targetYear, variant = 'default' } = props;
  const { t } = useTranslation();
  const features = useFeatures();
  const activeScenario = useReactiveVar(activeScenarioVar);
  const maximumFractionDigits = features.maximumFractionDigits ?? undefined;
  //const yearRange = useReactiveVar(yearRangeVar);

  // Get the goal outcome for the active goal
  const { loading, error, data } = useQuery<
    GetInstanceGoalOutcomeQuery,
    GetInstanceGoalOutcomeQueryVariables
  >(GET_INSTANCE_GOAL_OUTCOME, {
    variables: {
      goal: activeGoal.id,
    },
  });

  if (loading) return <Skeleton variant="text" width={100} height={24} />;
  if (error) return <div>error!</div>;
  if (!data || !data.instance.goals.length) return <div>no data</div>;

  const goalOutcome = data.instance.goals[0];
  const firstForecastYear = goalOutcome.values.find((val) => val.isForecast)?.year;
  const isForecast = targetYear >= firstForecastYear!;
  const valuesByYear = new Map(goalOutcome.values.map((goal) => [goal.year, goal]));
  const unit = goalOutcome.unit.htmlShort;
  //const historical = goal.values.filter((val) => !val.isForecast);
  const goalValues = goalOutcome.values.filter((val) => val.goal !== null);
  //const outcomeNow = historical[historical.length - 1];
  // Use the closest goal value to the end of the year range
  const comparisonGoal =
    goalValues.filter((v) => v.goal !== null).filter((v) => v.year >= targetYear)[0] ||
    goalValues[goalValues.length - 1];
  // const comparisonGoal = goalValues[goalValues.length - 1];
  const comparisonActual = valuesByYear.get(targetYear)!;

  //const goalOnTargetYear = goalValues
  //  .filter((v) => v.goal !== null)
  //  .filter((v) => v.year === targetYear)[0];
  //const maxOutcome = _.max([outcomeNow.actual, comparisonActual.actual, comparisonGoal.goal])!;
  //const minOutcome = _.min([outcomeNow.actual, comparisonActual.actual, comparisonGoal.goal])!;
  //const totalRange = minOutcome < 0 ? maxOutcome - minOutcome : maxOutcome;
  //const zeroOffset = minOutcome < 0 ? (minOutcome / totalRange) * 100 : 0;

  const missingFromTarget = comparisonActual.actual! - comparisonGoal.goal!;

  switch (variant) {
    case 'default':
      return <div>default</div>;
    case 'verbose':
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="body2" sx={{ lineHeight: 1, m: 0, p: 0 }}>
            <ScenarioOutcomeAsText
              isForecast={isForecast}
              scenarioName={activeScenario.name}
              goalType={activeGoal.label!}
              selectedYear={targetYear}
              selectedYearDifference={missingFromTarget}
              selectedYearValue={comparisonActual.actual!}
              nearestGoalYear={comparisonGoal.year}
              nearestGoalValue={comparisonGoal.goal!}
              unit={unit}
            />
          </Typography>
        </Box>
      );
    case 'compact':
      const differenceToGoal = (missing: number) => {
        const missingFromTargetPercentageRaw = (missing / comparisonGoal.goal!) * 100;
        const missingText =
          comparisonActual.goal! !== 0
            ? `${Math.abs(missingFromTargetPercentageRaw).toFixed(0)}%`
            : `${beautifyValue(missing, undefined, maximumFractionDigits)} ${unit}`;

        // TODO: Verbalise case "exactly on target"
        const outcomeText =
          missingFromTargetPercentageRaw > 0 ? t('above-target') : t('below-target');

        return (
          <>
            <strong>{missingText}</strong> {outcomeText} {comparisonGoal.year}.
          </>
        );
      };

      return (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            flexDirection: 'column',
          }}
        >
          <Typography variant="h6" sx={{ lineHeight: 1, m: 0, p: 0 }}>
            {isForecast ? t('scenario-outcome') : t('table-historical')} {targetYear}
          </Typography>
          <Typography variant="body2" sx={{ lineHeight: 1, m: 0, p: 0 }}>
            {activeGoal.label} {differenceToGoal(missingFromTarget)}
          </Typography>
        </Box>
      );
  }
};

export default ScenarioOutcome;
