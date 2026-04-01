import { useCallback, useMemo } from 'react';

import { useLocale } from 'next-intl';

import {
  DEFAULT_SIGNIFICANT_DIGITS,
  formatWithFormatter,
  makeFormatter,
} from '@common/utils/format';

import { useFeatures } from './instance';

/**
 * Returns a locale-aware axis label formatter for ECharts.
 * Applies locale decimal and thousands separators without overriding ECharts' auto-precision.
 * Use this for yAxis/xAxis axisLabel.formatter — not for tooltips or other formatted values.
 *
 * @example
 * const formatAxisLabel = useAxisLabelFormatter();
 * yAxis: { axisLabel: { formatter: formatAxisLabel } }
 * // With appended unit:
 * yAxis: { axisLabel: { formatter: (v) => `${formatAxisLabel(v)} kt` } }
 */
export function useAxisLabelFormatter() {
  const locale = useLocale();
  const formatter = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  return useCallback((value: number) => formatter.format(value), [formatter]);
}

/**
 * Returns a locale- and instance-settings-aware number formatter function.
 * Reads locale, showSignificantDigits and maximumFractionDigits from context.
 *
 * @example
 * const formatNumber = useNumberFormatter();
 * formatNumber(1234.5)        // uses instance significant digits
 * formatNumber(1234.5, 0)     // override: round to integer
 */
export function useNumberFormatter() {
  const locale = useLocale();
  const { showSignificantDigits, maximumFractionDigits } = useFeatures();

  const formatter = useMemo(
    () =>
      makeFormatter(
        locale,
        showSignificantDigits ??
          (typeof maximumFractionDigits === 'number' ? undefined : DEFAULT_SIGNIFICANT_DIGITS),
        maximumFractionDigits ?? undefined
      ),
    [locale, showSignificantDigits, maximumFractionDigits]
  );

  return useCallback(
    (value: number, fractionDigitsOverride?: number) => {
      if (typeof fractionDigitsOverride === 'number') {
        return formatWithFormatter(makeFormatter(locale, undefined, fractionDigitsOverride), value);
      }
      return formatWithFormatter(formatter, value);
    },
    [locale, formatter]
  );
}
