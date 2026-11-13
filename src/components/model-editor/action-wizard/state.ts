import { makeVar } from '@apollo/client';

/**
 * State of the "new action acting on nodes" wizard
 * (docs/plans/action-from-output-port.md in kausal-paths).
 *
 * Lives in a reactive var rather than in `FlowEditor` state so that any entry
 * point — the node context menu, a port row in the details panel — can open
 * the wizard without threading callbacks through the panel tree.
 */

/**
 * Whether the wizard can act on a node (`InstanceEditor.actionTargets`): the node needs a single
 * output port and an additive input, and must belong to the instance rather than to a framework.
 */
export type ActionTarget = { nodeId: string; available: boolean; reason: string | null };

/** Where an effect's numbers come from; chosen before anything is created. */
export type EffectSourceKind = 'newDataset' | 'dataset' | 'node';

export type EffectDraft = {
  /** Client-side key for list rendering. */
  key: string;
  /** NodeInterface.id of the node the action acts on. */
  targetNodeId: string;
  label: string;
  sourceKind: EffectSourceKind;
  /** New dataset: kept categories per dimension uuid; a dimension not listed keeps all. */
  keptCategories: Record<string, string[]>;
  /** Existing dataset source, as `datasetId:metricId`. */
  datasetMetric: string | null;
  /** Existing node source, as `nodeUuid:portId`. */
  sourcePort: string | null;
};

/** What the next node click on the canvas does while the wizard is open. */
export type WizardPick = { kind: 'target' } | { kind: 'source'; effectKey: string } | null;

export type ActionWizardState = {
  open: boolean;
  effects: EffectDraft[];
  pick: WizardPick;
};

const CLOSED: ActionWizardState = { open: false, effects: [], pick: null };

export const actionWizardVar = makeVar<ActionWizardState>(CLOSED);

export function newEffect(targetNodeId: string): EffectDraft {
  return {
    key: crypto.randomUUID(),
    targetNodeId,
    label: '',
    sourceKind: 'newDataset',
    keptCategories: {},
    datasetMetric: null,
    sourcePort: null,
  };
}

/** Open the wizard with one effect on the given node. */
export function openActionWizard(targetNodeId: string): void {
  actionWizardVar({ open: true, effects: [newEffect(targetNodeId)], pick: null });
}

export function closeActionWizard(): void {
  actionWizardVar(CLOSED);
}

export function updateActionWizard(change: (state: ActionWizardState) => ActionWizardState): void {
  actionWizardVar(change(actionWizardVar()));
}

export function updateEffect(key: string, patch: Partial<EffectDraft>): void {
  updateActionWizard((state) => ({
    ...state,
    effects: state.effects.map((effect) => (effect.key === key ? { ...effect, ...patch } : effect)),
  }));
}

export function setWizardPick(pick: WizardPick): void {
  updateActionWizard((state) => ({ ...state, pick }));
}
