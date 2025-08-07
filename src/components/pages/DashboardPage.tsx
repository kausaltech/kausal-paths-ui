import { useTheme } from '@emotion/react';
import { Box, Card, CardContent, CardMedia, Container, Stack, Typography } from '@mui/material';
import { readableColor } from 'polished';

import type {
  DashboardCardVisualizationsFragment,
  GetPageQuery,
  MetricDimensionCategoryValueFieldsFragment,
} from '@/common/__generated__/graphql';

import CallToActionCard from '../common/CallToActionCard';
import DashboardNormalizationBar from '../general/DashboardNormalizationBar';
import DashboardVisualizationDimension from '../general/resident-dashboard/DashboardVisualizationDimension';
import DashboardVisualizationProgress from '../general/resident-dashboard/DashboardVisualizationProgress';

const PROGRESS_BAR_TYPES = [
  'ScenarioProgressBarBlock',
  'CurrentProgressBarBlock',
  'GoalProgressBarBlock',
  'ReferenceProgressBarBlock',
];

type DashboardCardVisualizations = NonNullable<
  DashboardCardVisualizationsFragment['visualizations']
>;

type ProgressBarVisualization = DashboardCardVisualizations[number] & {
  __typename:
    | 'ScenarioProgressBarBlock'
    | 'CurrentProgressBarBlock'
    | 'GoalProgressBarBlock'
    | 'ReferenceProgressBarBlock';
};

type DashboardVisualizationProps = {
  visualizations: DashboardCardVisualizations;
  referenceYearValue?: number | null;
  lastHistoricalYearValue?: number | null;
  goalValue?: number | null;
  scenarioValues?: ({ value: number | null; scenario: { id: string; name: string } } | null)[];
  unit?: {
    short: string;
    htmlShort: string;
    htmlLong: string;
  };
  metricDimensionCategoryValues: (MetricDimensionCategoryValueFieldsFragment | null)[];
};

const isProgressBar = (
  visualization: DashboardCardVisualizations[number]
): visualization is ProgressBarVisualization =>
  PROGRESS_BAR_TYPES.includes(visualization?.__typename ?? '');

function getBarValue(
  bar: ProgressBarVisualization,
  values: Pick<
    DashboardVisualizationProps,
    'goalValue' | 'lastHistoricalYearValue' | 'referenceYearValue' | 'scenarioValues'
  >
) {
  if (bar.__typename === 'CurrentProgressBarBlock') {
    return values.lastHistoricalYearValue;
  }

  if (bar.__typename === 'GoalProgressBarBlock') {
    return values.goalValue;
  }

  if (bar.__typename === 'ReferenceProgressBarBlock') {
    return values.referenceYearValue;
  }

  if (bar.__typename === 'ScenarioProgressBarBlock') {
    return values.scenarioValues?.find((scenario) => scenario?.scenario.id === bar.scenarioId)
      ?.value;
  }
}

function getBarGoalValue(
  bar: ProgressBarVisualization,
  values: Pick<
    DashboardVisualizationProps,
    'goalValue' | 'lastHistoricalYearValue' | 'referenceYearValue' | 'scenarioValues'
  >
) {
  if (bar.__typename === 'ScenarioProgressBarBlock') {
    return values.goalValue ?? undefined;
  }

  return undefined;
}

function roundValue(value: number | null | undefined) {
  return value ? Math.round(value) : null;
}

