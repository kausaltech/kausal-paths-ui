import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import { Box, Chip, List, ListItem, ListItemIcon, ListItemText, Typography } from '@mui/material';

import type { DraftEdgeMapping, OutputMetric } from './types';

const METRIC_DISPLAY_LABELS: Record<string, string> = {
  currency: 'Cost',
  energy: 'Energy',
  emissions: 'Emissions',
  mileage: 'Mileage',
  fraction: 'Fraction',
};

type OutputsStepProps = {
  outputMetrics: OutputMetric[];
  edgeMappings: DraftEdgeMapping[];
};

export default function OutputsStep({ outputMetrics, edgeMappings }: OutputsStepProps) {
  const wiredPortIds = new Set(edgeMappings.map((e) => e.outputMetricPortId));

  return (
    <Box>
      <Typography variant="body1" sx={{ mb: 2 }}>
        These output metrics were copied from the source action. Metrics with existing edge mappings
        are shown as wired. Unwired metrics will need connections configured in the next step.
      </Typography>

      <List>
        {outputMetrics.map((metric) => {
          const isWired = wiredPortIds.has(metric.portId);
          const displayLabel = METRIC_DISPLAY_LABELS[metric.quantity] ?? metric.label;
          const targetCount = edgeMappings.filter(
            (e) => e.outputMetricPortId === metric.portId
          ).length;

          return (
            <ListItem
              key={metric.portId}
              secondaryAction={
                isWired ? (
                  <Chip
                    label={`${targetCount} target${targetCount !== 1 ? 's' : ''}`}
                    size="small"
                    color="success"
                    variant="outlined"
                  />
                ) : (
                  <Chip label="unwired" size="small" color="warning" variant="outlined" />
                )
              }
            >
              <ListItemIcon>
                {isWired ? <CheckCircleIcon color="success" /> : <LinkOffIcon color="warning" />}
              </ListItemIcon>
              <ListItemText
                primary={displayLabel}
                secondary={`Port: ${metric.portId}${metric.unit ? ` \u00b7 ${metric.unit}` : ''}`}
              />
            </ListItem>
          );
        })}
        {outputMetrics.length === 0 && (
          <ListItem>
            <ListItemText
              primary="No output metrics"
              secondary="The source action has no output ports defined."
            />
          </ListItem>
        )}
      </List>
    </Box>
  );
}
