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

import { Link } from '@/common/links';

import DashboardNormalizationBar from '../general/DashboardNormalizationBar';
import DashboardVisualizationActionImpact from '../general/resident-dashboard/DashboardVisualizationActionImpact';
import DashboardVisualizationEmissionSources from '../general/resident-dashboard/DashboardVisualizationEmissionSources';
import DashboardVisualizationProgress from '../general/resident-dashboard/DashboardVisualizationProgress';
import mockClimateDashboardPage from './mock-climate-dashboard-page.json';

const page = mockClimateDashboardPage.data.page;

function DashboardVisualization({
  visualization,
}: {
  visualization: (typeof page)['dashboardCards'][number]['visualization'];
}) {
  if (visualization.visualizationType === 'progress') {
    return (
      <DashboardVisualizationProgress
        items={visualization.progressBars?.map((bar) => ({
          title: bar.label,
          chartLabel: bar.chartLabel,
          color: bar.color,
          value: bar.currentValue,
          targetValue: bar.targetValue,
          min: bar.minValue,
          max: bar.maxValue,
          unit: bar.unit,
          description: bar.description,
        }))}
      />
    );
  }

  if (visualization.visualizationType === 'emission_sources') {
    if (!visualization.emissionSources) {
      return null;
    }

    return (
      <DashboardVisualizationEmissionSources
        referenceYear={visualization.referenceYear}
        sources={visualization.emissionSources?.map((source) => ({
          id: source.node.id,
          name: source.node.name,
          color: source.node.color,
          value: source.node.value,
        }))}
        chartLabel="Emission sources"
      />
    );
  }

  if (visualization.visualizationType === 'action_impact' && 'referenceYear' in visualization) {
    if (!visualization.actions || !visualization.referenceYear) {
      return null;
    }

    return (
      <DashboardVisualizationActionImpact
        referenceYear={visualization.referenceYear}
        actions={visualization.actions.map((action) => ({
          id: action.node.id,
          name: action.node.name,
          color: action.node.color,
          value: action.node.value,
        }))}
        chartLabel="Action impact"
      />
    );
  }

  console.warn(`Unknown dashboard card visualization type: ${visualization.visualizationType}`);

  return null;
}

function CustomDashboardPage() {
  const theme = useTheme();

  const backgroundColor = page.backgroundColor ?? 'primary.light';
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

          {page.dashboardCards.map((card, i) => (
            <Card key={i}>
              {!!card.image?.url && <CardMedia sx={{ height: 300 }} image={card.image.url} />}
              <CardContent>
                {!!card.title && (
                  <Typography variant="h2" gutterBottom>
                    {card.title}
                  </Typography>
                )}

                {!!card.description && <Typography sx={{ my: 2 }}>{card.description}</Typography>}

                {!!card.visualization && (
                  <DashboardVisualization visualization={card.visualization} />
                )}

                {!!card.callToAction && (
                  <MuiLink component={Link} href={card.callToAction.linkUrl}>
                    <Card sx={{ backgroundColor: 'primary.main', color: 'primary.contrastText' }}>
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
          ))}
        </Stack>
      </Container>
    </Box>
  );
}

export default CustomDashboardPage;
