import { useCallback, useState } from 'react';

import { useMutation } from '@apollo/client/react';
import type { Item } from '@glideapps/glide-data-grid';

import type {
  CreateDataPointMutation,
  CreateDataPointMutationVariables,
  CreateDimensionCategoriesMutation,
  CreateDimensionCategoriesMutationVariables,
  CreateDimensionCategoryInput,
  DatasetDetailFieldsFragment,
  UpdateDataPointMutation,
  UpdateDataPointMutationVariables,
} from '@/common/__generated__/graphql';
import { CREATE_DIMENSION_CATEGORIES } from '../../dimensions/queries';
import type { AddProgress } from '../AddRowsModal';
import { asUpdateInput, extractYear } from '../dataset-grid-data';
import { CREATE_DATA_POINT, UPDATE_DATA_POINT } from '../queries';
import type { ImportCommit, ImportModalProps } from './ImportModal';
import { detectDimensionalPaste } from './parse';
import {
  type DatasetSchema,
  buildImportPlan,
  defaultResolution,
  groupAliasWrites,
  pointKey,
  resolutionKey,
  rowCategoryResolution,
  slugifyIdentifier,
} from './plan';

export interface UseDatasetImportArgs {
  dataset: DatasetDetailFieldsFragment;
  /** The grid's resolved year columns. */
  existingYears: number[];
  /** dimId -> uuid auto-pins from the grid's single-value category filters. */
  filterPins: Record<string, string>;
  instanceId: string;
  /** The grid's refetch (`onMutated`); awaited after a commit. */
  onCommitted: () => void | Promise<unknown>;
}

export interface UseDatasetImportResult {
  /** Pass straight to `<DataEditor onPaste={…} />`. Returns false to suppress
   *  Glide's positional paste when the payload is a dimensional import. */
  onPaste: (target: Item, values: readonly (readonly string[])[]) => boolean;
  /** Spread into `<ImportModal {...modalProps} />`. */
  modalProps: ImportModalProps;
}

// TODO(alias-backend): once `aliases` is exposed on the category GraphQL type
// and accepted by UpdateDimensionCategoryInput, replace this stub with one
// updateDimensionCategories call per category, sending the merged alias list
// produced by groupAliasWrites. Until then, mapping a fuzzy/unmatched label to
// an existing category imports the data but doesn't persist the mapping, so
// next year's import sees the same label as fuzzy again.
function persistCategoryAliases(aliasesByCategory: Record<string, string[]>): void {
  if (process.env.NODE_ENV !== 'production' && Object.keys(aliasesByCategory).length > 0) {
    console.debug('[dataset-import] alias persistence pending backend support:', aliasesByCategory);
  }
}

