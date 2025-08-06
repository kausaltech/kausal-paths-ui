import { gql, useReactiveVar } from '@apollo/client';
import styled from '@emotion/styled';
import { Box, Skeleton, Typography } from '@mui/material';
import _ from 'lodash';
import { useTranslation } from 'next-i18next';
import { PatchCheckFill, PatchExclamationFill } from 'react-bootstrap-icons';

import type { GetInstanceGoalOutcomeQuery } from '@/common/__generated__/graphql';
import { activeScenarioVar } from '@/common/cache';
import { useFeatures } from '@/common/instance';
import type { InstanceGoal } from '@/common/instance';
import { beautifyValue } from '@/common/preprocess';

import ScenarioOutcomeAsText from './ScenarioOutcomeAsText';

const CompactOutcome = styled(Box)`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex-direction: row;
  gap: ${({ theme }) => theme.spacing(1)};
  height: auto;
  padding: 0.5em 1em;
  border-radius: ${({ theme }) => theme.inputBorderRadius};
  min-height: 1.4375em;
  background-color: ${({ theme }) => theme.graphColors.grey005};
  border: 2px solid ${({ theme }) => theme.themeColors.white};

  .icon-negative {
    color: ${({ theme }) => theme.graphColors.red070};
  }

  .icon-positive {
    color: ${({ theme }) => theme.graphColors.green070};
  }
`;

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
  goalOutcome: GetInstanceGoalOutcomeQuery['instance']['goals'][0];
  loading?: boolean;
  refetching?: boolean;
};

const ScenarioOutcome = (props: ScenarioOutcomeProps) => {
  const { activeGoal, targetYear, variant = 'default', loading, refetching, goalOutcome } = props;
  const { t } = useTranslation();
  const features = useFeatures();
  const activeScenario = useReactiveVar(activeScenarioVar);
  const maximumFractionDigits = features.maximumFractionDigits ?? undefined;
  //const yearRange = useReactiveVar(yearRangeVar);

  if (loading || refetching) {
    switch (variant) {
      case 'verbose':
        return <Skeleton variant="text" width={100} height={24} />;
      case 'compact':
        return <Skeleton variant="text" width={200} height={64} />;
      default:
        return null;
    }
  }

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

      // TODO: We always assume that under the target is better
      const sentiment = missingFromTarget > 0 ? 'negative' : 'positive';
      const icon =
        sentiment === 'negative' ? (
          <PatchExclamationFill className="icon-negative" />
        ) : (
          <PatchCheckFill className="icon-positive" />
        );

      // TODO: A11y: Add aria-label to the icon
      return (
        <CompactOutcome>
          {icon}
          <Box>
            <Typography variant="h6" sx={{ lineHeight: 1, m: 0, p: 0 }}>
              {isForecast ? t('scenario-outcome') : t('table-historical')} {targetYear}
            </Typography>
            <Typography variant="body2" sx={{ lineHeight: 1, m: 0, p: 0 }}>
              {activeGoal.label} {differenceToGoal(missingFromTarget)}
            </Typography>
          </Box>
        </CompactOutcome>
      );
  }
};

export default ScenarioOutcome;
