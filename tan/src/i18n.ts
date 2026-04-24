export type Messages = Record<string, Record<string, string>>;

const FALLBACK_LOCALE = 'en';

function getLocaleChain(locale: string): string[] {
  const chain: string[] = [locale];
  const hyphen = locale.indexOf('-');
  if (hyphen > 0) chain.push(locale.slice(0, hyphen));
  if (!chain.includes(FALLBACK_LOCALE)) chain.push(FALLBACK_LOCALE);
  return chain;
}

async function tryFetchJson(url: string): Promise<Record<string, string> | null> {
  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    return await resp.json();
  } catch {
    return null;
  }
}

export async function loadMessages(
  locale: string,
  namespaces: string[] = ['common', 'errors']
): Promise<Messages> {
  const localeChain = getLocaleChain(locale);
  const messages: Messages = {};

  for (const ns of namespaces) {
    let merged: Record<string, string> = {};
    // Load from least-specific to most-specific so more specific overrides
    for (const loc of [...localeChain].reverse()) {
      const content = await tryFetchJson(`/locales/${loc}/${ns}.json`);
      if (content) merged = { ...merged, ...content };
    }
    messages[ns] = merged;
  }
  return messages;
}