function DashboardVisualization({
  visualizations,
  referenceYearValue,
  lastHistoricalYearValue,
  goalValue,
  scenarioValues,
  unit,
  metricDimensionCategoryValues,
}: DashboardVisualizationProps) {
  const values = {
    referenceYearValue: roundValue(referenceYearValue),
    goalValue: roundValue(goalValue),
    scenarioValues: scenarioValues?.map((scenario) =>
      scenario?.value ? { ...scenario, value: roundValue(scenario.value) } : scenario
    ),
    lastHistoricalYearValue: roundValue(lastHistoricalYearValue),
  };

  // Separate the progress visualizations so they're rendered together in a single accordion
  const progressVisualizations = visualizations.filter((viz): viz is ProgressBarVisualization =>
    isProgressBar(viz)
  );
  const hasProgressVisualizations = progressVisualizations.length > 0;
  const hasNonProgressVisualizations = progressVisualizations.length !== visualizations.length;
  const maxValue = Math.max(
    values.referenceYearValue ?? 0,
    values.goalValue ?? 0,
    values.lastHistoricalYearValue ?? 0,
    ...(scenarioValues?.map((scenario) => scenario?.value ?? 0) ?? [])
  );

  const progressVisualization = hasProgressVisualizations ? (
    <DashboardVisualizationProgress
      items={progressVisualizations.map((viz) => ({
        title: viz.title,
        chartLabel: viz.chartLabel,
        color: viz.color ?? undefined,
        value: getBarValue(viz, values) ?? undefined,
        goalValue: getBarGoalValue(viz, values),
        max: maxValue,
        unit: unit ?? undefined,
        description: viz.description ?? undefined,
      }))}
    />
  ) : null;

  if (hasProgressVisualizations && !hasNonProgressVisualizations) {
    return progressVisualization;
  }

  const nonProgressVisualizations = visualizations.filter((viz) => !isProgressBar(viz));

  return (
    <>
      {progressVisualization}
      {nonProgressVisualizations.map((visualization) => {
        if (visualization?.__typename === 'DimensionVisualizationBlock') {
          return (
            <DashboardVisualizationDimension
              key={visualization.id}
              chartLabel={visualization.title}
              unit={unit?.short}
              data={metricDimensionCategoryValues
                .filter(
                  (
                    value
                  ): value is MetricDimensionCategoryValueFieldsFragment & { value: number } =>
                    value?.dimension.originalId === visualization.dimensionId &&
                    value.value !== null
                )
                .map((value) => ({
                  id: value.category.id,
                  name: value.category.label,
                  color: value.category.color ?? undefined,
                  value: value.value,
                }))}
            />
          );
        }

        // if (visualization.visualizationType === 'action_impact') {
        //   return <DashboardVisualizationActionImpact progressBars={visualization.progressBars} />;
        // }

        console.warn(`Unknown dashboard card visualization type: ${visualization?.__typename}`);

        return null;
      })}
    </>
  );
}

type Props = {
  page: GetPageQuery['page'];
  isLoading: boolean;
};

function DashboardPage({ page, isLoading }: Props) {
  const theme = useTheme();

  if (page?.__typename !== 'DashboardPage') {
    console.error('Tried to render a DashboardPage with the wrong page type');
    return null;
  }

  const backgroundColor: string = page.backgroundColor ?? 'primary.light';
  const textColor = page.backgroundColor
    ? readableColor(page.backgroundColor, theme.textColor.primary, theme.themeColors.white)
    : 'primary.contrastText';

  return (
    <Box sx={{ py: 4, backgroundColor: backgroundColor }}>
      <Container maxWidth="lg">
        <Stack spacing={2}>
          {!!page.title && (
            <Typography variant="h1" color={textColor}>
              {page.title}
            </Typography>
          )}

          <DashboardNormalizationBar />

          {page.dashboardCards?.map(
            (card, i) =>
              card?.__typename === 'DashboardCardBlock' && (
                <Card key={i}>
                  {!!card.image?.url && <CardMedia sx={{ height: 300 }} image={card.image.url} />}

                  <CardContent>
                    {!!card.title && (
                      <Typography variant="h2" gutterBottom>
                        {card.title}
                      </Typography>
                    )}

                    {!!card.description && (
                      <Typography sx={{ my: 2 }}>{card.description}</Typography>
                    )}

                    {!!card.visualizations && (
                      <DashboardVisualization
                        key={i}
                        referenceYearValue={card.referenceYearValue}
                        lastHistoricalYearValue={card.lastHistoricalYearValue}
                        goalValue={card.goalValue}
                        scenarioValues={card.scenarioValues ?? undefined}
                        visualizations={card.visualizations}
                        unit={card.unit}
                        metricDimensionCategoryValues={card.metricDimensionCategoryValues ?? []}
                      />
                    )}

                    {!!card.callToAction && (
                      <CallToActionCard
                        title={card.callToAction.title}
                        content={card.callToAction.content}
                        linkUrl={card.callToAction.linkUrl}
                      />
                    )}
                  </CardContent>
                </Card>
              )
          )}
        </Stack>
      </Container>
    </Box>
  );
}

export default DashboardPage;
