import { useState } from 'react';

import { Box, Tab, Tabs, Typography } from '@mui/material';

import type { EditorNodeFieldsFragment } from '@/common/__generated__/graphql';
import type { getNodeSpec } from '../nodeHelpers';
import DatasetSelector from './DatasetSelector';
import NodeSelector from './NodeSelector';

type NodeSpec = NonNullable<ReturnType<typeof getNodeSpec>>;
type InputPort = NodeSpec['inputPorts'][number];

type Props = {
  port: InputPort;
  nodes: readonly EditorNodeFieldsFragment[];
  currentNodeId: string;
  onSelectNode?: (nodeId: string) => void;
  onSelectDataset?: (datasetId: string, metricId: string) => void;
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
  onSelectNode,
  onSelectDataset,
}: Props) {
  const [tab, setTab] = useState<SourceKind>('node');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
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
          onSelect={onSelectNode}
        />
      ) : (
        <DatasetSelector port={port} onSelect={onSelectDataset} />
      )}
    </Box>
  );
}
