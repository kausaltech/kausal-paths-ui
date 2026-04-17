import { useState } from 'react';

import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  TextField,
  Typography,
} from '@mui/material';

import type { EditorNodeFieldsFragment } from '@/common/__generated__/graphql';
import type { DraftEdgeMapping, OutputMetric } from './types';

type EdgeConfigStepProps = {
  edgeMappings: DraftEdgeMapping[];
  outputMetrics: OutputMetric[];
  allNodes: readonly EditorNodeFieldsFragment[];
  onUpdate: (mappings: DraftEdgeMapping[]) => void;
};

export default function EdgeConfigStep({
  edgeMappings,
  outputMetrics,
  allNodes: _allNodes,
  onUpdate,
}: EdgeConfigStepProps) {
  const [expanded, setExpanded] = useState<string | false>(false);

  const metricsByPort = new Map(outputMetrics.map((m) => [m.portId, m]));

  const handleDelete = (id: string) => {
    onUpdate(edgeMappings.filter((e) => e.id !== id));
  };

  const handleFieldChange = (id: string, field: keyof DraftEdgeMapping, value: string) => {
    onUpdate(edgeMappings.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  };

  return (
    <Box>
      <Typography variant="body1" sx={{ mb: 2 }}>
        Configure how each output metric is routed to its target node. These mappings were copied
        from the source action and can be edited, removed, or extended.
      </Typography>

      {edgeMappings.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
          No edge mappings. The source action had no outgoing edges.
        </Typography>
      )}

      {edgeMappings.map((mapping) => {
        const metric = metricsByPort.get(mapping.outputMetricPortId);
        const metricLabel = metric?.label ?? mapping.outputMetricPortId;

        return (
          <Accordion
            key={mapping.id}
            expanded={expanded === mapping.id}
            onChange={(_, isExpanded) => setExpanded(isExpanded ? mapping.id : false)}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                <Typography sx={{ flexShrink: 0 }}>{metricLabel}</Typography>
                <Typography color="text.secondary" sx={{ mx: 0.5 }}>
                  &rarr;
                </Typography>
                <Typography sx={{ flexGrow: 1 }}>{mapping.targetNodeName}</Typography>
                {mapping.tags.length > 0 &&
                  mapping.tags.map((tag) => (
                    <Chip key={tag} label={tag} size="small" variant="outlined" />
                  ))}
                <Box
                  component="span"
                  role="button"
                  tabIndex={0}
                  sx={{
                    cursor: 'pointer',
                    display: 'inline-flex',
                    p: 0.5,
                    borderRadius: 1,
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(mapping.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.stopPropagation();
                      handleDelete(mapping.id);
                    }
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Target Node"
                  value={mapping.targetNodeName}
                  size="small"
                  fullWidth
                  disabled
                  helperText={`Node ID: ${mapping.targetNodeId}`}
                />
                <TextField
                  label="Target Port"
                  value={mapping.targetPortId}
                  onChange={(e) => handleFieldChange(mapping.id, 'targetPortId', e.target.value)}
                  size="small"
                  fullWidth
                />
                <Typography variant="caption" color="text.secondary">
                  Dimension flattening and category mapping will be configurable when the backend
                  supports transformation editing.
                </Typography>
              </Box>
            </AccordionDetails>
          </Accordion>
        );
      })}

      <Box sx={{ mt: 2 }}>
        <Button variant="outlined" size="small" disabled>
          Add edge mapping
        </Button>
        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
          Available when backend mutations are ready
        </Typography>
      </Box>
    </Box>
  );
}
