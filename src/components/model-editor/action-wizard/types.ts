import type { NodeEdgeFragment, NodeFieldsFragment } from '@/common/__generated__/graphql';

export type OutputMetric = {
  portId: string;
  label: string;
  unit: string;
  quantity: string;
};

export type DraftEdgeMapping = {
  id: string;
  outputMetricPortId: string;
  targetNodeId: string;
  targetNodeName: string;
  targetPortId: string;
  tags: string[];
  fromDimensions: { id: string; flatten: boolean }[];
  toDimensions: { id: string; categories?: string[] }[];
};

export type DataSourceType = 'existing' | 'new';

export type DataSourceConfig = {
  type: DataSourceType;
  datasetId: string;
  selectorColumn: string;
  selectorValue: string;
};

export type WizardState = {
  sourceAction: NodeFieldsFragment | null;
  sourceEdges: NodeEdgeFragment[];
  newActionId: string;
  newActionName: string;
  actionGroup: string;
  dataSource: DataSourceConfig;
  outputMetrics: OutputMetric[];
  edgeMappings: DraftEdgeMapping[];
};

export const WIZARD_STEPS = [
  'Copy Action',
  'Basic Info',
  'Data Source',
  'Outputs',
  'Edge Configuration',
  'Review & Save',
] as const;

export type WizardStepLabel = (typeof WIZARD_STEPS)[number];

export function createInitialWizardState(): WizardState {
  return {
    sourceAction: null,
    sourceEdges: [],
    newActionId: '',
    newActionName: '',
    actionGroup: '',
    dataSource: {
      type: 'existing',
      datasetId: '',
      selectorColumn: 'action',
      selectorValue: '',
    },
    outputMetrics: [],
    edgeMappings: [],
  };
}

export function deriveStateFromSource(
  action: NodeFieldsFragment,
  allEdges: readonly NodeEdgeFragment[],
  allNodes: readonly NodeFieldsFragment[],
): Partial<WizardState> {
  const nodesById = new Map(allNodes.map((n) => [n.id, n]));
  const outgoingEdges = allEdges.filter((e) => e.fromRef.nodeId === action.id);

  const outputMetrics: OutputMetric[] = (action.spec?.outputPorts ?? []).map((p) => ({
    portId: p.id,
    label: p.label ?? p.id,
    unit: '',
    quantity: '',
  }));

  const edgeMappings: DraftEdgeMapping[] = outgoingEdges.map((edge) => {
    const targetNode = nodesById.get(edge.toRef.nodeId);
    return {
      id: edge.id,
      outputMetricPortId: edge.fromRef.portId,
      targetNodeId: edge.toRef.nodeId,
      targetNodeName: targetNode?.name ?? edge.toRef.nodeId,
      targetPortId: edge.toRef.portId,
      tags: [],
      fromDimensions: [],
      toDimensions: [],
    };
  });

  return {
    sourceAction: action,
    sourceEdges: [...outgoingEdges],
    newActionId: '',
    newActionName: '',
    actionGroup: action.nodeGroup ?? '',
    outputMetrics,
    edgeMappings,
  };
}
