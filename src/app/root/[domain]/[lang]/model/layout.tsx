import type { ReactNode } from 'react';
import { cookies } from 'next/headers';

import { NextIntlClientProvider } from 'next-intl';

import { EDITOR_UI_LOCALE_COOKIE } from '@/common/editor-locale';
import ModelEditorShell from '@/components/model-editor/ModelEditorShell';
import { importLocales } from '@/config/i18n';

type Props = {
  children: ReactNode;
  params: Promise<{ domain: string; lang: string }>;
};

/**
 * Server layout for the model editor. The editor's *interface* language is a
 * per-user preference held in a cookie, independent of the `[lang]` URL segment
 * (which keeps driving the *content* language sent to the backend). We resolve
 * the preferred UI locale here, load its next-intl messages, and override the
 * locale for the editor subtree with a nested `NextIntlClientProvider` — other
 * config (timeZone, formats) is inherited from the ancestor provider. Falls
 * back to the content locale when no preference is set, so behaviour is
 * unchanged until the user picks an interface language in Settings.
 */
export default async function ModelEditorLayout({ children, params }: Props) {
  const { lang } = await params;
  const cookieStore = await cookies();
  const uiLocale = cookieStore.get(EDITOR_UI_LOCALE_COOKIE)?.value || lang;
  const messages = await importLocales(uiLocale);

  return (
    <NextIntlClientProvider locale={uiLocale} messages={messages}>
      <ModelEditorShell>{children}</ModelEditorShell>
    </NextIntlClientProvider>
  );
}
