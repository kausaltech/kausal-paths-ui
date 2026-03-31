import { useCallback } from 'react';

import { useLocale } from 'next-intl';

import { beautifyValue } from '@common/utils/format';

import { useFeatures } from './instance';

/**
 * Returns a locale- and instance-settings-aware number formatter function.
 * Reads locale, showSignificantDigits and maximumFractionDigits from context.
 *
 * @example
 * const formatNumber = useNumberFormatter();
 * formatNumber(1234.5)        // uses instance significant digits
 * formatNumber(1234.5, 0)     // override: round to integer
 */
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
  return useCallback((value: number) => new Intl.NumberFormat(locale).format(value), [locale]);
}

export function useNumberFormatter() {
  const locale = useLocale();
  const { showSignificantDigits, maximumFractionDigits } = useFeatures();

  return useCallback(
    (value: number, fractionDigitsOverride?: number) =>
      beautifyValue(
        value,
        locale,
        showSignificantDigits ?? undefined,
        fractionDigitsOverride ?? maximumFractionDigits ?? undefined
      ),
    [locale, showSignificantDigits, maximumFractionDigits]
  );
}
