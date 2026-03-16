'use server';

export type Messages = Record<string, Record<string, string>>;

const FALLBACK_LOCALE = 'en';

/** Build the locale fallback chain from most-specific to least-specific.
 *  e.g. 'de-CH' → ['de-CH', 'de', 'en']
 *       'fi'    → ['fi', 'en']
 *       'en'    → ['en']
 */
function getLocaleChain(locale: string): string[] {
  const chain: string[] = [locale];
  const hyphen = locale.indexOf('-');
  if (hyphen > 0) chain.push(locale.slice(0, hyphen)); // e.g. 'de'
  if (!chain.includes(FALLBACK_LOCALE)) chain.push(FALLBACK_LOCALE);
  return chain;
}

async function tryReadJson(filePath: string): Promise<Record<string, string> | null> {
  const fs = await import('node:fs');
  try {
    return JSON.parse(await fs.promises.readFile(filePath, 'utf-8')) as Record<string, string>;
  } catch {
    return null;
  }
}

export async function loadMessages(locale: string, namespaces: string[]): Promise<Messages> {
  const path = await import('path');
  const localeChain = getLocaleChain(locale);
  const messages: Messages = {};
  for (const ns of namespaces) {
    // Load from least-specific to most-specific and merge so that more
    // specific locales override less specific ones.
    let merged: Record<string, string> = {};
    for (const loc of [...localeChain].reverse()) {
      const filePath = path.join(process.cwd(), 'public', 'locales', loc, `${ns}.json`);
      const content = await tryReadJson(filePath);
      if (content) merged = { ...merged, ...content };
    }
    messages[ns] = merged;
  }
  return messages;
}
