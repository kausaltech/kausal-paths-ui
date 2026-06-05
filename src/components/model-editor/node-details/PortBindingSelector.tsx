import { useState } from 'react';

import { Box, Tab, Tabs, Typography } from '@mui/material';

import type { EditorNodeFieldsFragment } from '@/common/__generated__/graphql';
import { getNodeStyle } from '../ElkNode';
import type { InputPort } from '../nodeHelpers';
import DatasetSelector from './DatasetSelector';
import NodeSelector from './NodeSelector';
import { ConnectedNodeChip, getStyleForNode } from './shared';

/** A node already bound to the port via an existing edge. */
export type CurrentInputSource = {
  /** Edge id, used to unbind. */
  edgeId: string;
  /** Resolved source node, or null when it can't be found in the model. */
  node: EditorNodeFieldsFragment | null;
  /** Source node reference (identifier), shown when `node` is unresolved. */
  nodeRef: string;
};

type Props = {
  port: InputPort;
  nodes: readonly EditorNodeFieldsFragment[];
  currentNodeId: string;
  currentSources?: readonly CurrentInputSource[];
  removingEdgeId?: string | null;
  onSelectNode?: (nodeId: string) => void;
  onSelectDataset?: (datasetId: string, metricId: string) => void;
  onRemoveSource?: (edgeId: string) => void;
};

type SourceKind = 'node' | 'dataset';

function CriterionRow({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: 'flex', gap: 1, fontSize: 11, alignItems: 'baseline' }}>
      <Typography
        variant="caption"
        sx={{ fontSize: 10, color: 'text.secondary', minWidth: 96, flexShrink: 0 }}
      >
        {label}
      </Typography>
      <Typography variant="caption" sx={{ fontSize: 11 }}>
        {value}
      </Typography>
    </Box>
  );
}

function PortCriteria({ port }: { port: InputPort }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 0.25,
        p: 1,
        bgcolor: 'grey.100',
        borderRadius: 0.5,
      }}
    >
      <Typography
        variant="caption"
        sx={{ fontSize: 10, color: 'text.secondary', textTransform: 'uppercase', mb: 0.25 }}
      >
        Port requirements
      </Typography>
      <CriterionRow label="Quantity" value={port.quantity ?? '—'} />
      <CriterionRow label="Unit" value={port.unit?.short ?? '—'} />
      <CriterionRow
        label="Required dims"
        value={port.requiredDimensions.length ? port.requiredDimensions.join(', ') : '—'}
      />
      <CriterionRow
        label="Supported dims"
        value={port.supportedDimensions.length ? port.supportedDimensions.join(', ') : '—'}
      />
    </Box>
  );
}

export default function PortBindingSelector({
  port,
  nodes,
  currentNodeId,
  currentSources,
  removingEdgeId,
  onSelectNode,
  onSelectDataset,
  onRemoveSource,
}: Props) {
  const [tab, setTab] = useState<SourceKind>('node');

  const excludeNodeIds = new Set(
    (currentSources ?? []).map((s) => s.node?.id).filter((id): id is string => id != null)
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {currentSources && currentSources.length > 0 && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5,
            p: 1,
            bgcolor: 'grey.100',
            borderRadius: 0.5,
          }}
        >
          <Typography
            variant="caption"
            sx={{ fontSize: 10, color: 'text.secondary', textTransform: 'uppercase' }}
          >
            Current input source
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {currentSources.map((source) => (
              <ConnectedNodeChip
                key={source.edgeId}
                nodeId={source.node?.id ?? source.nodeRef}
                label={source.node?.name ?? source.nodeRef}
                style={source.node ? getStyleForNode(source.node) : getNodeStyle('', '', false)}
                onSelect={() => {
                  /* the current source is not re-selectable */
                }}
                onHover={() => {
                  /* hover highlighting is graph-panel behavior; no-op here */
                }}
                onDelete={onRemoveSource ? () => onRemoveSource(source.edgeId) : undefined}
                deleting={removingEdgeId === source.edgeId}
              />
            ))}
          </Box>
        </Box>
      )}
      <PortCriteria port={port} />
      <Tabs
        value={tab}
        onChange={(_, next: SourceKind) => setTab(next)}
        variant="fullWidth"
        sx={{ minHeight: 32, '& .MuiTab-root': { minHeight: 32, fontSize: 12 } }}
      >
        <Tab value="node" label="Nodes" />
        <Tab value="dataset" label="Datasets" />
      </Tabs>
      {tab === 'node' ? (
        <NodeSelector
          nodes={nodes}
          port={port}
          currentNodeId={currentNodeId}
          excludeNodeIds={excludeNodeIds}
          onSelect={onSelectNode}
        />
      ) : (
        <DatasetSelector port={port} onSelect={onSelectDataset} />
      )}
    </Box>
  );
}
