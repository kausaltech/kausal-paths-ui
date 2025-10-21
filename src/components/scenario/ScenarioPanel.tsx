import { useLayoutEffect, useRef, useState } from 'react';

import { gql, useQuery, useReactiveVar } from '@apollo/client';
import { useTheme } from '@emotion/react';
import {
  Box,
  Button,
  Collapse,
  Container,
  Grid,
  Typography,
  useMediaQuery,
  useScrollTrigger,
} from '@mui/material';
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

/**
 * Determines if the scenario panel is fixed and if its minimized.
 * The minimized version shows the scenario selector and edit scenario button,
 * hiding the title and year selectors.
 *
 * The panel sticks upon scroll past the initial relative position. We display the
 * full panel when scrolling up, and the minimized version when scrolling down.
 *
 * Also return the initial height of the relative panel to support rendering a
 * placeholder when the panel is fixed and prevent content jumping.
 */
function useIsPanelStuck(ref: React.RefObject<HTMLDivElement | null>) {
  const theme = useTheme();
  const [position, setPosition] = useState({ top: 0, initialHeight: 0 });
  const isScrollingDown = useScrollTrigger();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const hasScrolledPastPanelStart = useScrollTrigger({
    disableHysteresis: true,
    threshold: position.top,
  });
  const hasScrolledPastPanelEnd = useScrollTrigger({
    disableHysteresis: true,
    threshold: position.top + position.initialHeight,
  });

  const isPanelFixed = !isMobile && hasScrolledPastPanelStart;
  const isPanelMini = isScrollingDown && isPanelFixed && hasScrolledPastPanelEnd;

  useLayoutEffect(() => {
    function handleChangePosition() {
      if (ref.current) {
        setPosition((position) => ({
          ...position,
          top: ref.current?.getBoundingClientRect().top ?? position.top + window.pageYOffset,
        }));
      }
    }

    if (ref.current) {
      setPosition({
        top: ref.current.getBoundingClientRect().top + window.pageYOffset,
        initialHeight: ref.current.getBoundingClientRect().height,
      });
    }

    window.addEventListener('resize', handleChangePosition);

    return () => {
      window.removeEventListener('resize', handleChangePosition);
    };
  }, [ref]);

  return { isPanelFixed, isPanelMini, initialHeight: position.initialHeight };
}

const FIXED_STYLES = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  zIndex: 1000,
};

const RELATIVE_STYLES = {
  position: 'relative',
};

const ScenarioPanel = () => {
  const theme = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const { isPanelFixed, isPanelMini, initialHeight } = useIsPanelStuck(containerRef);
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
    <div ref={containerRef}>
      {/* Placeholder to avoid content shifting when the panel is fixed */}
      {isPanelFixed && <Box sx={{ height: initialHeight, visibility: 'hidden' }} />}
      <Box
        sx={{
          zIndex: 1,
          boxShadow: 2,
          ...(isPanelFixed ? FIXED_STYLES : RELATIVE_STYLES),
          // Background overlay so that the panel stretches to the full window width while fixed
          '&::after': {
            content: '""',
            position: 'absolute',
            opacity: isPanelFixed ? 1 : 0,
            transition: isPanelFixed
              ? 'opacity 0.2s, transform 0.1s'
              : 'opacity 0.2s, transform 0s 0.2s',
            transform: isPanelFixed ? 'scaleX(1)' : 'scaleX(0.8)',
            transformOrigin: 'center',
            top: 0,
            left: '50%',
            marginLeft: '-50vw',
            width: '100vw',
            zIndex: -1,
            height: '100%',
            backgroundColor: theme.graphColors.blue010,
          },
        }}
      >
        <Container fixed maxWidth="xl" disableGutters={!isPanelFixed}>
          <Box sx={{ p: 1, backgroundColor: theme.graphColors.blue010 }}>
            <Collapse
              key={isPanelFixed ? 'fixed' : 'relative'}
              appear={false}
              in={!isPanelFixed || !isPanelMini}
            >
              <Typography variant="h4" component="h2" sx={{ lineHeight: 1, m: 0, p: 0, mb: 1 }}>
                {t('scenario')}
              </Typography>
            </Collapse>
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
                    {t('edit-scenario')}
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
          <Collapse
            key={isPanelFixed ? 'fixed' : 'relative'}
            appear={false}
            in={!isPanelFixed || !isPanelMini}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 1,
                p: 1,
                backgroundColor: theme.graphColors.grey010,
                [theme.breakpoints.down('md')]: {
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: 0.5,
                },
              }}
            >
              <Typography variant="h6" component="h3" sx={{ lineHeight: 1, m: 0, p: 0 }}>
                {t('display')}:
              </Typography>

              <YearRangeSelector
                minYear={minYear}
                maxYear={maxYear}
                maxHistoricalYear={maxHistoricalYear}
                yearsWithGoals={yearsWithGoals}
              />

              {availableNormalizations.length > 0 && <NormalizationWidget />}
            </Box>
          </Collapse>
        </Container>
      </Box>
    </div>
  );
};

export default ScenarioPanel;
