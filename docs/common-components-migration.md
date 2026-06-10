# Migrating chart components to `kausal_common`

This documents the effort to replace the app-local visualization components under
`src/components/general/` with their shared counterparts in the
`kausal_common/src/components/paths/` submodule, so kausal-paths-ui and
kausal-watch-ui stop maintaining two copies.

There are two components in scope, and they are **very different** in difficulty:

| Component                      | Nature                                  | Difficulty               |
| ------------------------------ | --------------------------------------- | ------------------------ |
| `NodeGraph`                    | Presentational (ECharts option builder) | Small — **step 1, done** |
| `DimensionalNodeVisualisation` | Data-layer bound (metric parsing)       | Large — deferred         |

## Core finding

The local and common implementations are the **same algorithms in two shapes**:

- The local code is built on the **class-based** metric layer `@/data/metric`
  (`new DimensionalMetric(metric)`, methods on `this`).
- The common code is built on the **functional** metric layer
  `@common/utils/paths/metric` (`parseMetric(metric)`, `sliceBy(metric, …)` —
  every class method maps almost 1:1 to a function with `metric` as the first arg).

So the hard part is never re-implementing logic — it is the data-layer plumbing,
codegen wiring, and a handful of genuine gaps.

## Cross-cutting blockers (discovered during step 1)

These bit `NodeGraph` and will bite `DimensionalNodeVisualisation` too.

1. **i18n namespace mismatch (important).**
   - kausal-watch-ui flattens all locale files into one root object
     (`{ ...common, ...actions, ...paths }`), so the common components can call
     `useTranslations()` with bare keys like `t('plot-total')`.
   - kausal-paths-ui keeps namespaces (`{ common: {...}, errors: {...} }`), so
     those bare lookups resolve to nothing and render the raw key.
   - **Resolution:** decouple the common component's labels from its internal
     `useTranslations()`. The backward-compatible pattern is an **optional
     `labels` prop**: when omitted, the component falls back to its internal
     `t()` (watch keeps working unchanged); when provided, the caller injects
     already-translated strings (paths passes namespaced `useTranslations('common')`
     output). This is the pattern used for `NodeGraph` in step 1.

2. **`@generated/paths` does not resolve in this app.** The common components
   import GraphQL fragment types from `@generated/paths/graphql`, which has no
   tsconfig path alias here. The fragment _shapes_ are structurally identical to
   the app's `@/common/__generated__/graphql`, so the fix is to either point those
   imports at the app's codegen or make the components rely only on the structural
   `MetricInput` type. (`NodeGraph` is unaffected — it imports no generated types.)

3. **Theme is injected, not hooked.** Common components take `theme` as a prop
   (`@kausal/themes/types`), where the local ones call `useTheme()`. The app's
   `useTheme` (re-exported MUI hook) returns a theme augmented with the kausal
   theme, so passing it down typechecks.

## Step 1 — `NodeGraph` (DONE)

### Changes to the common component (`kausal_common/src/components/paths/NodeGraph.tsx`)

All additive and backward-compatible — kausal-watch-ui is unaffected because every
new prop is optional with a fallback to existing behavior:

- **`chartRef?: Ref<ChartHandle>`** — forwarded to `<Chart>` so the PNG export
  (`getDataURL`) used by the app's tools menu keeps working. The common component
  previously only passed `locale`; it now passes both.
- **`formatAxisValue?: (value: number) => string`** — used for the y-axis label
  formatter, falling back to `formatValue`. Preserves the app's distinction
  between abbreviated axis labels (`useAxisLabelFormatter`) and full-precision
  tooltip values (`useNumberFormatter`); when omitted the axis uses `formatValue`
  as before.
- **`labels?` object** — `{ total, goal, baseline, progress, measured, comparisonYear, forecast }`,
  each falling back to the corresponding internal `t()` call. Resolves the i18n
  namespace mismatch above.

### Changes in the app

