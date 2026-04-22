import { Alert, Box, Divider, List, ListItem, ListItemText, Typography } from '@mui/material';

import type { WizardState } from './types';

type ReviewStepProps = {
  state: WizardState;
};

export default function ReviewStep({ state }: ReviewStepProps) {
  const warnings: string[] = [];

  if (!state.newActionId) warnings.push('Action ID is required.');
  if (!state.newActionName) warnings.push('Display name is required.');
  if (state.dataSource.type === 'existing' && !state.dataSource.datasetId) {
    warnings.push('No dataset selected.');
  }
  if (state.outputMetrics.length === 0) {
    warnings.push('No output metrics defined.');
  }

  const wiredPortIds = new Set(state.edgeMappings.map((e) => e.outputMetricPortId));
  const unwiredMetrics = state.outputMetrics.filter((m) => !wiredPortIds.has(m.portId));
  if (unwiredMetrics.length > 0) {
    warnings.push(
      `${unwiredMetrics.length} output metric${unwiredMetrics.length !== 1 ? 's' : ''} not connected to any target node.`
    );
  }

  return (
    <Box>
      <Typography variant="body1" sx={{ mb: 2 }}>
        Review the new action before saving.
      </Typography>

      {warnings.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
            Unresolved warnings
          </Typography>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </Alert>
      )}

      <List dense>
        <ListItem>
          <ListItemText primary="Source action" secondary={state.sourceAction?.name ?? 'None'} />
        </ListItem>
        <Divider component="li" />

        <ListItem>
          <ListItemText primary="Action ID" secondary={state.newActionId || '\u2014'} />
        </ListItem>
        <ListItem>
          <ListItemText primary="Display Name" secondary={state.newActionName || '\u2014'} />
        </ListItem>
        <ListItem>
          <ListItemText primary="Group" secondary={state.actionGroup || '\u2014'} />
        </ListItem>
        <Divider component="li" />

        <ListItem>
          <ListItemText
            primary="Data source"
            secondary={
              state.dataSource.type === 'existing'
                ? `${state.dataSource.datasetId || 'Not set'} [${state.dataSource.selectorColumn}=${state.dataSource.selectorValue || '?'}]`
                : 'New dedicated dataset'
            }
          />
        </ListItem>
        <Divider component="li" />

        <ListItem>
          <ListItemText
            primary="Output metrics"
            secondary={`${state.outputMetrics.length} metric${state.outputMetrics.length !== 1 ? 's' : ''}`}
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary="Edge mappings"
            secondary={`${state.edgeMappings.length} connection${state.edgeMappings.length !== 1 ? 's' : ''} to target nodes`}
          />
        </ListItem>
      </List>
    </Box>
  );
}
