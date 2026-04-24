import { useState } from 'react';

import { INSTANCE_IDENTIFIER, createApolloClient } from '#/apollo';
import { loadMessages } from '#/i18n';
import { getThemeCssUrl, initializeMuiTheme, loadTheme } from '#/theme';
import { ApolloProvider, useQuery } from '@apollo/client/react';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { Outlet, createRootRoute } from '@tanstack/react-router';
import { IntlProvider } from 'use-intl';

import ThemedGlobalStyles from '@common/themes/ThemedGlobalStyles';

import type { InstanceContextQuery } from '@/common/__generated__/graphql';
import { activeGoalVar, activeScenarioVar, yearRangeVar } from '@/common/cache';
import InstanceContext from '@/common/instance';
import { createNumbersContext } from '@/context/numbers';
import LocalizedNumbersContext from '@/context/numbers';
import SiteContext, { type SiteContextType } from '@/context/site';
import GET_INSTANCE_CONTEXT from '@/queries/instance';

const apolloClient = createApolloClient();

export const Route = createRootRoute({
  loader: async () => {
    console.log('root route loader running');
    const [theme, messages] = await Promise.all([loadTheme('default'), loadMessages('en')]);
    return { theme, messages };
  },
  component: RootComponent,
});

function RootComponent() {
  const { theme, messages } = Route.useLoaderData();
  const muiTheme = initializeMuiTheme(theme);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  console.log('RootComponent rendering');

  return (
    <IntlProvider locale="en" messages={messages} timeZone={timeZone}>
      <ApolloProvider client={apolloClient}>
        <ThemeProvider theme={muiTheme}>
          <CssBaseline />
          <ThemedGlobalStyles />
          <link rel="stylesheet" href={getThemeCssUrl(theme)} />
          <InstanceLoader />
        </ThemeProvider>
      </ApolloProvider>
    </IntlProvider>
  );
}

/**
 * Loads the instance context via Apollo and provides SiteContext,
 * InstanceContext, and LocalizedNumbersContext to children.
 */
function InstanceLoader() {
  const { data, loading, error } = useQuery<InstanceContextQuery>(GET_INSTANCE_CONTEXT);

  if (loading) return <div style={{ padding: 32 }}>Loading...</div>;
  if (error) return <div style={{ padding: 32, color: 'red' }}>Error: {error.message}</div>;
  if (!data) return null;

  console.log('InstanceLoader rendering');
  return <InstanceProviders data={data} />;
}

function InstanceProviders({ data }: { data: InstanceContextQuery }) {
  const { instance, scenarios } = data;
  const locale = instance.defaultLanguage;

  const siteContext: SiteContextType = {
    scenarios,
    parameters: data.parameters,
    menuPages: data.menuPages,
    footerPages: data.footerPages,
    additionalLinkPages: data.additionalLinkPages,
    title: instance.name,
    owner: instance.owner!,
    apolloConfig: {
      instanceHostname: '',
      instanceIdentifier: INSTANCE_IDENTIFIER,
    },
    availableNormalizations: data.availableNormalizations,
    referenceYear: instance.referenceYear ?? null,
    minYear: instance.minimumHistoricalYear,
    maxYear: instance.modelEndYear,
    targetYear: instance.targetYear ?? instance.modelEndYear,
    latestMetricYear: instance.maximumHistoricalYear || 2018,
    baselineName: scenarios.find((s) => s.id === 'baseline')?.name,
    iconBase: '/static/themes/default/images/favicon',
    ogImage: '/static/themes/default/images/og-image-default.png',
    i18n: {
      locale,
      defaultLocale: locale,
      supportedLocales: instance.supportedLanguages,
    },
    basePath: '',
    assetPrefix: '',
  };

  const [site, setSite] = useState<SiteContextType>(siteContext);

  const numbersContext = createNumbersContext(
    locale,
    instance.features.showSignificantDigits ?? undefined
  );

  // Initialize Apollo reactive vars
  const activeScenario = scenarios.find((sc) => sc.isActive);
  if (!activeGoalVar()) {
    const goals = instance.goals;
    const defaultGoal = goals.length > 1 ? goals.find((g) => g.default) : goals[0];
    activeGoalVar(defaultGoal ?? null);
  }
  if (!activeScenarioVar() && activeScenario) {
    activeScenarioVar({ ...activeScenario, isUserSelected: true });
  }
  if (!yearRangeVar()) {
    yearRangeVar([
      instance.minimumHistoricalYear ?? siteContext.referenceYear ?? 2010,
      siteContext.targetYear,
    ]);
  }

  return (
    <SiteContext.Provider value={[site, setSite]}>
      <InstanceContext.Provider value={instance}>
        <LocalizedNumbersContext.Provider value={numbersContext}>
          <Outlet />
        </LocalizedNumbersContext.Provider>
      </InstanceContext.Provider>
    </SiteContext.Provider>
  );
}
