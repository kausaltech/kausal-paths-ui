import type { TooltipComponentFormatterCallbackParams } from 'echarts';

/** Tooltip labels (action names) are capped at this many characters across all graphs. */
export const MAX_TOOLTIP_LABEL_LENGTH = 42;

/** Truncate a label to `max` characters, appending an ellipsis when it overflows. */
export function truncateLabel(label: string, max = MAX_TOOLTIP_LABEL_LENGTH): string {
  return label.length > max ? `${label.slice(0, max - 1)}…` : label;
}

/**
 * Strip HTML tags, e.g. from backend HTML units (`unit.htmlShort`) so they
 * can be used in canvas-rendered text like axis titles.
 */
export function stripHtml(html: string): string {
  // Strip repeatedly: a single pass can splice new tags together
  // (e.g. `<<b>script>` → `<script>`), which CodeQL rightly flags.
  let out = html;
  let prev: string;
  do {
    prev = out;
    out = out.replace(/<[^>]*>/g, '');
  } while (out !== prev);
  return out;
}

// Minimal view of the per-series params ECharts passes to an axis-trigger tooltip
// formatter. Typed loosely because the public CallbackDataParams omits the
// axis/dataset fields we read here.
type AxisTooltipParam = {
  value?: unknown;
  seriesName?: string;
  marker?: unknown;
  name?: string;
  axisValueLabel?: string;
  encode?: Record<string, number[] | undefined>;
  dimensionNames?: string[];
};

// Pull the value-axis number out of a param, handling both plain series
// (scalar value) and dataset-encoded series (value is a row keyed/indexed by
// dimension), where the encode map points at the value dimension.
function extractValue(param: AxisTooltipParam): number | null {
  const raw = param.value;
  if (raw == null) return null;
  if (typeof raw === 'number') return raw;
  const dimIdx = param.encode?.x?.[0] ?? param.encode?.y?.[0];
  if (dimIdx == null) return null;
  if (Array.isArray(raw)) {
    const v = (raw as unknown[])[dimIdx];
    return v == null ? null : Number(v);
  }
  const dimName = param.dimensionNames?.[dimIdx];
  if (dimName != null && typeof raw === 'object' && dimName in raw) {
    const v = (raw as Record<string, unknown>)[dimName];
    return v == null ? null : Number(v);
  }
  return null;
}

/**
 * Build an axis-trigger tooltip formatter that mirrors ECharts' default layout
 * (title, then one marker + name + value row per series) but caps the title and
 * every series name at {@link MAX_TOOLTIP_LABEL_LENGTH}. `formatValue` reuses
 * each chart's own value/unit formatting.
 */
export function createAxisTooltipFormatter(formatValue: (value: number | null) => string) {
  return (params: TooltipComponentFormatterCallbackParams): string => {
    const items = (Array.isArray(params) ? params : [params]) as AxisTooltipParam[];
    if (items.length === 0) return '';
    const title = truncateLabel(String(items[0].axisValueLabel ?? items[0].name ?? ''));
    // The series name only disambiguates when more than one series is present;
    // for a single-series chart the title already labels the row, so showing the
    // name (ECharts auto-generates "series0" for unnamed series) is just noise.
    const showSeriesName = items.length > 1;
    const rows = items.map((p) => {
      const marker = typeof p.marker === 'string' ? p.marker : '';
      const name = showSeriesName ? `${truncateLabel(String(p.seriesName ?? ''))}&nbsp;&nbsp;` : '';
      return `${marker}${name}<b>${formatValue(extractValue(p))}</b>`;
    });
    return [`<b>${title}</b>`, ...rows].join('<br/>');
  };
}
