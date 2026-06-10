'use client';

import { useFormatter, useTranslations } from 'next-intl';

// next-intl is configured with a fixed `timeZone` of 'UTC' (a constant value
// keeps server/client renders in sync), but editor timestamps should read in
// the viewer's local time, as they did before. These widgets render
// client-side (their data loads via client queries), so resolving the browser
// timezone here is safe and avoids a UTC shift.
function localTimeZone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
}

function toDate(value: Date | string | number): Date {
  return value instanceof Date ? value : new Date(value);
}

/**
 * Locale-aware date/time formatting for the model editor, driven by next-intl
 * (`useFormatter`) so the format follows the editor's interface language. All
 * helpers render in the viewer's local timezone. `relativeTime` localises the
 * recent-change wording and falls back to an absolute date/time past a day.
 */
export function useEditorDateFormat() {
  const format = useFormatter();
  const t = useTranslations('model-editor');
  const timeZone = localTimeZone();

  const dateTime = (value: Date | string | number): string => {
    const d = toDate(value);
    if (Number.isNaN(d.getTime())) return typeof value === 'string' ? value : '';
    return format.dateTime(d, { dateStyle: 'medium', timeStyle: 'short', timeZone });
  };

  const date = (value: Date | string | number): string => {
    const d = toDate(value);
    if (Number.isNaN(d.getTime())) return typeof value === 'string' ? value : '';
    return format.dateTime(d, { dateStyle: 'medium', timeZone });
  };

  const relativeTime = (value: Date | string | number, now: number): string => {
    const d = toDate(value);
    if (Number.isNaN(d.getTime())) return typeof value === 'string' ? value : '';
    const diffSec = Math.max(0, Math.round((now - d.getTime()) / 1000));
    if (diffSec < 45) return t('editor-relative-just-now');
    if (diffSec < 60 * 60)
      return t('editor-relative-minutes-ago', { count: Math.round(diffSec / 60) });
    if (diffSec < 24 * 60 * 60)
      return t('editor-relative-hours-ago', { count: Math.round(diffSec / 3600) });
    return dateTime(d);
  };

  return { dateTime, date, relativeTime };
}
