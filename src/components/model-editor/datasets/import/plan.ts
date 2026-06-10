/**
 * The import decision engine: a detected table + the target dataset schema →
 * a bucketed `ImportPlan` that the modal renders and the commit step executes.
 *
 * Pure and side-effect-free. Network/cache work (createDataPoint,
 * updateDataPoint, createDimensionCategories, alias writes) lives in the
 * commit layer; this module only decides *what* should happen.
 *
 * Model recap (see ./matching.ts, ./parse.ts):
 *  - Each dataset dimension is either a *column* in the paste (matched per row)
 *    or *fixed* (pinned to one category, e.g. the sector in a native single-
 *    sector export).
 *  - A row's confidence is the weakest of its per-column matches.
 *  - Inaction is lossless: red rows default to creating a new category, never
 *    to discard.
 */
import {
  type CategoryCandidate,
  type CategoryMatch,
  type MatchCategory,
  type MatchClass,
  classifyCategory,
  normalizeLabel,
} from './matching';
import type { DetectedTable } from './parse';

export interface PlanDimension {
  id: string;
  label: string;
  identifier?: string | null;
  categories: MatchCategory[];
}

export interface PlanMetric {
  id: string;
  label: string;
  name?: string | null;
  unit: string;
}

export interface ExistingPoint {
  metricId: string;
  categoryUuids: string[];
  year: number;
  value: number | null;
}

export interface DatasetSchema {
  dimensions: PlanDimension[];
  metrics: PlanMetric[];
  existingPoints: ExistingPoint[];
  existingYears: number[];
}

export interface ColumnMapping {
  /** Text-column index → dataset dimension id (the per-row matched axes). */
  dimensionByColumn: Record<number, string>;
}

export interface FixedContext {
  /** Dimensions absent from the columns, pinned to a single category. */
  pinnedCategoryByDimension: Record<string, string>;
  /** Metric to attribute every value to (no per-row metric column yet). */
  metricId: string;
}

export type CellAction = 'create' | 'overwrite';

export interface PlannedCell {
  year: number;
  value: number;
  action: CellAction;
  /** Committed value being overwritten, when action === 'overwrite'. */
  previousValue?: number | null;
}

export interface PlannedRow {
  /** Source matrix row index, for traceability back to the paste. */
  sourceRowIndex: number;
  /** Per matched-column dimension: the classification of that cell's label. */
  matchByDimension: Record<string, CategoryMatch>;
  /** Weakest class across the matched columns (pins don't degrade). */
  rowClass: MatchClass;
  cells: PlannedCell[];
}

export interface NewCategoryProposal {
  dimensionId: string;
  /** The raw source label that would become the new category's label. */
  label: string;
}

export interface ImportPlan {
  rows: PlannedRow[];
  counts: {
    greenRows: number;
    yellowRows: number;
    redRows: number;
    cellsToCreate: number;
    cellsToOverwrite: number;
  };
  /** Detected years not yet present in the dataset (new columns to add). */
  newYears: number[];
  /** Distinct (dimension, label) pairs with no exact category — would be created. */
  newCategories: NewCategoryProposal[];
}

const CLASS_RANK: Record<MatchClass, number> = { exact: 0, fuzzy: 1, none: 2 };

function weakest(a: MatchClass, b: MatchClass): MatchClass {
  return CLASS_RANK[a] >= CLASS_RANK[b] ? a : b;
}

/**
 * Parse a value cell, tolerating the locale variants Excel emits
 * ("1.234,56" / "1,234.56" / "1234.56"). Mirrors the grid's coercePasteValue.
 * Returns null for blanks / non-numeric.
 */
export function parseNumericValue(raw: string): number | null {
  const stripped = raw.trim().replace(/\s/g, '');
  if (stripped === '') return null;
  const hasComma = stripped.includes(',');
  const hasDot = stripped.includes('.');
  let normalised: string;
  if (hasComma && hasDot) {
    normalised =
      stripped.lastIndexOf('.') > stripped.lastIndexOf(',')
        ? stripped.replace(/,/g, '')
        : stripped.replace(/\./g, '').replace(',', '.');
  } else if (hasComma) {
    normalised = /^-?\d{1,3}(,\d{3})+$/.test(stripped)
      ? stripped.replace(/,/g, '')
      : stripped.replace(',', '.');
  } else {
    normalised = stripped;
  }
  const num = Number(normalised);
  return Number.isFinite(num) ? num : null;
}

