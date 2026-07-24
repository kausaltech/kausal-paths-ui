# Plotly → ECharts migration

Goal: remove the Plotly dependency entirely (`plotly.js`, `plotly.js-locales`,
`react-plotly.js` and their `@types` packages) by migrating the remaining
Plotly-based components to ECharts. Plotly is one of the heaviest dependencies
in the app, so this is a significant bundle-size win.

## Approach

Migrate one component at a time, easiest first. Each migration should:

- Use the shared [`Chart`](../kausal_common/src/components/Chart.tsx) wrapper
  (theme via `getChartTheme`, locale registration, resize + legend handling,
  loading state) — never `echarts.init` directly.
- Follow the conventions of existing ECharts components, e.g.
  [`StackedRawImpact`](../src/components/general/StackedRawImpact.tsx):
  a pure `getChartConfig(...)` → `EChartsCoreOption` function, memoized in the
  component, tooltips via
  [`createAxisTooltipFormatter`](../src/components/charts/chartTooltip.ts).
- Render backend HTML units (`unit.htmlShort`/`htmlLong` contain
  sub/superscript markup) in React elements or HTML tooltips, never in ECharts
  canvas text (axis labels, titles).
- Treat the migration as a chance to simplify, not a 1:1 port — several Plotly
  configs carry dead options (modebar tweaks on static charts etc.). Note any
  intentional behavior changes in the PR/commit message.

## Status

| Step | Component                                                    | Status                              |
| ---- | ------------------------------------------------------------ | ----------------------------------- |
| 1    | `src/components/general/BarGraph.tsx`                        | ✅ Deleted (was unused)             |
| 2    | `src/components/general/DimensionalBarGraph.tsx`             | ✅ Deleted (replaced by shared pie) |
| 3    | `src/components/graphs/ActionComparisonGraph.tsx`            | ✅ Migrated                         |
| 4    | `src/components/graphs/MacGraph.tsx`                         | ✅ Migrated                         |
| 5    | `src/components/general/NodePlot.tsx`                        | ✅ Migrated                         |
| 6    | `src/components/graphs/DimensionalFlow.tsx`                  | ✅ Migrated                         |
| 7    | `kausal_common/src/components/paths/DimensionalPieGraph.tsx` | ✅ Migrated (shared, see notes)     |
| 8    | Final cleanup (delete `Plot.tsx`, drop deps)                 | ✅ Done                             |

Find any stragglers with: `grep -rln plotly src/ kausal_common/src/`

### Step 2 notes (done)

`DimensionalBarGraph` was first migrated to ECharts, then replaced entirely by
the shared, Plotly-based
`kausal_common/src/components/paths/DimensionalPieGraph.tsx` (used by
`OutcomeNodeContent`'s single-year view). Two wiring notes from that
replacement:

- `src/common/cache.ts` now aliases `activeGoalVar` from
  `@common/apollo/paths-cache` instead of defining its own, so shared paths
  components observe the goal this app sets. The cast there is because the
  app's goal fragment doesn't query `separateYears`.
- The pie graph's `@generated/paths/graphql` import doesn't resolve in this
  repo (type-only, erased at build) — its TS error is baselined, same as
  kausal_common's `DimensionalNodeVisualisation`.

## Remaining components

### 3. ActionComparisonGraph (done)

Used by `src/components/general/ActionsComparison.tsx` (the default graph on
the actions page; reachable on all instances since the graph view was
un-gated from `hasEfficiency`). Notes from the migration:

- The shared `Chart` wrapper gained a generic `onEvents` prop
  (`Record<eventName, handler>`), bound once at chart init through a ref —
  handler identity changes don't re-init the chart, but the set of event
  names must stay stable. MacGraph should reuse this.
- Hover → detail panel now uses the `updateAxisPointer` event (axis-pointer
  category index) instead of Plotly's `onHover`: hovering anywhere in a
  column selects the action, even when its bar is tiny. The panel itself is
  unchanged.
- Axis titles are canvas text, so the y-axis unit strips the HTML markup;
  the tooltip (DOM) keeps the HTML unit, formatted via `useNumberFormatter`
  instead of Plotly's `.3r`.
- Per-bar colors/white borders map to per-datum `itemStyle`.

### 4. MacGraph (done)

Used by `src/components/general/EfficiencyGraph.tsx`. A MAC curve: bars with
per-bar variable widths (width = impact, height = efficiency), now a `custom`
series whose data is `[xStart, xEnd, efficiency]` with a rect `renderItem`.
Notes from the migration:

- `AxisPointerComponent` was added to the shared `Chart.tsx` registration —
  needed for a standalone axis pointer when the tooltip is item-trigger.
- Hover → detail panel: the x-axis has an always-on axis pointer
  (`label: {show: false}` replaces the old CSS hack that hid Plotly's
  meaningless x-callout), and `updateAxisPointer` maps the pointer's x to a
  bar's `[start, end]` range — Plotly's `hovermode: 'x'` equivalent, works
  even above/below bars.
- The hovered bar's darker border uses native emphasis (`styleEmphasis` in
  `renderItem`) and only triggers when hovering the bar itself — slightly
  narrower than the old React-state-driven border, but avoids a full
  `setOption` per hover. Verify visually along with the `markArea`/`markLine`
  negative-side backdrop (both attached to the custom series).
