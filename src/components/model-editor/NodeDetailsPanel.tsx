import { useCallback, useState } from 'react';

import { Box, Chip, IconButton, Typography } from '@mui/material';

import { gql } from '@apollo/client';
import { useQuery, useReactiveVar } from '@apollo/client/react';
import { useReactFlow } from '@xyflow/react';
import { useTranslations } from 'next-intl';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import 'overlayscrollbars/styles/overlayscrollbars.css';
import { BarChartLine, ExclamationTriangleFill, X, XCircleFill } from 'react-bootstrap-icons';

import {
  type EditorNodeEdgeFragment,
  type EditorNodeFieldsFragment,
  NodeErrorPhase,
  NodeStatus,
} from '@/common/__generated__/graphql';
import { useSession } from '@/lib/auth-client';
import NodeChangeHistorySection from './NodeChangeHistorySection';
import NodeDetailsSection, { NodeContentSection } from './NodeDetailsSection';
import { mockNodeEditsVar } from './mockEdits';
import NodeInputPortsSection from './node-details/NodeInputPortsSection';
import NodeOutputPortsSection from './node-details/NodeOutputPortsSection';
import { CollapsibleSection, getStyleForNode } from './node-details/shared';
import { getNodeGroup, getNodeSpec } from './nodeHelpers';
import { type NodeStatusEntry, nodeStatusVar } from './queries';

const GET_NODE_EXPLANATION = gql`
  query NodeExplanation($node: ID!) {
    node(id: $node) {
      id
      explanation
      parameters {
        __typename
        id
        nodeRelativeId
        ... on StringParameterType {
          stringValue: value
        }
      }
    }
  }
`;

type NodeExplanationParameter = {
  __typename: string;
  id: string;
  nodeRelativeId: string | null;
  stringValue?: string | null;
};

type NodeExplanationQuery = {
  node: {
    id: string;
    explanation: string | null;
    parameters: NodeExplanationParameter[];
  } | null;
};

/**
 * Fault-tolerance status for a node: a severity line plus a list of errors,
 * each tagged with the phase (setup vs calculation) it arose in. Rendered only
 * when the node's status is not OK.
 */
function NodeProblemsContent({
  entry,
  t,
}: {
  entry: NodeStatusEntry;
  t: ReturnType<typeof useTranslations<'model-editor'>>;
}) {
  const isError = entry.status === NodeStatus.Failed;
  const color = isError ? 'error.main' : 'warning.main';
  const StatusIcon = isError ? XCircleFill : ExclamationTriangleFill;
  const statusLabel =
    entry.status === NodeStatus.Failed
      ? t('nodes-status-failed')
      : entry.status === NodeStatus.Incomplete
        ? t('nodes-status-incomplete')
        : t('nodes-status-degraded');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color }}>
        <StatusIcon size={16} />
        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 13 }}>
          {statusLabel}
        </Typography>
        {entry.pending && (
          <Typography variant="caption" sx={{ ml: 'auto', color: 'text.secondary' }}>
            {t('nodes-status-checking')}
          </Typography>
        )}
      </Box>
      {entry.errors.map((err, i) => (
        <Box key={i} sx={{ display: 'flex', gap: 0.75, alignItems: 'flex-start' }}>
          <Chip
            label={
              err.phase === NodeErrorPhase.Initialization
                ? t('nodes-problem-phase-init')
                : t('nodes-problem-phase-compute')
            }
            size="small"
            sx={{ height: 18, fontSize: 10, flexShrink: 0, '& .MuiChip-label': { px: 0.75 } }}
          />
          <Typography
            variant="body2"
            sx={{
              fontSize: 12,
              lineHeight: 1.4,
              wordBreak: 'break-word',
              overflowWrap: 'anywhere',
            }}
          >
            {err.message}
          </Typography>
        </Box>
      ))}
      {entry.errors.length === 0 && (
        <Typography variant="body2" sx={{ fontSize: 12, color: 'text.secondary' }}>
          {t('nodes-problem-no-detail')}
        </Typography>
      )}
    </Box>
  );
}

export type ActionGroupOption = { id: string; name: string; color: string | null };

export type NodeDetailsPanelProps = {
  node: EditorNodeFieldsFragment | null;
  allNodes: readonly EditorNodeFieldsFragment[];
  edges: readonly EditorNodeEdgeFragment[];
  actionGroups: readonly ActionGroupOption[];
  onClose: () => void;
  onSelectNode: (nodeId: string) => void;
  onShowMetrics?: (nodeId: string, nodeName: string | null) => void;
  onShowDataset?: (bindingId: string) => void;
};