/** Stable key for a data point: metric + sorted category uuids + year. */
export function pointKey(metricId: string, categoryUuids: readonly string[], year: number): string {
  return [metricId, [...categoryUuids].sort().join('+'), year].join('|');
}

export function buildImportPlan(
  matrix: string[][],
  detected: DetectedTable,
  schema: DatasetSchema,
  mapping: ColumnMapping,
  fixed: FixedContext
): ImportPlan {
  const dimById = new Map(schema.dimensions.map((d) => [d.id, d]));
  const existingByKey = new Map<string, number | null>();
  for (const p of schema.existingPoints) {
    existingByKey.set(pointKey(p.metricId, p.categoryUuids, p.year), p.value);
  }
  const existingYearSet = new Set(schema.existingYears);

  const rows: PlannedRow[] = [];
  const counts = {
    greenRows: 0,
    yellowRows: 0,
    redRows: 0,
    cellsToCreate: 0,
    cellsToOverwrite: 0,
  };
  // Dedupe proposed new categories by (dimension, normalized label).
  const newCatSeen = new Set<string>();
  const newCategories: NewCategoryProposal[] = [];

  // Columns that map to a dimension, paired with their dimension.
  const mappedColumns = Object.entries(mapping.dimensionByColumn).map(([col, dimId]) => ({
    col: Number(col),
    dimId,
  }));

  for (const r of detected.dataRowIndices) {
    const row = matrix[r] ?? [];
    const matchByDimension: Record<string, CategoryMatch> = {};
    let rowClass: MatchClass = 'exact';
    // Resolved category uuids across all dimensions; null if any axis is
    // unresolved (fuzzy-unconfirmed or none → no concrete cell target yet).
    const resolvedUuids: string[] = [];
    let allResolved = true;

    for (const { col, dimId } of mappedColumns) {
      const dim = dimById.get(dimId);
      if (!dim) continue;
      const label = (row[col] ?? '').trim();
      const match = classifyCategory(label, dim.categories);
      matchByDimension[dimId] = match;
      rowClass = weakest(rowClass, match.matchClass);

      if (match.matchClass === 'exact' && match.categoryUuid) {
        resolvedUuids.push(match.categoryUuid);
      } else {
        allResolved = false;
        const norm = label.toLowerCase();
        const seenKey = `${dimId}::${norm}`;
        if (match.matchClass === 'none' && label !== '' && !newCatSeen.has(seenKey)) {
          newCatSeen.add(seenKey);
          newCategories.push({ dimensionId: dimId, label });
        }
      }
    }

    // Fixed (pinned) dimensions contribute their category without affecting class.
    for (const catUuid of Object.values(fixed.pinnedCategoryByDimension)) {
      resolvedUuids.push(catUuid);
    }

    const cells: PlannedCell[] = [];
    for (const { col, year } of detected.yearColumns) {
      const value = parseNumericValue(row[col] ?? '');
      if (value === null) continue;
      let action: CellAction = 'create';
      let previousValue: number | null | undefined;
      if (allResolved) {
        const key = pointKey(fixed.metricId, resolvedUuids, year);
        if (existingByKey.has(key)) {
          action = 'overwrite';
          previousValue = existingByKey.get(key) ?? null;
        }
      }
      cells.push({ year, value, action, previousValue });
      if (action === 'overwrite') counts.cellsToOverwrite++;
      else counts.cellsToCreate++;
    }

    if (rowClass === 'exact') counts.greenRows++;
    else if (rowClass === 'fuzzy') counts.yellowRows++;
    else counts.redRows++;

    rows.push({ sourceRowIndex: r, matchByDimension, rowClass, cells });
  }

  const newYears = detected.yearColumns
    .map((y) => y.year)
    .filter((y) => !existingYearSet.has(y))
    .filter((y, i, arr) => arr.indexOf(y) === i)
    .sort((a, b) => a - b);

  return { rows, counts, newYears, newCategories };
}

// ── Column mapping ──────────────────────────────────────────────────────────

/** Headers in the canonical long-format that are metadata, not dimensions. */
const KNOWN_METADATA_HEADERS = new Set(['dataset', 'metric', 'quantity', 'unit']);

/**
 * Best-effort initial column → dimension assignment by header name. Metadata
 * headers (Dataset/Metric/Quantity/Unit) are skipped; remaining text columns
 * are matched to a dimension by normalised-equal label. Anything unmatched is
 * left for the user to assign in the modal.
 */
