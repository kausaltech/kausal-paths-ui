import { makeVar } from '@apollo/client';

import type { ConstraintViolationsFieldsFragment } from '@/common/__generated__/graphql';

export type ConstraintConflict = ConstraintViolationsFieldsFragment['conflicts'][number];

/**
 * Conflicts from the most recent mutation the backend rejected with
 * `ConstraintViolations` (nothing was written when this comes back). The
 * `ConstraintViolationsNotice` snackbar subscribes; set to null to dismiss.
 */
export const constraintViolationsVar = makeVar<readonly ConstraintConflict[] | null>(null);

/**
 * uuid → display name for the model's nodes, kept current by the node graph
 * editor. Lets the notice name the nodes a conflict's origins point at —
 * conflicts reference entities by UUID only.
 */
export const nodeNamesByUuidVar = makeVar<ReadonlyMap<string, string>>(new Map());

export class ConstraintViolationError extends Error {
  readonly conflicts: readonly ConstraintConflict[];

  constructor(conflicts: readonly ConstraintConflict[]) {
    super(conflicts.map((c) => c.message).join('; ') || 'The change would create conflicts');
    this.name = 'ConstraintViolationError';
    this.conflicts = conflicts;
  }
}

/**
 * Handle a `ConstraintViolations` mutation payload: surface the conflicts in
 * the notice snackbar and throw, so callers' error paths (dialog error
 * states etc.) fire like they do for OperationInfo failures.
 */
export function constraintViolationError(payload: {
  conflicts: readonly ConstraintConflict[];
}): never {
  constraintViolationsVar(payload.conflicts);
  throw new ConstraintViolationError(payload.conflicts);
}

/** Distinct display names of the nodes a conflict points at, when known. */
export function conflictNodeNames(
  conflict: ConstraintConflict,
  namesByUuid: ReadonlyMap<string, string>
): string[] {
  const uuids = [
    ...conflict.origins.map((o) => o.nodeUuid),
    conflict.value?.nodeUuid ?? null,
  ].filter((u): u is string => u != null);
  return [...new Set(uuids)].map((u) => namesByUuid.get(u)).filter((n): n is string => n != null);
}
