import { useCallback, useState } from 'react';

import type { Item } from '@glideapps/glide-data-grid';

import type { DatasetDetailFieldsFragment } from '@/common/__generated__/graphql';
import {
  type ImportStagePayload,
  type PendingEdit,
  type StagedCategory,
  type StagedRow,
  extractYear,
  rowKey,
  yearColId,
} from '../dataset-grid-data';
import type { ImportCommit, ImportModalProps } from './ImportModal';
import { detectDimensionalPaste } from './parse';
import {
  type DatasetSchema,
  buildImportPlan,
  defaultResolution,
  pointKey,
  resolutionKey,
  slugifyIdentifier,
} from './plan';

export interface UseDatasetImportArgs {
  dataset: DatasetDetailFieldsFragment;
  /** The grid's resolved year columns. */
  existingYears: number[];
  /** dimId -> uuid auto-pins from the grid's single-value category filters. */
  filterPins: Record<string, string>;
  /**
   * Merge the import's result into the grid's staged edit state. The import no
   * longer writes to the server itself: staged categories / rows / values show
   * as dirty cells and are committed (or discarded) via the grid's Save / Cancel
   * controls — the same review-before-commit flow as manual edits.
   */
  onStage: (payload: ImportStagePayload) => void;
}

export interface UseDatasetImportResult {
  /** Pass straight to `<DataEditor onPaste={…} />`. Returns false to suppress
   *  Glide's positional paste when the payload is a dimensional import. */
  onPaste: (target: Item, values: readonly (readonly string[])[]) => boolean;
  /** Spread into `<ImportModal {...modalProps} />`. */
  modalProps: ImportModalProps;
}

export function useDatasetImport({
  dataset,
  existingYears,
  filterPins,
  onStage,
}: UseDatasetImportArgs): UseDatasetImportResult {
  const [session, setSession] = useState<{
    matrix: string[][];
    detected: ReturnType<typeof detectDimensionalPaste>;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onPaste = useCallback((_target: Item, values: readonly (readonly string[])[]) => {
    const matrix = values.map((r) => [...r]);
    const detected = detectDimensionalPaste(matrix);
    if (!detected) return true; // Not dimensional — let Glide paste positionally.
    setError(null);
    setSession({ matrix, detected });
    return false;
  }, []);

  const onClose = useCallback(() => {
    setSession(null);
    setError(null);
  }, []);

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

  const handleStage = useCallback(
    (commit: ImportCommit) => {
      // 1. Resolve each triage decision to a uuid (or null = discard). New
      // categories get a client-generated uuid now and are staged for creation
      // at save time (see useDataPointEditing.handleSave); the same uuid is used
      // immediately in row keys and value edits so nothing needs remapping.
      const uuidByKey = new Map<string, string | null>();
      const stagedCategories: StagedCategory[] = [];
      for (const item of commit.triage) {
        const key = resolutionKey(item.dimensionId, item.label);
        const res = commit.resolutions[key] ?? defaultResolution(item);
        if (res.kind === 'existing') {
          uuidByKey.set(key, res.categoryUuid);
        } else if (res.kind === 'discard') {
          uuidByKey.set(key, null);
        } else {
          const id = crypto.randomUUID();
          uuidByKey.set(key, id);
          stagedCategories.push({
            dimensionId: item.dimensionId,
            uuid: id,
            identifier: slugifyIdentifier(item.label),
            label: item.label,
          });
        }
      }

      // 2. Rebuild the plan (pure) and the existing-point index.
      const schema = buildSchema();
      const plan = buildImportPlan(commit.matrix, commit.detected, schema, commit.mapping, {
        pinnedCategoryByDimension: commit.pinnedCategoryByDimension,
        metricId: commit.metricId,
      });

      const existingByKey = new Map<string, { id: string; value: number | null }>();
      for (const dp of dataset.dataPoints) {
        existingByKey.set(
          pointKey(
            dp.metric.id,
            dp.dimensionCategories.map((c) => c.uuid),
            extractYear(dp.date)
          ),
          { id: dp.id, value: dp.value }
        );
      }
      // Row keys already backed by data points — those don't need a staged row.
      const existingRowKeys = new Set<string>();
      for (const dp of dataset.dataPoints) {
        const categoryByDim: Record<string, string | null> = {};
        const dpUuids = new Set(dp.dimensionCategories.map((c) => c.uuid));
        for (const dim of dataset.dimensions) {
          categoryByDim[dim.id] = dim.categories.find((c) => dpUuids.has(c.uuid))?.uuid ?? null;
        }
        existingRowKeys.add(rowKey(dp.metric.id, categoryByDim));
      }

      // 3. Turn the plan into staged rows + per-cell value edits.
      const stagedRows: StagedRow[] = [];
      const stagedRowKeys = new Set<string>();
      const edits: PendingEdit[] = [];
      for (const planRow of plan.rows) {
        // Resolve every dimension to a uuid (or null when absent), discarding
        // the row if any mapped label resolved to "discard".
        const categoryByDim: Record<string, string | null> = {};
        let discard = false;
        for (const dim of dataset.dimensions) {
          const match = planRow.matchByDimension[dim.id];
          if (match) {
            if (match.matchClass === 'exact' && match.categoryUuid) {
              categoryByDim[dim.id] = match.categoryUuid;
            } else {
              const u = uuidByKey.get(resolutionKey(dim.id, match.source));
              if (u === null || u === undefined) {
                discard = true;
                break;
              }
              categoryByDim[dim.id] = u;
            }
          } else if (commit.pinnedCategoryByDimension[dim.id] !== undefined) {
            categoryByDim[dim.id] = commit.pinnedCategoryByDimension[dim.id];
          } else {
            categoryByDim[dim.id] = null;
          }
        }
        if (discard) continue;

        const categoryUuids = Object.values(categoryByDim).filter((v): v is string => v !== null);
        const id = rowKey(commit.metricId, categoryByDim);
        if (!existingRowKeys.has(id) && !stagedRowKeys.has(id)) {
          stagedRowKeys.add(id);
          stagedRows.push({ metricId: commit.metricId, categoryByDim });
        }

        for (const cell of planRow.cells) {
          const existing = existingByKey.get(pointKey(commit.metricId, categoryUuids, cell.year));
          edits.push({
            rowId: id,
            colId: yearColId(cell.year),
            year: cell.year,
            dataPointId: existing?.id ?? null,
            nextValue: cell.value,
            originalValue: existing?.value ?? null,
          });
        }
      }

      onStage({ categories: stagedCategories, rows: stagedRows, edits, years: plan.newYears });
      setSession(null);
    },
    [dataset, buildSchema, onStage]
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
      // Staging is synchronous and local, so there's no in-flight commit to
      // report. Kept for prop compatibility with the modal.
      committing: false,
      error,
      onClose,
      onCommit: handleStage,
    },
  };
}
