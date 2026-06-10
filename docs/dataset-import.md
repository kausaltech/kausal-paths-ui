# Dimensional dataset import (paste → match → commit)

Status: **built & wired — paste interceptor, modal, and commit are in place; only
backend alias persistence is stubbed (pending the GraphQL surface).** Lives in
`useDatasetImport` + `ImportModal`; `DatasetDataGrid` gained ~4 lines (a `filterPins`
memo, the hook call, the `onPaste` swap, the modal render) and owns none of the logic.

Driver: City of München procurement (Leistungsbeschreibung 3.1.7 _Datenimport_, 3.2.6
_Sektoren-System anpassbar_; demo Tue 2026-06-09). Source: Klimaschutzplaner export
(`Attic/Copy of Anhang_Beispieldatei_Initialbefüllung_Klimaschutz-Monitoring.xlsx`).

## The problem

The dataset grid lets users paste a rectangle of numbers **positionally** — fine for
fixing a few cells, unsafe for loading a whole sheet, because positional paste maps by
offset and fails _silently_ when the grid's row order doesn't match the source. The
Klimaschutzplaner data is 2-D (energy carrier × year) and the city's exports won't line
up by luck.

The fix is **key-matched import**: resolve each row by identity (category labels + year
headers), and _report_ what didn't match instead of hiding it. It's an annual ritual
(`jährlich` in the tender), so the expensive part is re-matching the same German label
soup every year — solved by **category aliases** that persist each mapping decision.

## One engine, two doors

Paste and "Import" are two entrances to the same engine:

- **Positional paste — unchanged.** A bare number rectangle (no year header) applies
  inline exactly as today.
- **Paste interceptor.** Glide's `onPaste` is currently the bare prop (`onPaste` =
  default positional). Replace it with a function
  `(target: Item, values: readonly (readonly string[])[]) => boolean`. Glide hands us the
  clipboard **already parsed into a matrix** — run `detectDimensionalPaste(values)`; if it
  returns non-null (a header row with ≥2 year-like columns), stash `{ matrix, target }`,
  open the import modal, and **return `false`** to suppress the positional paste.
  Otherwise return `true`. No `navigator.clipboard` access needed.
- **Import preview (modal).** Parse → map → match → bucket → confirm → commit. A keyed
  payload _always_ gets a preview — predictability beats saving a click, especially on a
  demo stage.

## Filter-aware pinning (the elegant pin source)

The grid holds a per-column filter: `categoryFilters: Map<colId, Set<string>>`, keyed by
`col_dim_<dimId>` (category UUIDs, or the `NO_CATEGORY` sentinel) or `METRIC_COL`
(metric ids); an absent entry means "unfiltered". When the user has already narrowed the
view to e.g. only _Private Haushalte_, the importer should use that as the **pin** for a
dimension that the pasted data doesn't mention — no need to ask.

Rule: for each dataset dimension **not** mapped to a paste column, look at
`categoryFilters.get(col_dim_<dimId>)`:

- exactly one UUID → **auto-pin** it (show as "from active filter", overridable);
- more than one, or absent, or the sole value is `NO_CATEGORY` → fall back to the manual
  pin selector.

Deliberately, the filter does **not** constrain matching for dimensions that _are_ in the
paste: pasted data may legitimately include currently-hidden categories, and narrowing
matches to the visible set would spuriously propose new categories. The filter only
supplies pins for absent dimensions. The grid must pass `categoryFilters` (or a derived
`Record<dimId, uuid>` of single-value filters) into the modal.

## Architecture

Pure, side-effect-free core under
[`datasets/import/`](../src/components/model-editor/datasets/import/) — **built & verified,
typechecks clean, no React/Apollo:**

| Module                                                                      | Responsibility                                                                                                                                                                                                                              |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`parse.ts`](../src/components/model-editor/datasets/import/parse.ts)       | `parseClipboardTable` (TSV → matrix), `detectDimensionalPaste` (locate header/years/label columns/data rows; skip totals & footer; `null` ⇒ vanilla paste).                                                                                 |
| [`matching.ts`](../src/components/model-editor/datasets/import/matching.ts) | `classifyCategory` — green/yellow/red core; German-aware `normalizeLabel`; modest fuzzy scorer (LCS + token-Jaccard + prefix).                                                                                                              |
| [`plan.ts`](../src/components/model-editor/datasets/import/plan.ts)         | `buildImportPlan` (→ bucketed plan: create/overwrite/new-year/new-category counts), `parseNumericValue`, `inferColumnMapping`, `collectTriageItems`, `defaultResolution`, `rowCategoryResolution`, `slugifyIdentifier`, `groupAliasWrites`. |

### To build

**Modal** (`datasets/import/ImportModal.tsx`) — renders an `ImportPlan` over a
`DatasetDetailFieldsFragment`. Sections:

1. _Structure_: detected summary (N data rows · years A–B).
2. _Mapping_: per detected text column → Select(dimension | ignore), seeded by
   `inferColumnMapping`. For each dataset dimension absent from the columns → a pin Select,
   pre-filled from the active filter where it narrows to one category. Metric Select
   (default the metric whose label is "Value", else the first).
3. _Preview_: count chips — green / yellow / red rows; cells to create; **cells to
   overwrite (loud)**; new year-columns; new categories.