- `src/components/general/DimensionalNodeVisualisation.tsx` now imports
  `NodeGraph` from `@common/components/paths/NodeGraph` and injects `theme`,
  `formatValue` (`useNumberFormatter`), `formatAxisValue` (`useAxisLabelFormatter`),
  `unit` (as `{ htmlLong, htmlShort }`), `maximumFractionDigits`, `predictionLabel`
  (the NZP-aware `planned`/`pred` choice), and the `labels` object.
- `src/components/general/NodeGraph.tsx` is deleted (its only importer was
  `DimensionalNodeVisualisation`, and `getPredictionLabel` was used only
  internally — its logic moved into the caller).

### Verification

- Visual check on the OutcomePage chart: bars, forecast shading, reference-year
  gap, goal dots, tooltip year labels, abbreviated y-axis labels, and PNG export.

## Deferred — `DimensionalNodeVisualisation` (the metric-layer migration)

This is **not** a presentational swap. Adopting the common component means moving
the app onto the functional metric layer.

### Blast radius of `@/data/metric`

Runtime consumers of the class (each must migrate to functional calls to retire
the class):

| Consumer                                             | Cost                                            |
| ---------------------------------------------------- | ----------------------------------------------- |
| `DimensionalNodeVisualisation.tsx`                   | the target; ~10 methods                         |
| `useProgressData.ts`                                 | hard — constructs scenario-filtered metrics     |
| `progress-tracking/ProgressDriversVisualization.tsx` | hard — `ALL_SCENARIOS`                          |
| `CostBenefitAnalysis.tsx`                            | medium — `.rows`, `.dimensions`, `hasDimension` |
| `DimensionalBarGraph.tsx`                            | medium — `getSingleYear`, `hasDimension`        |

Trivial: `queries/dimensionalNodePlot.ts`, `getActionContent.js`,
`getNodeVisualizations.ts`, `visualizationEntryFragment.ts` use only the
`DimensionalMetric.fragment` gql string — relocate the fragment.

Out of scope: the model-editor has its **own** separate `DimensionalMetric`
(`src/components/model-editor/dimensional-metric.ts`, different API) used by 3-4
files — not the same class, not part of this migration.

### Genuine gaps in the functional layer

- **Scenario filtering is missing.** The class constructor filters by scenario
  (`new DimensionalMetric(metric, 'progress_tracking' | ALL_SCENARIOS)`);
  `parseMetric()` does not. The common `DimensionalNodeVisualisation` sidesteps
  this by handling progress tracking via a scenario-dimension _category choice_,
  so the component swap itself does not need it — but `useProgressData` and
  `ProgressDrivers` do. This is the riskiest port.
- **`getDimensionLabel` / `getCategoryLabel`** have no functional equivalent —
  trivial to inline via `metric.dimsById`, or add two helpers to the common layer.
- **`sliceBy` always filters zeros** (the class had a `filterZero` flag) — confirm
  no consumer relied on `filterZero: false`.
- **Sub-components:** the common `ToolsMenu` does xlsx/csv only (no PNG); PNG must
  be ported in. The common `DimensionControls` needs `ParsedMetric` input.

### Two strategies

- **Strategy A — component swap only.** Make `DimensionalNodeVisualisation` use
  `parseMetric` + functional utils; leave the class for the other consumers.
  Smaller, but the two metric layers coexist (the duplication remains).
- **Strategy B — full convergence.** Migrate all 5 runtime consumers, port
  scenario filtering into the functional layer, relocate the fragment, delete
  `@/data/metric`. Larger, but removes the duplication for real.

### Recommended sequencing

1. `NodeGraph` migration (step 1) — **done**.
2. Strategy A for `DimensionalNodeVisualisation`, verified behind its 3 callers
   (`node/[slug]/page.tsx`, `OutcomeNodeContent.tsx`, `MetricsDrawer.tsx`).
3. Only if the class should be retired: Strategy B as its own tracked effort —
   scenario filtering first, then one consumer per PR.

### Behavioral diffs to watch when adopting the common parent

- Common builds the goal table only for years that actually have goals.
- Different subtitle / dimension-group handling.
- `getFilteredYears` derives the last year from the slice vs the class path's
  `metric.years`.
- Confirm `@common/utils/paths/progress-tracking` parity with the app's
  `@/utils/progress-tracking`.
