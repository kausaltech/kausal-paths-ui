import { useState } from 'react';

import { useTheme } from '@emotion/react';
import {
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

import { SettingsToggleBar } from '@common/components/SettingsToggleBar';

import { Link } from '@/common/links';

import DashboardVisualizationProgress from './DashboardVisualizationProgress';
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
    // return <DashboardVisualizationEmissionSources progressBars={visualization.progressBars} />;
  }

  if (visualization.visualizationType === 'action_impact') {
    // return <DashboardVisualizationActionImpact progressBars={visualization.progressBars} />;
  }

  console.warn(`Unknown dashboard card visualization type: ${visualization.visualizationType}`);

  return null;
}

function CustomDashboardPage() {
  const [perInhabitant, setPerInhabitant] = useState(false);
  const theme = useTheme();

  const backgroundColor = page.backgroundColor ?? 'primary.light';
  const textColor = page.backgroundColor
    ? readableColor(page.backgroundColor, theme.textColor.primary, theme.themeColors.white)
    : 'primary.contrastText';

  return (
    <Container maxWidth="lg" sx={{ py: 4, backgroundColor: backgroundColor }}>
      <Stack spacing={2}>
        {!!page.title && (
          <Typography variant="h1" color={textColor}>
            {page.title}
          </Typography>
        )}

        <SettingsToggleBar
          title="Display"
          label="Values per inhabitant"
          value={perInhabitant}
          onChange={setPerInhabitant}
        />

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
  );
}

export default CustomDashboardPage;
