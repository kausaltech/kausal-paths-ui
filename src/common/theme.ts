import type { Theme } from '@kausal/themes/types';

import { formatStaticUrl } from '@/common/links';
import { getLogger } from '@/common/log';

declare module 'styled-components' {
  export interface DefaultTheme extends Theme {}
}

const logger = getLogger('theme');

export async function loadTheme(themeIdentifier: string): Promise<Theme> {
  let themeProps: Theme;
  let readThemeFile: (id: string) => Promise<Theme>;
  if (!process.browser) {
    const fs = await import('node:fs');
    const THEME_PATH = './public/static/themes';
    readThemeFile = async (id: string) => {
      const theme = fs.readFileSync(`${THEME_PATH}/${id}/theme.json`, {
        encoding: 'utf8',
      });
      return JSON.parse(theme) as Theme;
    };
  } else {
    const THEME_PATH = '/public/static/themes';
    readThemeFile = async (id: string) => {
      const theme = await import(`${THEME_PATH}/${id}/theme.json`);
      return theme.default;
    };
  }
  try {
    themeProps = await readThemeFile(themeIdentifier);
    return themeProps;
  } catch (error) {
    logger.error(error, `Theme with identifier ${themeIdentifier} not found`);
    themeProps = await readThemeFile('default');
    return themeProps;
  }
}

export function getThemeStaticURL(path: string) {
  return formatStaticUrl(`/static/themes/${path}`);
}