export default function NodeDetailsPanel({
  node,
  allNodes,
  edges,
  actionGroups,
  onClose,
  onSelectNode,
  onShowMetrics,
  onShowDataset,
}: NodeDetailsPanelProps) {
  const t = useTranslations('model-editor');
  const { setCenter, getZoom, getNodes } = useReactFlow();
  const nodeEdits = useReactiveVar(mockNodeEditsVar);
  const statusEntry = useReactiveVar(nodeStatusVar)[node?.id ?? ''];
  const { data: session } = useSession();
  const editorUserName = session?.user?.name ?? session?.user?.email ?? t('common-unknown-user');
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [problemsOpen, setProblemsOpen] = useState(true);
  const [contentOpen, setContentOpen] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [explanationOpen, setExplanationOpen] = useState(true);
  const [inputOpen, setInputOpen] = useState(true);
  const [outputOpen, setOutputOpen] = useState(true);
  const [nodeDataOpen, setNodeDataOpen] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);

  const currentEdit = node ? nodeEdits[node.id] : undefined;
  const displayName = node?.name ?? '';

  const { data: explanationData } = useQuery<NodeExplanationQuery>(GET_NODE_EXPLANATION, {
    variables: { node: node?.id ?? '' },
    skip: !node?.id,
  });
  const explanation = explanationData?.node?.explanation ?? null;

  const handleNavigateToNode = useCallback(
    (targetNodeId: string) => {
      const rfNodes = getNodes();
      const targetRfNode = rfNodes.find((n) => n.id === targetNodeId);
      if (targetRfNode) {
        const width = targetRfNode.measured?.width ?? targetRfNode.width ?? 0;
        const height = targetRfNode.measured?.height ?? targetRfNode.height ?? 0;
        const cx = targetRfNode.position.x + width / 2;
        const cy = targetRfNode.position.y + height / 2;
        void setCenter(cx, cy, { zoom: getZoom(), duration: 400 });
      }
      onSelectNode(targetNodeId);
    },
    [getNodes, setCenter, getZoom, onSelectNode]
  );

  const handleHover = useCallback((nodeId: string | null) => {
    setHoveredNodeId(nodeId);
  }, []);

  if (!node) return null;

  const nodeMap = new Map(allNodes.map((n) => [n.id, n]));
  const spec = getNodeSpec(node);

  const nodeGroupOptions = Array.from(
    new Set(allNodes.map((n) => getNodeGroup(n)).filter((g): g is string => g != null && g !== ''))
  ).sort();

  const incomingByPort = new Map<string, EditorNodeEdgeFragment[]>();
  for (const e of edges.filter((e) => e.toRef.nodeId === node.id)) {
    const portId = e.toRef.portId;
    const list = incomingByPort.get(portId) ?? [];
    list.push(e);
    incomingByPort.set(portId, list);
  }

  const outgoingByPort = new Map<string, EditorNodeEdgeFragment[]>();
  for (const e of edges.filter((e) => e.fromRef.nodeId === node.id)) {
    const portId = e.fromRef.portId;
    const list = outgoingByPort.get(portId) ?? [];
    list.push(e);
    outgoingByPort.set(portId, list);
  }

  const inputPorts = spec?.inputPorts ?? [];
  const outputPorts = spec?.outputPorts ?? [];
  const formula =
    explanationData?.node?.parameters?.find(
      (p) => p.__typename === 'StringParameterType' && p.nodeRelativeId === 'formula'
    )?.stringValue ?? null;

  const headerStyle = getStyleForNode(node);

  return (
    <Box sx={{ p: 0 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1,
          mb: 1,
          px: 2,
          py: 1.5,
          backgroundColor: 'grey.100',
          borderBottom: `2px solid ${headerStyle.border}`,
        }}
      >
        <Box
          sx={{
            color: headerStyle.border,
            display: 'flex',
            alignItems: 'center',
            '& .MuiSvgIcon-root': { fontSize: 20 },
            mt: '2px',
          }}
        >
          {headerStyle.icon}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              color: headerStyle.border,
              fontWeight: 600,
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              lineHeight: 1,
              mb: 0.5,
            }}
          >
            {headerStyle.label}
          </Typography>
          <Typography variant="h6" sx={{ fontSize: 16, fontWeight: 600, lineHeight: 1.3 }}>
            {displayName}
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ mt: '-4px', mr: '-4px' }}>
          <X size={20} />
        </IconButton>
      </Box>

      {statusEntry && statusEntry.status !== NodeStatus.Ok && (
        <CollapsibleSection
          title={t('nodes-problems')}
          open={problemsOpen}
          onToggle={() => setProblemsOpen((v) => !v)}
        >
          <NodeProblemsContent entry={statusEntry} t={t} />
        </CollapsibleSection>
      )}

      <CollapsibleSection
        title={t('nodes-content')}
        open={contentOpen}
        onToggle={() => setContentOpen((v) => !v)}
      >
        <NodeContentSection node={node} editorUserName={editorUserName} currentEdit={currentEdit} />
      </CollapsibleSection>

      <CollapsibleSection
        title={t('nodes-details')}
        open={detailsOpen}
        onToggle={() => setDetailsOpen((v) => !v)}
      >
        <NodeDetailsSection
          node={node}
          editorUserName={editorUserName}
          currentEdit={currentEdit}
          nodeGroupOptions={nodeGroupOptions}
          actionGroupOptions={actionGroups}
        />
      </CollapsibleSection>

      <NodeChangeHistorySection
        nodeId={node.id}
        open={historyOpen}
        onToggle={() => setHistoryOpen((v) => !v)}
      />

      {explanation && (
        <CollapsibleSection
          title={t('nodes-explanation')}
          open={explanationOpen}
          onToggle={() => setExplanationOpen((v) => !v)}
        >
          <Box
            sx={{
              width: '100%',
              bgcolor: 'grey.100',
              borderRadius: 0.5,
            }}
          >
            <OverlayScrollbarsComponent
              defer
              options={{
                scrollbars: { autoHide: 'never' },
                overflow: { x: 'hidden', y: 'scroll' },
              }}
              style={{ maxHeight: 300 }}
            >
              <Box
                sx={{
                  px: 1,
                  py: 0.5,
                  fontSize: 12,
                  lineHeight: 1.5,
                  wordBreak: 'break-word',
                  overflowWrap: 'anywhere',
                  '& p': { m: 0, mb: 1 },
                  '& p:last-child': { mb: 0 },
                  '& pre, & code': { whiteSpace: 'pre-wrap', wordBreak: 'break-word' },
                  '& img, & table': { maxWidth: '100%' },
                }}
                dangerouslySetInnerHTML={{ __html: explanation }}
              />
            </OverlayScrollbarsComponent>
          </Box>
        </CollapsibleSection>
      )}

      <NodeInputPortsSection
        currentNodeId={node.id}
        ports={inputPorts}
        incomingByPort={incomingByPort}
        nodeMap={nodeMap}
        hoveredNodeId={hoveredNodeId}
        open={inputOpen}
        onToggle={() => setInputOpen((v) => !v)}
        onSelectNode={handleNavigateToNode}
        onHover={handleHover}
        onShowDataset={onShowDataset}
        onShowMetrics={onShowMetrics}
      />

      <CollapsibleSection
        title={t('nodes-output-data')}
        open={nodeDataOpen}
        onToggle={() => setNodeDataOpen((v) => !v)}
      >
        {formula && (
          <Box>
            <Typography variant="body2" sx={{ fontSize: 10, color: 'text.secondary', mb: 0.5 }}>
              {t('nodes-formula')}
            </Typography>
            <Box
              component="pre"
              sx={{
                m: 0,
                px: 1,
                py: 0.75,
                bgcolor: 'grey.100',
                borderRadius: 0.5,
                fontFamily: 'monospace',
                fontSize: 12,
                lineHeight: 1.4,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {formula}
            </Box>
          </Box>
        )}
        <Chip
          icon={<BarChartLine size={18} />}
          label={t('nodes-output-data-show')}
          title={t('nodes-output-data-show')}
          variant="outlined"
          onClick={() => onShowMetrics?.(node.id, node.name ?? null)}
          sx={{
            maxWidth: '100%',
            cursor: 'pointer',
            borderRadius: 1,
            height: 32,
            fontSize: 13,
            '& .MuiChip-label': { px: 1.25 },
            alignSelf: 'flex-start',
          }}
        />
      </CollapsibleSection>

      <NodeOutputPortsSection
        nodeId={node.id}
        ports={outputPorts}
        outgoingByPort={outgoingByPort}
        nodeMap={nodeMap}
        hoveredNodeId={hoveredNodeId}
        open={outputOpen}
        onToggle={() => setOutputOpen((v) => !v)}
        onSelectNode={handleNavigateToNode}
        onHover={handleHover}
      />
    </Box>
  );
}
