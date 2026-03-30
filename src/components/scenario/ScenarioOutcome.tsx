import { useReactiveVar } from '@apollo/client';
import styled from '@emotion/styled';
import { Box, Skeleton, Typography } from '@mui/material';
import { useLocale, useTranslations } from 'next-intl';
import { PatchCheckFill, PatchExclamationFill } from 'react-bootstrap-icons';

import { beautifyValue } from '@common/utils/format';

import type { InstanceGoalOutcomeQuery } from '@/common/__generated__/graphql';
import { activeScenarioVar } from '@/common/cache';
import { useFeatures } from '@/common/instance';
import type { InstanceGoal } from '@/common/instance';

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

type ScenarioOutcomeProps = {
  compact?: boolean;
  activeGoal: InstanceGoal;
  targetYear: number;
  variant?: 'default' | 'verbose' | 'compact';
  goalOutcome: InstanceGoalOutcomeQuery['instance']['goals'][0];
  loading?: boolean;
  refetching?: boolean;
  scenarioId?: string;
};

export default function ScenarioOutcome(props: ScenarioOutcomeProps) {
  const {
    activeGoal,
    targetYear,
    variant = 'default',
    loading,
    refetching,
    goalOutcome,
    scenarioId,
  } = props;
  const t = useTranslations('common');
  const locale = useLocale();
  const features = useFeatures();
  const activeScenario = useReactiveVar(activeScenarioVar);
  const maximumFractionDigits = features.maximumFractionDigits ?? undefined;

  if (loading || refetching) {
    switch (variant) {
      case 'verbose':
        return <Skeleton variant="text" width={100} height={24} aria-busy="true" />;
      case 'compact':
        return <Skeleton variant="text" width={200} height={64} aria-busy="true" />;
      default:
        return null;
    }
  }

  const valuesByYear = new Map(goalOutcome.values.map((v) => [v.year, v]));
  const unit = goalOutcome.unit.htmlShort;
  const goalValues = goalOutcome.values.filter((val) => val.goal !== null);
  // Pick goal year based on target year:
  const comparisonGoal =
    goalValues.filter((v) => v.goal !== null).filter((v) => v.year >= targetYear)[0] ||
    goalValues[goalValues.length - 1];
  const valueOnGoalYear = valuesByYear.get(comparisonGoal.year)!;
  const isForecastOnGoalYear = !!valueOnGoalYear.isForecast;
  const missingOnGoalYear = (valueOnGoalYear.actual ?? 0) - (comparisonGoal.goal ?? 0);

  switch (variant) {
    case 'default':
      return <div>default</div>;
    case 'verbose':
      return (
        <Box
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          data-testid="scenario-outcome"
          data-scenario-id={scenarioId}
        >
          <Typography variant="body2" sx={{ lineHeight: 1, m: 0, p: 0 }}>
            <ScenarioOutcomeAsText
              isForecast={isForecastOnGoalYear}
              scenarioName={activeScenario.name}
              goalType={activeGoal.label!}
              selectedYear={comparisonGoal.year}
              selectedYearDifference={missingOnGoalYear}
              selectedYearValue={valueOnGoalYear.actual!}
              nearestGoalYear={comparisonGoal.year}
              nearestGoalValue={comparisonGoal.goal!}
              unit={unit}
            />
          </Typography>
        </Box>
      );
    case 'compact': {
      const differenceToGoal = (missing: number) => {
        const goalVal = comparisonGoal.goal ?? 0;

        const missingText =
          goalVal !== 0
            ? `${Math.abs((missing / goalVal) * 100).toFixed(0)}%`
            : `${beautifyValue(missing, locale, maximumFractionDigits)} ${unit}`;

        // TODO: Verbalise case "exactly on target"
        const outcomeText = missing > 0 ? t('above-target') : t('below-target');
        return (
          <>
            <strong>{missingText}</strong> {outcomeText} {comparisonGoal.year}.
          </>
        );
      };

      // TODO: We always assume that under the target is better
      const sentiment = missingOnGoalYear > 0 ? 'negative' : 'positive';
      const Icon = sentiment === 'negative' ? PatchExclamationFill : PatchCheckFill;
      const iconClass = sentiment === 'negative' ? 'icon-negative' : 'icon-positive';

      const icon = (
        <Icon className={iconClass} aria-hidden="true" focusable="false" role="presentation" />
      );

      return (
        <CompactOutcome>
          {icon}
          <Box data-testid="scenario-outcome" data-scenario-id={scenarioId}>
            <Typography variant="h6" component="h3" sx={{ lineHeight: 1, m: 0, p: 0 }}>
              {isForecastOnGoalYear
                ? t('scenario-outcome')
                : `${t('table-historical')} ${comparisonGoal.year}`}
            </Typography>
            <Typography variant="body2" sx={{ lineHeight: 1, m: 0, p: 0 }}>
              {activeGoal.label} {differenceToGoal(missingOnGoalYear)}
            </Typography>
          </Box>
        </CompactOutcome>
      );
    }
  }
}