4. _Needs attention_: `collectTriageItems(plan)` rows (fuzzy/red only), each with a
   resolution control — Map-to-existing (Autocomplete pre-filled with the top candidate) /
   Create new / Discard. Defaults from `defaultResolution`. Green rows aren't listed (a
   "N matched automatically" note).

**Commit** (in the grid, reusing the batched-with-progress loop pattern from
`handleAddRows`):

1. **Create categories** for `kind: 'create'` resolutions: generate a UUID client-side
   (`crypto.randomUUID()`) and pass it as `CreateDimensionCategoryInput.id` (the field is
   `UUID`), with `identifier = slugifyIdentifier(label)`, `label`, `dimensionId`. Batch all
   into one `CREATE_DIMENSION_CATEGORIES` call. Using a client-generated id means the new
   category's UUID is known without parsing the response, and feeds straight into
   `createDataPoint.dimensionCategoryIds`.
2. Build `uuidByResolutionKey` (existing → its uuid, create → generated uuid, discard →
   `null`), then per planned row call `rowCategoryResolution(row, pins, …)`; skip discards.
3. For each cell, look up the existing DataPoint by `(metricId, sorted category uuids,
year)` and `updateDataPoint` if present, else `createDataPoint`. Drive the same
   determinate progress bar / error collection as the existing batch handlers.
4. `onMutated()` to refetch (new categories then appear in `dataset.dimensions`); close.
5. **Aliases — placeholder only** (backend pending): collect `(categoryUuid, sourceLabel)`
   for confirmed fuzzy / map-to-existing resolutions and pass them through
   `groupAliasWrites` into a stub `persistCategoryAliases()` that currently no-ops with a
   `TODO`. Wire to the mutation once the backend lands (below).

## Matching model

- Each dataset **dimension is either a paste column** (matched per row) **or fixed**
  (pinned — from the active filter or a manual Select).
- A row's class is the **weakest** of its per-column matches; pins/metric don't degrade it.
- Resolution ladder (first hit wins, all green): identifier → exact label → persisted alias
  → normalised-equal. Below that: fuzzy candidates (yellow) or nothing (red).

## Decisions (agreed)

1. **Yellow → confirm _is_ the alias write** — persists the observed string as an alias, so
   the same soup is green next year. The whole `jährlich` payoff.
2. **Red defaults to "add new category," never discard** — inaction is lossless; discard is
   only ever a deliberate click.
3. **Aliases extend the existing `updateDimensionCategories` mutation** (it only touches
   fields present in the input). Cost: no atomic add/remove — send the full mutated list;
   commit therefore **groups alias additions per category** (`groupAliasWrites`) so two
   labels resolving to one category can't clobber each other.
4. **Row colour = weakest axis** when multiple dimensions are columns.
5. **New-category UUIDs are generated client-side** and passed as
   `CreateDimensionCategoryInput.id`.
6. **The active category filter supplies pins** for absent dimensions, but never constrains
   matching for pasted dimensions.

## Backend (pending, gentle path)

- **No migration**: `datasets_dimensioncategory.spec` is already `jsonb` — aliases live
  there (`spec.aliases: string[]`).
- Expose `aliases: [String!]` on the category GraphQL type (read; add to
  `DatasetDetailFields` → matching picks up the alias tier automatically), and accept
  `aliases` on `UpdateDimensionCategoryInput` (write).
- Matching runs **client-side for now** (schema + categories already in
  `DatasetDetailFields`); hoist to a server `previewDatasetImport` endpoint if import grows
  into a file-upload / API pipeline shared with the Python side.

## Verification

Pure core verified against both tabs of the real example file and the real BISKO
`Energieträger` taxonomy (`datasets_dimension` id 368): Worksheet → 23/23 green,
totals/footer excluded, 2021–2022 detected as new years, a seeded point detected as
overwrite, alias-grouping merges correctly; synthetic messy labels exercise yellow
(`CNG biogen → CNG bio`) and red (`Stadtgas`). No in-repo test runner yet — a vitest suite
should wrap these pure functions (scratch harness lived at `/tmp/verify-import.ts`).

## Found issues / notes

- **NUL byte (fixed):** `DatasetDataGrid.tsx` had a stray `\x00` inside the sentinel
  `const NO_CATEGORY = '\x00no-category'` (byte 4453). Git classified the whole `.tsx` as
  **binary** (`Bin … bytes` in diffs), so `grep`/`git grep` silently skipped it — which is
  why "Filter by category" was unfindable. Stripped to `'no-category'`; the file is text
  again. Lesson: those strings are literal in-source, not i18n.
- **Branch reality:** the filter/sort feature lives on `feature/improving-dataset-editing`
  (commits `2d7918bd`, `b727731f`, `71a23674`); `main` lacks it, and the `testing`
  deployment is built from yet another branch. Verify which branch is live before the demo.
- `muenchen-bisko` was not in the local DB at build time (only `muenchen-demo` and other
  `*-bisko`); matching grounded on the shared BISKO taxonomy.
- Dataset-tab column mapping (recognising `Dataset/Metric/Quantity/Unit` metadata vs
  `sector`/`energy_carrier` dimension columns) is handled by `inferColumnMapping` +
  user override in the modal.
- Multilingual: category `label` + `i18n` jsonb hold localised labels; the export is
  German. Match against the German label; aliases are locale-agnostic.
