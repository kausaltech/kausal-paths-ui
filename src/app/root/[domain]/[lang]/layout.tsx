import { use, type ReactNode } from 'react';

import { headers } from 'next/headers';

import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import type { Metadata } from 'next';
import { NextIntlClientProvider, useMessages } from 'next-intl';

import { getEnvScriptContents } from '@common/env/script-component';
import { getAssetPrefix } from '@common/env';
import { getThemeStaticURL } from '@common/themes/theme';
import { loadTheme } from '@common/themes/theme-init.server';
import '@common/themes/styles/main.scss';

import type {
  InstanceContextQuery,
  InstanceContextQueryVariables,
} from '@/common/__generated__/graphql';
import {
  BASE_PATH_HEADER,
  DEFAULT_LANGUAGE_HEADER,
  INSTANCE_HOSTNAME_HEADER,
  INSTANCE_IDENTIFIER_HEADER,
  SUPPORTED_LANGUAGES_HEADER,
  THEME_IDENTIFIER_HEADER,
} from '@/common/const';
import { ApolloWrapper } from '@/components/providers/ApolloWrapper';
import { InstanceProviders } from '@/components/providers/InstanceProviders';
import { getInstanceConfig } from '@/config/instances';
import GET_INSTANCE_CONTEXT from '@/queries/instance';
import { getClient } from '@/utils/apollo-rsc-client';

type Props = {
  params: Promise<{ domain: string; lang: string }>;
  children: ReactNode;
};

async function getContextFromHeaders() {
  const headersList = await headers();
  return {
    instanceIdentifier: headersList.get(INSTANCE_IDENTIFIER_HEADER) ?? undefined,
    instanceHostname: headersList.get(INSTANCE_HOSTNAME_HEADER) ?? '',
    themeIdentifier: headersList.get(THEME_IDENTIFIER_HEADER) ?? 'default',
    defaultLanguage: headersList.get(DEFAULT_LANGUAGE_HEADER) ?? 'en',
    supportedLanguages: (headersList.get(SUPPORTED_LANGUAGES_HEADER) ?? 'en').split(','),
    basePath: headersList.get(BASE_PATH_HEADER) ?? '',
  };
}

async function fetchInstanceContext(locale: string) {
  const client = await getClient();
  const { data } = await client.query<InstanceContextQuery, InstanceContextQueryVariables>({
    query: GET_INSTANCE_CONTEXT,
    context: {
      locale,
      'component-name': 'RootLayout.fetchInstanceContext',
    },
  });
  return data;
}

function buildSiteContext(
  data: InstanceContextQuery,
  ctx: Awaited<ReturnType<typeof getContextFromHeaders>>,
  locale: string,
  defaultLanguage: string,
  supportedLanguages: string[]
) {
  const { scenarios, parameters, menuPages, footerPages, additionalLinkPages, availableNormalizations } = data;
  const instance = data.instance;
  const assetPrefix = getAssetPrefix();

  const siteContext = {
    scenarios,
    parameters,
    menuPages,
    footerPages,
    additionalLinkPages,
    title: instance.name,
    owner: instance.owner!,
    apolloConfig: {
      instanceHostname: ctx.instanceHostname,
      instanceIdentifier: ctx.instanceIdentifier!,
    },
    availableNormalizations,
    referenceYear: instance.referenceYear ?? null,
    minYear: instance.minimumHistoricalYear,
    maxYear: instance.modelEndYear,
    targetYear: instance.targetYear ?? instance.modelEndYear,
    latestMetricYear: instance.maximumHistoricalYear || 2018,
    baselineName: scenarios.find((scenario: { id: string }) => scenario.id === 'baseline')?.name,
    iconBase: `${assetPrefix}/static/themes/default/images/favicon`,
    ogImage: `${assetPrefix}/static/themes/default/images/og-image-default.png`,
    i18n: {
      locale,
      defaultLocale: defaultLanguage,
      supportedLocales: supportedLanguages,
    },
    basePath: ctx.basePath,
    assetPrefix,
    // Merge instance-specific config (watchLinks, demoPages, etc.)
    ...getInstanceConfig(instance.id),
  };

  return { siteContext, instanceContext: instance };
}

export const metadata: Metadata = {
  robots: 'noindex',
};

export default function LangLayout(props: Props) {
  const params = use(props.params);
  const { children } = props;

  const messages = useMessages();
  const ctx = use(getContextFromHeaders());

  // If no instance identifier, render a minimal layout (error will be shown downstream)
  if (!ctx.instanceIdentifier) {
    return (
      <html lang={params.lang}>
        <body>{children}</body>
      </html>
    );
  }

  const data = use(fetchInstanceContext(params.lang));
  const { siteContext, instanceContext } = buildSiteContext(
    data, ctx, params.lang, ctx.defaultLanguage, ctx.supportedLanguages
  );

  const themeProps = use(loadTheme(ctx.themeIdentifier));
  const timeZone = 'UTC'; // Will be overridden client-side

  return (
    <html lang={params.lang}>
      <head>
        <link
          id="theme-stylesheet"
          rel="stylesheet"
          type="text/css"
          href={getThemeStaticURL(themeProps.mainCssFile)}
        />
        <script
          id="public-runtime-env"
          dangerouslySetInnerHTML={{ __html: getEnvScriptContents() }}
        />
      </head>
      <body>
        <NextIntlClientProvider locale={params.lang} messages={messages} timeZone={timeZone}>
          <AppRouterCacheProvider options={{ enableCssLayer: true }}>
            <ApolloWrapper
              initialLocale={params.lang}
              instanceIdentifier={ctx.instanceIdentifier}
              instanceHostname={ctx.instanceHostname}
            >
              <InstanceProviders
                siteContext={siteContext}
                instanceContext={instanceContext}
                themeProps={themeProps}
              >
                {children}
              </InstanceProviders>
            </ApolloWrapper>
          </AppRouterCacheProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
