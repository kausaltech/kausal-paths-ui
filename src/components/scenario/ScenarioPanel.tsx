import { useReactiveVar } from '@apollo/client';
import { useTheme } from '@emotion/react';
import { Alert, Box, Button, Grid, Typography } from '@mui/material';
import { useTranslation } from 'next-i18next';

import { scenarioEditorDrawerOpenVar } from '@/common/cache';
import { useInstance } from '@/common/instance';
import { useSiteWithSetter } from '@/context/site';

import GoalSelector from '../general/GoalSelector';
import NormalizationWidget from '../general/NormalizationWidget';
import YearRangeSelector from '../general/YearRangeSelector';
import ScenarioSelector from './ScenarioSelector';

const ScenarioPanel = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [site] = useSiteWithSetter();
  const instance = useInstance();
  const scenarioEditorDrawerOpen = useReactiveVar(scenarioEditorDrawerOpenVar);
  const handleEditClick = () => {
    scenarioEditorDrawerOpenVar(!scenarioEditorDrawerOpen);
  };

  const minYear = site.minYear;
  const maxYear = site.maxYear;
  const maxHistoricalYear = instance.maximumHistoricalYear;
  const availableNormalizations =
    site.availableNormalizations.length > 0 ? site.availableNormalizations : [];

  // Target
  const nrGoals = instance.goals.length;

  return (
    <Box>
      <Box sx={{ p: 1, backgroundColor: theme.graphColors.blue010 }}>
        <Typography variant="h4" sx={{ lineHeight: 1, m: 0, p: 0, mb: 1 }}>
          {t('scenario')}
        </Typography>
        <Grid container spacing={1}>
          <Grid>
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
              <ScenarioSelector />
              <Button size="small" variant="outlined" color="primary" onClick={handleEditClick}>
                {t('edit')}
              </Button>
            </Box>
          </Grid>
          {nrGoals > 1 && (
            <Grid>
              <GoalSelector />
            </Grid>
          )}

          <Grid>
            <Alert variant="outlined" severity="success">
              This is an outlined success Alert.
            </Alert>
          </Grid>
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
