import { useMemo } from 'react';

import { Alert, Box, TextField, Typography } from '@mui/material';

import type { EditorNodeFieldsFragment } from '@/common/__generated__/graphql';

type BasicInfoStepProps = {
  newActionId: string;
  newActionName: string;
  actionGroup: string;
  sourceAction: EditorNodeFieldsFragment | null;
  allNodes: readonly EditorNodeFieldsFragment[];
  onChange: (field: 'newActionId' | 'newActionName' | 'actionGroup', value: string) => void;
};

export default function BasicInfoStep({
  newActionId,
  newActionName,
  actionGroup,
  sourceAction,
  allNodes,
  onChange,
}: BasicInfoStepProps) {
  const existingIds = useMemo(() => new Set(allNodes.map((n) => n.identifier)), [allNodes]);

  const idCollision = newActionId !== '' && existingIds.has(newActionId);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="body1">
        Give the copied action a new identity. The ID must be unique within the model.
      </Typography>

      {sourceAction && (
        <Alert severity="info" variant="outlined">
          Copying from: <strong>{sourceAction.name}</strong> ({sourceAction.identifier})
        </Alert>
      )}

      <TextField
        required
        label="Action ID"
        value={newActionId}
        onChange={(e) => onChange('newActionId', e.target.value)}
        error={idCollision}
        helperText={
          idCollision
            ? 'This ID is already used by another node in the model.'
            : 'A unique snake_case identifier for this action.'
        }
        size="small"
        fullWidth
      />

      <TextField
        required
        label="Display Name"
        value={newActionName}
        onChange={(e) => onChange('newActionName', e.target.value)}
        helperText="Human-readable name shown in the UI."
        size="small"
        fullWidth
      />

      <TextField
        label="Action Group"
        value={actionGroup}
        onChange={(e) => onChange('actionGroup', e.target.value)}
        helperText="Optional grouping for organizing actions."
        size="small"
        fullWidth
      />
    </Box>
  );
}