- `api.style()` is deprecated in ECharts 6 — the rect style (per-action fill,
  white borders) is built explicitly in `renderItem` instead.
- `stripHtml` (backend HTML units → canvas axis titles) now lives in
  `chartTooltip.ts`, shared with ActionComparisonGraph.

### 5. NodePlot (done)

The most widely used: `CausalGrid`, `CausalCard`, and the action detail page.
Now a category-axis (years) multi-series line chart via the shared `Chart`
wrapper; all series are aligned to the year union with `null` gaps. Notes:

- The dotted historical→forecast connector and the impact band's delta series
  are helper series named `__join` / `__impact-band`: excluded from the
  legend via explicit `legend.data` and filtered out of the tooltip formatter
  (which also drops series with no value at the hovered year, mimicking
  Plotly's unified hover).
- Impact band = forecast series doubles as stack base + a stacked delta
  series with `areaStyle` fills up to the "without action" level; a separate
  zero-width line carries the absolute "without action" values for
  legend/tooltip. Its legend label changed from "action impact" to "without
  this action" (`plot-without-action`) — clearer, since that's what the line
  is.
- Goal: `markLine` (dotted red) + a single-point series at the target year
  for the legend entry.
- Plotly's date x-axis with Nov/Feb padding became a plain year category
  axis (`boundaryGap: false`); the vestigial second x-axis is gone.
- `rangemode: 'tozero'` for emissions → `yAxis.scale = quantity !==
'emissions'`.
- CSV download and `metricToPlot` untouched, as planned.

### 6. DimensionalFlow (done)

Used by the action detail page (imported as `DimensionalPlot`). A Sankey of
action impact flows for the selected end year. Notes from the migration:

- `SankeyChart` is registered by `DimensionalFlow` itself
  (`echarts.use([SankeyChart])` at module level), NOT in the shared
  `Chart.tsx` list: `echarts.use` is a global registry, and since only the
  actions route imports this component, the ~48K sankey module lands in that
  route's chunk instead of every chart-bearing page. Follow this pattern for
  other rarely-used chart types.
- ECharts sankey links reference nodes **by name**, and the same flow node
  appears in several columns with identical labels — so nodes get unique
  internal names (`start:`/`now:`/`remaining:` + id) and carry a
  `displayName` rendered via label/tooltip formatters.
- The `tint`/`transparentize` link colors carry their own alpha, so links set
  `lineStyle.opacity: 1` to avoid double-fading with ECharts' 0.2 default.
- Null/non-positive link values are skipped instead of passed through.
- Tooltips: `formatNumber` + `unit.htmlLong` for both nodes and edges
  (edges show "from → to").
- The old `BasicPlot` resize bug is gone for free (shared wrapper has a
  ResizeObserver); the leftover `console.log` debug was dropped.
- Verify visually: the three parallel `start→now` links per source
  (remaining / impact / other) rendering as distinct ribbons is the least
  common ECharts sankey pattern used here.

### 7. DimensionalPieGraph (done)

`kausal_common/src/components/paths/DimensionalPieGraph.tsx` — migrated to
ECharts using the shared `Chart` wrapper (one `Chart` per column-category
donut, center total as a centered `title`, percentages in legend names as
before, preformatted HTML tooltips). Pie sizing changed deliberately: pies
now scale so their **area** is proportional to the column total
(radius ∝ √(total/maxTotal)). The old Plotly domain math (`±0.95 × ratio`
around the center) saturated at container size for ratios above ~0.53, so
most pies rendered equally large; the new scaling is subtler than a linear
radius map but actually informative. Notes:

- It lives in the shared submodule and is also used by **kausal-watch-ui**
  (`src/components/paths/outcome/OutcomeNodeContent.tsx`); both apps pin the
  `feature/common-outcome-pie` branch. The props interface was kept identical,
  and watch-ui already uses the shared `Chart` wrapper elsewhere
  (`IndicatorSparkline`), so it picks the change up when it bumps its
  submodule pointer — verify visually there too.
- It no longer imports the app-local `@/components/graphs/Plot`, so it no
  longer blocks final cleanup in this repo.
- Deliberate simplifications: tooltip/unit HTML goes through
  `sanitizeHtmlUnit`; legend item clicks disabled via `selectedMode: false`
  (was Plotly `itemclick: false`); the dead modebar config dropped.

### 8. Final cleanup (done)

`Plot.tsx` deleted; `plotly.js`, `plotly.js-locales`, `react-plotly.js` and
both `@types` packages removed; baselines pruned; CLAUDE.md tech-stack line
updated. `grep -rln plotly src/ package.json` comes up empty. No
plotly-specific settings existed in `next.config.ts`.

Deliberately kept: the `.js-plotly-plot` / `.plotly` print-CSS selectors in
`kausal_common/src/themes/ThemedGlobalStyles.tsx` — the shared submodule also
serves **kausal-watch-ui**, which still uses Plotly for its own graphs.

Post-migration trivia: the old Plotly sankey (`BasicPlot`) turned out to be
broken in production (rendered an empty axes box — the unresolved
responsiveness TODO), so the ECharts migration fixed it rather than merely
matching it.

## Verification per step

- `pnpm typecheck:baseline` and `pnpm lint:baseline` must pass (prune
  baselines when a migration removes suppressed errors).
- Visual check in the dev server against production for the affected views
  (outcome page single-year view, actions comparison page, action detail
  page, node/causal pages).
