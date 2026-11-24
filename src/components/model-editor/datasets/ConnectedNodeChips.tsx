import { Box } from '@mui/material';

import type { DatasetConnectedNodesQuery } from '@/common/__generated__/graphql';
import { getNodeStyle } from '../ElkNode';
import { ConnectedNodeChip } from '../node-details/shared';

export type ConnectedNode = DatasetConnectedNodesQuery['instance']['model']['nodes'][number];

type ConnectedNodeChipsProps = {
  nodes: readonly ConnectedNode[];
  onNavigateToNode: (nodeId: string) => void;
  justify?: 'flex-start' | 'flex-end';
};

/** The nodes bound to a dataset, as chips that open the node in the model editor. */
export function ConnectedNodeChips({
  nodes,
  onNavigateToNode,
  justify = 'flex-start',
}: ConnectedNodeChipsProps) {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, justifyContent: justify }}>
      {nodes.map((node) => {
        const nodeClass =
          node.editor?.spec?.typeConfig && 'nodeClass' in node.editor.spec.typeConfig
            ? node.editor.spec.typeConfig.nodeClass
            : (node.editor?.nodeType ?? '');
        const isOutcome = node.__typename === 'Node' ? (node.isOutcome ?? false) : false;
        const style = getNodeStyle(node.kind ?? '', nodeClass, isOutcome);
        return (
          <ConnectedNodeChip
            key={node.id}
            nodeId={node.id}
            label={node.name ?? node.id}
            style={style}
            onSelect={onNavigateToNode}
            onHover={() => {}}
          />
        );
      })}
    </Box>
  );
}
