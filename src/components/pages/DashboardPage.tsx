import { useTheme } from '@emotion/react';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Container,
  Link as MuiLink,
  Stack,
  Typography,
} from '@mui/material';
import { readableColor } from 'polished';
import { ArrowRight } from 'react-bootstrap-icons';

import type {
  DashboardCardVisualizationsFragment,
  DashboardPageFieldsFragment,
  GetPageQuery,
} from '@/common/__generated__/graphql';
import { Link } from '@/common/links';

import DashboardNormalizationBar from '../general/DashboardNormalizationBar';
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
    type ScenarioProgressBarBlock = ProgressBarVisualization & {
      __typename: 'ScenarioProgressBarBlock';
    };

    return values.scenarioValues?.find(
      // TODO: Fix this type
      (scenario) => scenario?.scenario.id === (bar as ScenarioProgressBarBlock).scenarioId
    )?.value;
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
    return values.goalValue;
  }

  return null;
}

function DashboardVisualization({
  visualizations,
  referenceYearValue,
  lastHistoricalYearValue,
  goalValue,
  scenarioValues,
  unit,
}: DashboardVisualizationProps) {
  const values = {
    referenceYearValue,
    goalValue,
    scenarioValues,

    lastHistoricalYearValue,
  };

  if (visualizations.some(isProgressBar)) {
    const maxValue = Math.max(
      values.referenceYearValue ?? 0,
      values.goalValue ?? 0,
      values.lastHistoricalYearValue ?? 0,
      ...(scenarioValues?.map((scenario) => scenario?.value ?? 0) ?? [])
    );

    return (
      <DashboardVisualizationProgress
        items={visualizations
          .filter((visualization): visualization is ProgressBarVisualization =>
            isProgressBar(visualization)
          )
          .map((bar) => ({
            title: bar.title,
            chartLabel: bar.chartLabel,
            color: bar.color,
            value: getBarValue(bar, values),
            goalValue: getBarGoalValue(bar, values),
            max: maxValue,
            unit,
            description: bar.description,
          }))}
      />
    );
  }

  return visualizations.map((visualization) => {
    // if (visualization.visualizationType === 'emission_sources') {
    //   return <DashboardVisualizationEmissionSources progressBars={visualization.progressBars} />;
    // }

    // if (visualization.visualizationType === 'action_impact') {
    //   return <DashboardVisualizationActionImpact progressBars={visualization.progressBars} />;
    // }

    console.warn(`Unknown dashboard card visualization type: ${visualization?.__typename}`);

    return null;
  });
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

  console.log(page);

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
                        scenarioValues={card.scenarioValues}
                        visualizations={card.visualizations}
                        unit={card.unit}
                      />
                    )}

                    {!!card.callToAction && (
                      <MuiLink component={Link} href={card.callToAction.linkUrl}>
                        <Card
                          sx={{ backgroundColor: 'primary.main', color: 'primary.contrastText' }}
                        >
                          <CardContent>
                            <Typography variant="h3" gutterBottom sx={{ color: 'inherit' }}>
                              {card.callToAction.title}
                            </Typography>
                            <Typography>
                              {card.callToAction.content} <ArrowRight size={16} />
                            </Typography>
                          </CardContent>
                        </Card>
                      </MuiLink>
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
