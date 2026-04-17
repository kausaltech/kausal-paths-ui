import { useMemo, useState } from 'react';

import SearchIcon from '@mui/icons-material/Search';
import {
  Box,
  Chip,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  TextField,
  Typography,
} from '@mui/material';

import type { EditorNodeFieldsFragment } from '@/common/__generated__/graphql';

type CopyActionStepProps = {
  nodes: readonly EditorNodeFieldsFragment[];
  selectedAction: EditorNodeFieldsFragment | null;
  onSelect: (action: EditorNodeFieldsFragment) => void;
};

export default function CopyActionStep({ nodes, selectedAction, onSelect }: CopyActionStepProps) {
  const [search, setSearch] = useState('');

  const actionNodes = useMemo(
    () =>
      nodes
        .filter((n) => n.__typename === 'ActionNode')
        .sort((a, b) => a.name.localeCompare(b.name)),
    [nodes]
  );

  const filtered = useMemo(() => {
    if (!search) return actionNodes;
    const q = search.toLowerCase();
    return actionNodes.filter(
      (n) => n.name.toLowerCase().includes(q) || n.identifier.toLowerCase().includes(q)
    );
  }, [actionNodes, search]);

  return (
    <Box>
      <Typography variant="body1" sx={{ mb: 2 }}>
        Select an existing action to use as a template. The new action will inherit its structure,
        output metrics, and edge mappings as editable drafts.
      </Typography>

      <TextField
        fullWidth
        size="small"
        placeholder="Filter actions..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
        sx={{ mb: 1 }}
      />

      <Box
        sx={{
          maxHeight: 400,
          overflow: 'auto',
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
        }}
      >
        <List dense disablePadding>
          {filtered.map((action) => {
            const spec = action.editor?.spec;
            const typeConfig = spec?.typeConfig;
            const nodeClass =
              typeConfig && 'nodeClass' in typeConfig
                ? typeConfig.nodeClass
                : (action.editor?.nodeType ?? '');
            const outputCount = spec?.outputPorts.length ?? 0;
            const isSelected = selectedAction?.id === action.id;

            return (
              <ListItemButton
                key={action.id}
                selected={isSelected}
                onClick={() => onSelect(action)}
              >
                <ListItemText primary={action.name} secondary={action.identifier} />
                <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
                  <Chip label={nodeClass} size="small" variant="outlined" />
                  <Chip
                    label={`${outputCount} output${outputCount !== 1 ? 's' : ''}`}
                    size="small"
                  />
                </Box>
              </ListItemButton>
            );
          })}
          {filtered.length === 0 && (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No actions found
              </Typography>
            </Box>
          )}
        </List>
      </Box>

      {selectedAction && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'action.selected', borderRadius: 1 }}>
          <Typography variant="subtitle2">Selected: {selectedAction.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {selectedAction.identifier}
            {selectedAction.editor?.nodeGroup &&
              ` \u00b7 Group: ${selectedAction.editor.nodeGroup}`}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
