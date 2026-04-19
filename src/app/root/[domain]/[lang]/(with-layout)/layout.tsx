import type { ReactNode } from 'react';
import { headers } from 'next/headers';

import '@common/themes/styles/main.scss';
import { getThemeStaticURL } from '@common/themes/theme';
import { loadTheme } from '@common/themes/theme-init.server';

import { THEME_IDENTIFIER_HEADER } from '@/common/const';
import Layout from '@/components/Layout';
import PublicEditorBar from '@/components/common/PublicEditorBar';
import { InstanceGlobalStyles } from '@/components/providers/InstanceThemedStyles';

type Props = {
  children: ReactNode;
};

export default async function WithLayoutLayout({ children }: Props) {
  const headersList = await headers();
  const themeIdentifier = headersList.get(THEME_IDENTIFIER_HEADER) ?? 'default';
  const themeProps = await loadTheme(themeIdentifier);

  return (
    <>
      <link
        id="theme-stylesheet"
        rel="stylesheet"
        type="text/css"
        href={getThemeStaticURL(themeProps.mainCssFile)}
      />
      <InstanceGlobalStyles />
      <PublicEditorBar />
      <Layout>{children}</Layout>
    </>
  );
}
