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
| 3    | `src/components/graphs/ActionComparisonGraph.tsx`            | ⬜                                  |
| 4    | `src/components/graphs/MacGraph.tsx`                         | ⬜                                  |
| 5    | `src/components/general/NodePlot.tsx`                        | ⬜                                  |
| 6    | `src/components/graphs/DimensionalFlow.tsx`                  | ⬜                                  |
| 7    | `kausal_common/src/components/paths/DimensionalPieGraph.tsx` | ✅ Migrated (shared, see notes)     |
| 8    | Final cleanup (delete `Plot.tsx`, drop deps)                 | ⬜                                  |

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

### 3. ActionComparisonGraph (`src/components/graphs/ActionComparisonGraph.tsx`)

Used by `src/components/general/ActionsComparison.tsx`. A `barmode: 'relative'`
bar chart of action impacts where hovering a bar populates a React detail
panel (`ActionDescription`) below the chart.

- Replace Plotly `onHover` with the ECharts `mouseover` event on the chart
  instance. The `Chart` wrapper currently exposes only `onZrClick` and a
  `ChartHandle` ref with `getDataURL` — either extend the wrapper with a
  generic event prop (e.g. `onMouseOver`) or extend `ChartHandle` to expose
  the instance for event binding. Extending the wrapper benefits MacGraph too.
- Keep the detail-panel React code as-is; only the hovered index changes
  source.
- Tooltip labels use `truncateLabel` from `chartTooltip.ts` (MacGraph already
  imports it).
- Remove the `.js-plotly-plot` selector from its styled `GraphContainer`.

### 4. MacGraph (`src/components/graphs/MacGraph.tsx`)

Used by `src/components/general/EfficiencyGraph.tsx`. A MAC curve: bars with
**per-bar variable widths** (width = impact, height = efficiency, bars laid
end-to-end along a linear x-axis via the computed `xPlacement` midpoints).

- ECharts' `bar` series cannot do per-datum widths → use a `custom` series
  (`CustomChart` is already registered in `Chart.tsx`). Give each datum
  `[xStart, xEnd, efficiency]` and a `renderItem` that returns a rect from
  those coordinates; keep a linear `value` x-axis with the unit ticksuffix.
- The running-total placement logic (`xPlacement`, `negativeSideWidth`)
  carries over unchanged; only the rendering changes.
- The red negative-side backdrop (Plotly `shapes`) becomes a `markArea` (or a
  second custom-series rect) spanning `x < 0`.
- Same hover→detail-panel pattern as ActionComparisonGraph (do that one first
  and reuse the wrapper event support). Hover highlight (per-bar border color/
  width) maps to `emphasis.itemStyle` on the custom series.
- The old CSS hack hiding `.hoverlayer .axistext` (internal xPlacement values
  leaking into the hover callout) becomes unnecessary — delete it.

### 5. NodePlot (`src/components/general/NodePlot.tsx`)

The most widely used: `CausalGrid`, `CausalCard`, and the action detail page
(`(with-layout)/actions/[slug]/page.tsx`). Multi-series time-series chart:

- Historical line (spline, optional `filled` area, markers when ≤8 points).
- Dotted 2-point join segment between last historical and first forecast
  point (no legend, no hover).
- Forecast line (green when the node is an action or has impact).
- Impact band: "without action" line with `fill: 'tonexty'` up to the
  forecast line → in ECharts, a stacked-area pair (invisible base series +
  delta series) or two `areaStyle` series; check how the shared
  [`NodeGraph`](../kausal_common/src/components/paths/NodeGraph.tsx) renders
  similar bands and reuse its approach if possible.
- Optional baseline forecast (dashed grey, gated by
  `instance.features.baselineVisibleInGraphs`).
- Target-year goal: horizontal dotted red line (Plotly `shape`) → `markLine`
  (`MarkLineComponent` is registered).
- Unified hover (`hovermode: 'x unified'`) → `tooltip.trigger: 'axis'` with
  `createAxisTooltipFormatter`; unit HTML is fine inside the tooltip.
- Plotly used a date x-axis padded ~Nov(startYear−1)–Feb(endYear); a category
  axis of years (like other migrated charts) is simpler — `boundaryGap` and
  spline smoothing (`smooth: true`) cover the visual intent.
- The weird tiny second x-axis (`xaxis` domain `[0, 0.03]`) only created a
  detached y-axis gutter — drop it.
- `compact` prop: smaller height (200 vs 300), no legend, tighter margins.
- The CSV download (`react-json-to-csv`) is pure React — keep untouched.
- `metricToPlot` (`src/common/preprocess.ts`) is chart-library-agnostic
  (returns `{x, y}` arrays) — keep using it.

### 6. DimensionalFlow (`src/components/graphs/DimensionalFlow.tsx`)

Used by the action detail page (imported as `DimensionalPlot`). A Sankey
diagram of action impact flows for the selected end year.

- ECharts has `SankeyChart` (in `echarts/charts`) but it is **not registered**
  in `Chart.tsx`. Register it lazily if reasonable so every chart consumer
  doesn't pay for the sankey module; otherwise add it to the shared
  `echarts.use([...])` list and note the bundle impact.
- Restructure `makeFrame`'s parallel-arrays output (`link.source/target/value`
  index arrays) into ECharts `{ nodes: [{name, itemStyle}], links: [{source,
target, value, lineStyle}] }`. Node/link colors (including the
  `tint`/`transparentize` link colors) map to `itemStyle.color` /
  `lineStyle.color`.
- Plotly's `valueformat: ',.3r'` + HTML unit in hover → sankey tooltip
  formatter with `formatNumber` + `unit.htmlLong`.
- This one uses `BasicPlot` (the imperative Plotly wrapper) and has a known
  responsiveness bug (see TODO in file) — migrating to `Chart` fixes resize
  handling for free. Remove the leftover `console.log`/`useEffect` debug too.

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

### 8. Final cleanup

- Delete `src/components/graphs/Plot.tsx` (both `Plot` and `BasicPlot`).
- Remove from `package.json`: `plotly.js`, `plotly.js-locales`,
  `react-plotly.js`, `@types/plotly.js`, `@types/react-plotly.js`.
- `grep -rn plotly src/ package.json` must come up empty (also check for
  `.js-plotly-plot` CSS selectors and `react-plotly` type imports).
- Prune baselines: `pnpm lint:baseline:update` and
  `pnpm typecheck:baseline:update` (then `prettier --write` both baseline
  JSON files — the tools write them unformatted).
- Check `next.config.ts` / webpack config for any plotly-specific settings.

## Verification per step

- `pnpm typecheck:baseline` and `pnpm lint:baseline` must pass (prune
  baselines when a migration removes suppressed errors).
- Visual check in the dev server against production for the affected views
  (outcome page single-year view, actions comparison page, action detail
  page, node/causal pages).
