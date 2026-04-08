import { type ReactNode, cache, use } from 'react';
import { headers } from 'next/headers';

import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';

import type { Metadata } from 'next';
import { NextIntlClientProvider, useMessages } from 'next-intl';

import { PATHS_INSTANCE_IDENTIFIER_HEADER } from '@common/constants/headers.mjs';
import { getAssetPrefix } from '@common/env';
import { getEnvScriptContents } from '@common/env/script-component';
import '@common/themes/styles/main.scss';
import { getThemeStaticURL } from '@common/themes/theme';
import { loadTheme } from '@common/themes/theme-init.server';
import { getRequestOrigin } from '@common/utils/request.server';

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

async function fetchInstanceContext(identifier: string, hostname: string, locale: string) {
  const client = await getClient();
  const { data } = await client.query<InstanceContextQuery, InstanceContextQueryVariables>({
    query: GET_INSTANCE_CONTEXT,
    variables: {
      identifier,
      hostname,
      locale,
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
  const {
    scenarios,
    parameters,
    menuPages,
    footerPages,
    additionalLinkPages,
    availableNormalizations,
  } = data;
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
    latestMetricYear: instance.maximumHistoricalYear ?? 2018,
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

type LayoutProps = {
  params: Promise<{ domain: string; lang: string }>;
  children: ReactNode;
};

const cachedFetchInstanceContext = cache(fetchInstanceContext);

async function instanceParamsFromRequest() {
  const requestHeaders = await headers();
  const identifier = requestHeaders.get(PATHS_INSTANCE_IDENTIFIER_HEADER);
  if (!identifier) {
    throw new Error('Instance identifier not found in request headers');
  }
  return {
    identifier,
    hostname: requestHeaders.get(INSTANCE_HOSTNAME_HEADER) ?? '',
    locale: requestHeaders.get(DEFAULT_LANGUAGE_HEADER) ?? 'en',
    origin: new URL(requestHeaders.get('x-url') ?? (await getRequestOrigin())),
  };
}

export async function generateMetadata(props: LayoutProps): Promise<Metadata> {
  const { domain, lang } = await props.params;
  const instanceParams = await instanceParamsFromRequest();
  const origin = instanceParams.origin; // The full user facing URL with path

  const resp = await cachedFetchInstanceContext(instanceParams.identifier, domain, lang);
  const data = resp!;
  const theme = await loadTheme(data.instance.themeIdentifier || 'default');

  return {
    robots: 'noindex',
    title: data.instance.name,
    description: data.instance.leadParagraph,
    openGraph: {
      title: data.instance.name,
      description: data.instance.leadParagraph ?? undefined,
    },
    metadataBase: new URL(origin),
    icons: {
      icon: [
        {
          type: 'image/svg+xml',
          url: getThemeStaticURL(theme?.favicons?.svg),
        },
        {
          type: 'image/x-icon',
          url: getThemeStaticURL(theme?.favicons?.ico),
        },
      ],
      apple: getThemeStaticURL(theme?.favicons?.apple),
    },
  };
}

export default function LangLayout(props: Props) {
  const params = use(props.params);
  const { children } = props;

  const messages = useMessages();
  const ctx = use(getContextFromHeaders());
  const instanceParams = use(instanceParamsFromRequest());

  // If no instance identifier, render a minimal layout (error will be shown downstream)
  if (!ctx.instanceIdentifier) {
    return (
      <html lang={params.lang}>
        <body>{children}</body>
      </html>
    );
  }
  const data = use(
    cachedFetchInstanceContext(instanceParams.identifier, params.domain, params.lang)
  );
  const { siteContext, instanceContext } = buildSiteContext(
    data!,
    ctx,
    params.lang,
    ctx.defaultLanguage,
    ctx.supportedLanguages
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