export function inferColumnMapping(
  detected: DetectedTable,
  dimensions: readonly PlanDimension[]
): ColumnMapping {
  const dimensionByColumn: Record<number, string> = {};
  detected.textColumns.forEach((col, i) => {
    const header = normalizeLabel(detected.textColumnHeaders[i] ?? '');
    if (header === '' || KNOWN_METADATA_HEADERS.has(header)) return;
    const dim = dimensions.find((d) => normalizeLabel(d.label) === header);
    if (dim) dimensionByColumn[col] = dim.id;
  });
  return { dimensionByColumn };
}

// ── Triage & resolution ───────────────────────────────────────────────────────

export interface TriageItem {
  dimensionId: string;
  dimensionLabel: string;
  /** The raw source label needing a decision. */
  label: string;
  matchClass: 'fuzzy' | 'none';
  candidates: CategoryCandidate[];
}

/** A user's decision for one (dimension, source label) pair. */
export type LabelResolution =
  | { kind: 'existing'; categoryUuid: string }
  | { kind: 'create' }
  | { kind: 'discard' };

/** Stable key for a resolution: dimension + normalised source label. */
export function resolutionKey(dimensionId: string, label: string): string {
  return `${dimensionId}::${normalizeLabel(label)}`;
}

/**
 * Distinct (dimension, label) pairs that aren't an exact match — the rows the
 * modal surfaces for human triage. Deduped, so a carrier appearing in many
 * rows is decided once.
 */
export function collectTriageItems(
  plan: ImportPlan,
  dimensions: readonly PlanDimension[]
): TriageItem[] {
  const dimLabel = new Map(dimensions.map((d) => [d.id, d.label]));
  const byKey = new Map<string, TriageItem>();
  for (const row of plan.rows) {
    for (const [dimId, match] of Object.entries(row.matchByDimension)) {
      if (match.matchClass === 'exact') continue;
      const key = resolutionKey(dimId, match.source);
      if (byKey.has(key)) continue;
      byKey.set(key, {
        dimensionId: dimId,
        dimensionLabel: dimLabel.get(dimId) ?? dimId,
        label: match.source,
        matchClass: match.matchClass,
        candidates: match.candidates,
      });
    }
  }
  return [...byKey.values()];
}

/** Default decision for a triage item: confirm a fuzzy suggestion, create for none. */
export function defaultResolution(item: TriageItem): LabelResolution {
  if (item.matchClass === 'fuzzy' && item.candidates[0]) {
    return { kind: 'existing', categoryUuid: item.candidates[0].uuid };
  }
  return { kind: 'create' };
}

/**
 * Resolve one planned row to its final category uuids, given the pins and a map
 * from resolution key → uuid (created or existing) or `null` for discard.
 * Returns `discard: true` if any non-exact axis is unresolved or discarded.
 */
export function rowCategoryResolution(
  row: PlannedRow,
  pinnedCategoryByDimension: Record<string, string>,
  uuidByResolutionKey: Map<string, string | null>
): { categoryUuids: string[]; discard: boolean } {
  const categoryUuids: string[] = [];
  for (const [dimId, match] of Object.entries(row.matchByDimension)) {
    if (match.matchClass === 'exact' && match.categoryUuid) {
      categoryUuids.push(match.categoryUuid);
      continue;
    }
    const u = uuidByResolutionKey.get(resolutionKey(dimId, match.source));
    if (u === null || u === undefined) return { categoryUuids: [], discard: true };
    categoryUuids.push(u);
  }
  for (const u of Object.values(pinnedCategoryByDimension)) categoryUuids.push(u);
  return { categoryUuids, discard: false };
}

/** Slugify a label into a category identifier (ASCII, lowercase, underscores). */
export function slugifyIdentifier(label: string): string {
  return (
    normalizeLabel(label)
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '') || 'category'
  );
}

/**
 * Commit-time correctness guard for the non-atomic alias list: when several
 * source labels resolve to the *same* category, merge their alias additions
 * into one update per category so racing replace-style writes can't clobber
 * each other. Returns the full alias list to send for each affected category.
 */
export function groupAliasWrites(
  resolutions: ReadonlyArray<{ categoryUuid: string; alias: string }>,
  currentAliasesByCategory: Readonly<Record<string, readonly string[]>>
): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const { categoryUuid, alias } of resolutions) {
    const base = out[categoryUuid] ?? [...(currentAliasesByCategory[categoryUuid] ?? [])];
    if (!base.some((a) => a.toLowerCase() === alias.toLowerCase())) base.push(alias);
    out[categoryUuid] = base;
  }
  return out;
}
