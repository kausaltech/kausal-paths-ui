import {
  type ParsedMetric,
  type SliceConfig,
  getChoicesForGoal,
  getSelectableDimensions,
} from '@common/utils/paths/metric';

/** The categories of one dimension that a graph shows until the visitor changes the filter */
export type EditorFilter = {
  /** Dimension identifier, as in the model (the metric dimension's `originalId`) */
  readonly dimension: string;
  /** Category identifiers, as in the model */
  readonly categories: readonly string[];
};

/** How the page editor wants a graph to start out */
export type EditorDefaults = {
  /** Dimension identifier to break down by, as in the model */
  readonly groupBy?: string | null;
  readonly filters?: readonly EditorFilter[];
};

/**
 * Apply the page editor's defaults on top of the usual default slice config.
 *
 * The editor's filters are added to those of the active goal and win where both filter the same
 * dimension. The break-down dimension is the editor's, if given. Otherwise the usual one is kept,
 * unless the editor's filters leave it a single category, which would make a breakdown of one
 * series; then the first other dimension that still splits the data, and that neither the goal
 * nor the editor filters to a single category, is used, as for goals.
 *
 * These are defaults only: the visitor changes both with the graph's controls.
 */
export function applyEditorDefaults(
  metric: ParsedMetric,
  base: SliceConfig,
  defaults: EditorDefaults | undefined
): SliceConfig {
  if (!defaults) return base;
  const filters = defaults.filters ?? [];

  // A goal's dimension choices have the same shape, so the same mapping from model identifiers
  // to the metric's identifiers applies.
  const editorChoice = filters.length
    ? getChoicesForGoal(metric, {
        id: '',
        label: null,
        default: false,
        disabled: false,
        dimensions: filters.map((filter) => ({
          dimension: filter.dimension,
          categories: filter.categories,
          groups: null,
        })),
      })
    : null;
  const categories = { ...base.categories, ...(editorChoice ?? {}) };

  const groupByDim = defaults.groupBy
    ? metric.dimensions.find((dim) => dim.originalId === defaults.groupBy)
    : undefined;
  if (groupByDim) return { dimensionId: groupByDim.id, categories };

  let { dimensionId } = base;
  const isSingleCategory = (dimId: string | undefined) =>
    dimId !== undefined && categories[dimId]?.categories.length === 1;
  // Only when the editor's filters caused it; a goal's single category is handled in the base.
  if (editorChoice?.[dimensionId ?? ''] && isSingleCategory(dimensionId)) {
    const other = getSelectableDimensions(metric).find(
      (dim) => dim.id !== dimensionId && !isSingleCategory(dim.id)
    );
    if (other) dimensionId = other.id;
  }
  return { dimensionId, categories };
}
