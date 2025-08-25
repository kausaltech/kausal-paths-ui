import { gql, useQuery, useReactiveVar } from '@apollo/client';
import { useTheme } from '@emotion/react';
import { Box, Button, Grid, Typography } from '@mui/material';
import { useTranslation } from 'next-i18next';
import { Sliders } from 'react-bootstrap-icons';

import type {
  GetInstanceGoalOutcomeQuery,
  GetInstanceGoalOutcomeQueryVariables,
} from '@/common/__generated__/graphql';
import { activeGoalVar, scenarioEditorDrawerOpenVar, yearRangeVar } from '@/common/cache';
import { useInstance } from '@/common/instance';
import { useSiteWithSetter } from '@/context/site';

import GoalSelector from '../general/GoalSelector';
import NormalizationWidget from '../general/NormalizationWidget';
import YearRangeSelector from '../general/YearRangeSelector';
import ScenarioOutcome from './ScenarioOutcome';
import ScenarioSelector from './ScenarioSelector';

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

const ScenarioPanel = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [site] = useSiteWithSetter();
  const instance = useInstance();
  const scenarioEditorDrawerOpen = useReactiveVar(scenarioEditorDrawerOpenVar);
  const yearRange = useReactiveVar(yearRangeVar);
  const activeGoal = useReactiveVar(activeGoalVar);
  const handleEditClick = () => {
    scenarioEditorDrawerOpenVar(!scenarioEditorDrawerOpen);
  };

  // Get the goal outcome for the active goal
  const { error, data } = useQuery<
    GetInstanceGoalOutcomeQuery,
    GetInstanceGoalOutcomeQueryVariables
  >(GET_INSTANCE_GOAL_OUTCOME, {
    variables: {
      goal: activeGoal?.id ?? '',
    },
  });

  // if (loading) return <Skeleton variant="text" width={100} height={24} />;
  if (error) return <div>error!</div>;

  const minYear = site.minYear;
  const maxYear = site.maxYear;
  const maxHistoricalYear = instance.maximumHistoricalYear;
  const availableNormalizations =
    site.availableNormalizations.length > 0 ? site.availableNormalizations : [];

  const nrGoals = instance.goals.length;
  const yearsWithGoals =
    data?.instance?.goals?.[0]?.values
      .filter((value) => value.goal !== null)
      .map((value) => value.year) ?? [];

  return (
    <Box sx={{ boxShadow: 2 }}>
      <Box sx={{ p: 1, backgroundColor: theme.graphColors.blue010 }}>
        <Typography variant="h4" sx={{ lineHeight: 1, m: 0, p: 0, mb: 1 }}>
          {t('scenario')}
        </Typography>
        <Grid container spacing={2} sx={{ alignItems: 'flex-end' }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
              <ScenarioSelector />
              <Button
                size="small"
                color="primary"
                onClick={handleEditClick}
                startIcon={<Sliders />}
              >
                {t('edit')}
              </Button>
            </Box>
          </Grid>
          {nrGoals > 1 && (
            <Grid size={{ xs: 12, md: 6 }}>
              <GoalSelector />
            </Grid>
          )}
          {activeGoal && data?.instance?.goals?.[0] && (
            <Grid size={{ xs: 12, md: 6 }}>
              <ScenarioOutcome
                goalOutcome={data?.instance?.goals?.[0]}
                activeGoal={activeGoal}
                targetYear={yearRange[1]}
                variant="compact"
              />
            </Grid>
          )}
        </Grid>
      </Box>
      <Box sx={{ p: 1, backgroundColor: theme.graphColors.grey010 }}>
        <Grid container spacing={1}>
          <Grid sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ lineHeight: 1, m: 0, p: 0 }}>
              {t('display')}:
            </Typography>
          </Grid>
          <Grid sx={{ display: 'flex', alignItems: 'center' }}>
            <YearRangeSelector
              minYear={minYear}
              maxYear={maxYear}
              maxHistoricalYear={maxHistoricalYear}
              yearsWithGoals={yearsWithGoals}
            />
          </Grid>
          {availableNormalizations.length > 0 && (
            <Grid sx={{ display: 'flex', alignItems: 'center' }}>
              <NormalizationWidget />
            </Grid>
          )}
        </Grid>
      </Box>
    </Box>
  );
};

export default ScenarioPanel;