export function useDatasetImport({
  dataset,
  existingYears,
  filterPins,
  instanceId,
  onCommitted,
}: UseDatasetImportArgs): UseDatasetImportResult {
  const [session, setSession] = useState<{
    matrix: string[][];
    detected: ReturnType<typeof detectDimensionalPaste>;
  } | null>(null);
  const [committing, setCommitting] = useState(false);
  const [progress, setProgress] = useState<AddProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [createDataPoint] = useMutation<CreateDataPointMutation, CreateDataPointMutationVariables>(
    CREATE_DATA_POINT
  );
  const [updateDataPoint] = useMutation<UpdateDataPointMutation, UpdateDataPointMutationVariables>(
    UPDATE_DATA_POINT
  );
  const [createDimensionCategories] = useMutation<
    CreateDimensionCategoriesMutation,
    CreateDimensionCategoriesMutationVariables
  >(CREATE_DIMENSION_CATEGORIES);

  const onPaste = useCallback((_target: Item, values: readonly (readonly string[])[]) => {
    const matrix = values.map((r) => [...r]);
    const detected = detectDimensionalPaste(matrix);
    if (!detected) return true; // Not dimensional — let Glide paste positionally.
    setError(null);
    setSession({ matrix, detected });
    return false;
  }, []);

  const onClose = useCallback(() => {
    if (committing) return;
    setSession(null);
    setError(null);
  }, [committing]);

  const buildSchema = useCallback((): DatasetSchema => {
    return {
      dimensions: dataset.dimensions.map((d) => ({
        id: d.id,
        label: d.name,
        categories: d.categories.map((c) => ({
          uuid: c.uuid,
          identifier: c.identifier ?? null,
          label: c.label,
        })),
      })),
      metrics: dataset.metrics.map((m) => ({
        id: m.id,
        label: m.label,
        name: m.name,
        unit: m.unit,
      })),
      existingPoints: dataset.dataPoints.map((dp) => ({
        metricId: dp.metric.id,
        categoryUuids: dp.dimensionCategories.map((c) => c.uuid),
        year: extractYear(dp.date),
        value: dp.value,
      })),
      existingYears,
    };
  }, [dataset, existingYears]);

  const handleCommit = useCallback(
    async (commit: ImportCommit) => {
      setCommitting(true);
      setError(null);
      const baseVars = { instanceId, datasetId: dataset.id };

      // 1. Resolve each triage decision to a uuid (or null = discard), and
      // collect the categories to create + alias mappings to persist.
      const uuidByKey = new Map<string, string | null>();
      const createInputs: CreateDimensionCategoryInput[] = [];
      const aliasResolutions: { categoryUuid: string; alias: string }[] = [];
      for (const item of commit.triage) {
        const key = resolutionKey(item.dimensionId, item.label);
        const res = commit.resolutions[key] ?? defaultResolution(item);
        if (res.kind === 'existing') {
          uuidByKey.set(key, res.categoryUuid);
          // The user mapped a non-exact label to a category → that's an alias.
          aliasResolutions.push({ categoryUuid: res.categoryUuid, alias: item.label });
        } else if (res.kind === 'discard') {
          uuidByKey.set(key, null);
        } else {
          // Generate the uuid client-side so it's known without re-reading.
          const id = crypto.randomUUID();
          uuidByKey.set(key, id);
          createInputs.push({
            dimensionId: item.dimensionId,
            label: item.label,
            id,
            identifier: slugifyIdentifier(item.label),
            previousSibling: null,
            nextSibling: null,
          });
        }
      }

      // 2. Create any new categories first (one batched call).
      if (createInputs.length > 0) {
        try {
          const result = await createDimensionCategories({
            variables: { instanceId, input: createInputs },
          });
          const payload = result.data?.instanceEditor.createDimensionCategories;
          if (payload?.__typename === 'OperationInfo') {
            throw new Error(payload.messages.map((m) => m.message).join('; '));
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : String(err));
          setCommitting(false);
          return;
        }
      }

      // 3. Rebuild the plan (pure, cheap) and turn it into per-cell operations.
      const schema = buildSchema();
      const plan = buildImportPlan(commit.matrix, commit.detected, schema, commit.mapping, {
        pinnedCategoryByDimension: commit.pinnedCategoryByDimension,
        metricId: commit.metricId,
      });

      const existingIndex = new Map<string, string>();
      for (const dp of dataset.dataPoints) {
        existingIndex.set(
          pointKey(
            dp.metric.id,
            dp.dimensionCategories.map((c) => c.uuid),
            extractYear(dp.date)
          ),
          dp.id
        );
      }

      type Op =
        | { kind: 'create'; year: number; value: number; categoryUuids: string[] }
        | { kind: 'update'; value: number; dataPointId: string };
      const ops: Op[] = [];
      for (const row of plan.rows) {
        const { categoryUuids, discard } = rowCategoryResolution(
          row,
          commit.pinnedCategoryByDimension,
          uuidByKey
        );
        if (discard) continue;
        for (const cell of row.cells) {
          const id = existingIndex.get(pointKey(commit.metricId, categoryUuids, cell.year));
          if (id) ops.push({ kind: 'update', value: cell.value, dataPointId: id });
          else ops.push({ kind: 'create', year: cell.year, value: cell.value, categoryUuids });
        }
      }

      // 4. Execute with a determinate progress bar (sequential, mirroring the
      // grid's other batch handlers).
      setProgress({ current: 0, total: ops.length });
      let firstError: string | null = null;
      for (const op of ops) {
        try {
          if (op.kind === 'update') {
            const r = await updateDataPoint({
              variables: {
                ...baseVars,
                dataPointId: op.dataPointId,
                input: asUpdateInput({ value: op.value }),
              },
            });
            const p = r.data?.instanceEditor.datasetEditor.updateDataPoint;
            if (p?.__typename === 'OperationInfo') {
              firstError ??= p.messages.map((m) => m.message).join('; ');
            }
          } else {
            const r = await createDataPoint({
              variables: {
                ...baseVars,
                input: {
                  date: `${op.year}-01-01`,
                  value: op.value,
                  metricId: commit.metricId,
                  dimensionCategoryIds: op.categoryUuids,
                },
              },
            });
            const p = r.data?.instanceEditor.datasetEditor.createDataPoint;
            if (p?.__typename === 'OperationInfo') {
              firstError ??= p.messages.map((m) => m.message).join('; ');
            }
          }
        } catch (err) {
          firstError ??= err instanceof Error ? err.message : String(err);
        }
        setProgress((prev) => (prev ? { ...prev, current: prev.current + 1 } : prev));
      }

      // 5. Persist alias mappings (placeholder until backend support lands).
      persistCategoryAliases(groupAliasWrites(aliasResolutions, {}));

      setProgress(null);
      try {
        await onCommitted();
      } catch {
        // Refetch failure is non-fatal here; the values are saved server-side.
      }
      setCommitting(false);
      if (firstError) setError(firstError);
      else setSession(null); // Close only on a clean commit.
    },
    [
      instanceId,
      dataset,
      buildSchema,
      createDataPoint,
      updateDataPoint,
      createDimensionCategories,
      onCommitted,
    ]
  );

  return {
    onPaste,
    modalProps: {
      open: session !== null,
      matrix: session?.matrix ?? null,
      detected: session?.detected ?? null,
      dataset,
      existingYears,
      filterPins,
      committing,
      progress,
      error,
      onClose,
      onCommit: (c) => void handleCommit(c),
    },
  };
}
