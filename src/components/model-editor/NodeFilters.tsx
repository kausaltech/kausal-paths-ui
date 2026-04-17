import { Box, FormControl, InputLabel, MenuItem, Paper, Select } from '@mui/material';

import type { EditorNodeFieldsFragment } from '@/common/__generated__/graphql';

export type NodeFilterState = {
  outcomeId: string | null;
};

export const emptyNodeFilters: NodeFilterState = {
  outcomeId: null,
};

const ALL_OUTCOMES_VALUE = '__all__';

type Props = {
  value: NodeFilterState;
  onChange: (next: NodeFilterState) => void;
  outcomeNodes: readonly EditorNodeFieldsFragment[];
};

export default function NodeFilters({ value, onChange, outcomeNodes }: Props) {
  const showOutcomeFilter = outcomeNodes.length > 1;

  if (!showOutcomeFilter) return null;

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'absolute',
        top: 60,
        left: 12,
        zIndex: (theme) => theme.zIndex.appBar,
        borderRadius: 1,
      }}
    >
      <Box sx={{ display: 'flex', gap: 1, p: 1, alignItems: 'center', flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel id="outcome-select-label">Outcome node</InputLabel>
          <Select
            labelId="outcome-select-label"
            label="Outcome node"
            value={value.outcomeId ?? ALL_OUTCOMES_VALUE}
            onChange={(e) =>
              onChange({
                ...value,
                outcomeId: e.target.value === ALL_OUTCOMES_VALUE ? null : e.target.value,
              })
            }
          >
            <MenuItem value={ALL_OUTCOMES_VALUE}>All outcomes</MenuItem>
            {outcomeNodes.map((n) => (
              <MenuItem key={n.id} value={n.id}>
                {n.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    </Paper>
  );
}
