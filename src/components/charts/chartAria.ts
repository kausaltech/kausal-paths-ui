/**
 * Helpers for composing custom aria-label descriptions in ECharts' own,
 * locale-pack-translated wording. Used where the native aria generator falls
 * short (it describes every series by its literal name and enumerates raw
 * data, including helper series and null padding).
 *
 * Get the pack via `getEChartsLocaleStrings` from
 * `@common/components/register-echarts-locales`.
 */

/** Subset of the ECharts locale-pack shape used for aria descriptions */
export type EChartsLocalePack = {
  aria?: {
    general?: { withTitle?: string; withoutTitle?: string };
    series?: {
      single?: { prefix?: string; withName?: string; withoutName?: string };
      multiple?: {
        prefix?: string;
        withName?: string;
        withoutName?: string;
        separator?: { middle?: string; end?: string };
      };
    };
    data?: {
      allData?: string;
      withName?: string;
      separator?: { middle?: string; end?: string };
    };
  };
  series?: { typeNames?: { line?: string; bar?: string } };
};

/** Interpolate an ECharts locale template, e.g. 'the data for {name} is {value}' */
export function formatAriaTemplate(
  template: string | undefined,
  values: Record<string, string | number> = {}
): string {
  return (template ?? '').replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''));
}
