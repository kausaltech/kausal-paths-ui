import { useTheme } from '@emotion/react';
import { Box, Card, CardContent, CardMedia, Container, Stack, Typography } from '@mui/material';
import { readableColor } from 'polished';

import {
  type DashboardCardVisualizationsFragment,
  type MetricDimensionCategoryValueFieldsFragment as DimensionCategory,
  DimensionKind,
  type PageQuery,
  type ScenarioActionImpactsFieldsFragment,
  type ScenarioValueFieldsFragment,
} from '@/common/__generated__/graphql';

import CallToActionCard from '../common/CallToActionCard';
import { PageHero } from '../common/PageHero';
import DashboardNormalizationBar from '../general/DashboardNormalizationBar';
import DashboardVisualizationActionImpact from '../general/resident-dashboard/DashboardVisualizationActionImpact';
import DashboardVisualizationDimension from '../general/resident-dashboard/DashboardVisualizationDimension';
import DashboardVisualizationProgress, {
  type DashboardProgressItem,
  type ProgressType,
} from '../general/resident-dashboard/DashboardVisualizationProgress';

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
  goalValues?: ({ year: number; value: number } | null)[];
  scenarioValues?: ScenarioValueFieldsFragment[];
  unit?: {
    short: string;
    htmlShort: string;
    htmlLong: string;
  };
  metricDimensionCategoryValues: (DimensionCategory | null)[];
  scenarioActionImpacts: (ScenarioActionImpactsFieldsFragment | null)[];
};

type Visualization = NonNullable<DashboardCardVisualizations[0]>;

type CategoryBreakdownVisualization = Visualization & {
  __typename: 'CategoryBreakdownBlock';
};

type BarValues = {
  scenarioValues: ScenarioValueFieldsFragment[] | undefined;
  goalValue: number | null;
  lastHistoricalYearValue: number | null;
  referenceYearValue: number | null;
};

const isProgressBar = (
  visualization: DashboardCardVisualizations[number]
): visualization is ProgressBarVisualization =>
  PROGRESS_BAR_TYPES.includes(visualization?.__typename ?? '');

function getBarValue(bar: ProgressBarVisualization, values: BarValues) {
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

function getBarGoalValue(bar: ProgressBarVisualization, values: BarValues) {
  if (bar.__typename === 'ScenarioProgressBarBlock') {
    return values.goalValue ?? undefined;
  }

  return undefined;
}

function roundValue(value: number | null | undefined) {
  return value ? Math.round(value) : null;
}

const filterBySelectedDimension =
  (visualization: CategoryBreakdownVisualization) =>
  (value: DimensionCategory | null): value is DimensionCategory & { value: number } =>
    // If the dimensionId is empty, we default to the node dimension
    visualization.dimensionId === ''
      ? value?.dimension.kind === DimensionKind.Node && value.value !== null
      : value?.dimension.originalId === visualization.dimensionId && value.value !== null;

function DashboardVisualization({
  visualizations,
  referenceYearValue,
  lastHistoricalYearValue,
  goalValues,
  scenarioValues,
  unit,
  metricDimensionCategoryValues,
  scenarioActionImpacts,
}: DashboardVisualizationProps) {
  const goalCount = goalValues?.length ?? 0;
  // In cases where there are multiple goal values, we display the last one
  const goal = goalCount > 0 ? goalValues?.[goalCount - 1] : undefined;
  const goalValue = goal?.value;

  const values = {
    referenceYearValue: roundValue(referenceYearValue),
    goalValue: roundValue(goalValue),
    scenarioValues: scenarioValues?.map((scenario) => ({
      ...scenario,
      value: roundValue(scenario.value),
    })),
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
      scenarioValues={scenarioValues ?? undefined}
      unit={unit ?? undefined}
      maxValue={maxValue}
      goalYear={goal?.year}
      items={progressVisualizations.map(
        (viz): DashboardProgressItem => ({
          type: viz.__typename as ProgressType,
          title: viz.title,
          chartLabel: viz.chartLabel,
          color: viz.color ?? undefined,
          value: getBarValue(viz, values) ?? undefined,
          goalValue: getBarGoalValue(viz, values),
          description: viz.description ?? undefined,
          scenarioId: viz.__typename === 'ScenarioProgressBarBlock' ? viz.scenarioId : undefined,
        })
      )}
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
        if (visualization?.__typename === 'CategoryBreakdownBlock') {
          return (
            <DashboardVisualizationDimension
              key={visualization.id}
              chartLabel={visualization.title}
              unit={unit?.short}
              data={metricDimensionCategoryValues
                .filter(filterBySelectedDimension(visualization))
                .map((value) => ({
                  id: value.category.id,
                  name: value.category.label,
                  color: value.category.color ?? undefined,
                  value: value.value,
                  year: value.year,
                }))}
            />
          );
        }

        if (visualization?.__typename === 'ActionImpactBlock') {
          return (
            <DashboardVisualizationActionImpact
              key={visualization.id}
              unit={unit?.short}
              chartLabel={visualization.title}
              actions={
                scenarioActionImpacts
                  .filter((impact) => impact?.scenario.id === visualization.scenarioId)
                  .flatMap(
                    (impact) =>
                      impact?.impacts.map((impact) => ({
                        id: impact.action.id,
                        name: impact.action.shortName ?? impact.action.name,
                        isEnabled: impact.action.isEnabled,
                        value: impact.value,
                        color: impact.action.color ?? undefined,
                        group: impact.action.group ?? undefined,
                        year: impact.year,
                      })) ?? []
                  ) ?? []
              }
            />
          );
        }

        console.warn(`Unknown dashboard card visualization type: ${visualization?.__typename}`);

        return null;
      })}
    </>
  );
}

type Props = {
  page: PageQuery['page'];
};

function DashboardPage({ page }: Props) {
  const theme = useTheme();

  if (page?.__typename !== 'DashboardPage') {
    console.error('Tried to render a DashboardPage with the wrong page type');
    return null;
  }

  const title = page.introTitle || page.title;
  const backgroundColor: string = page.backgroundColor ?? 'primary.light';
  const textColor = page.backgroundColor
    ? readableColor(page.backgroundColor, theme.textColor.primary, theme.themeColors.white)
    : 'primary.contrastText';

  return (
    <>
      {!!page.introParagraph && (
        <PageHero
          CardStyles={{ mb: '0 !important' }}
          leadTitle={title}
          leadDescription={page.introParagraph}
        />
      )}

      <Box sx={{ py: 3, backgroundColor: backgroundColor }}>
        <Container fixed maxWidth="lg">
          <Stack spacing={3}>
            {!page.introParagraph && (
              <Typography variant="h1" color={textColor}>
                {title}
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
                          goalValues={card.goalValues ?? undefined}
                          scenarioValues={
                            card.scenarioValues?.filter((scenario) => scenario !== null) ??
                            undefined
                          }
                          visualizations={card.visualizations}
                          unit={card.unit}
                          metricDimensionCategoryValues={card.metricDimensionCategoryValues ?? []}
                          scenarioActionImpacts={card.scenarioActionImpacts ?? []}
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
    </>
  );
}

export default DashboardPage;
