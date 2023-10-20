import 'server-only';
import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';
import getConfig from 'next/config';
import {
  GetInstanceContextQuery,
  GetInstanceContextQueryVariables,
} from 'common/__generated__/graphql';
import GET_INSTANCE_CONTEXT from 'queries/instance';
import { PropsWithChildren } from 'react';
import { registerApolloClient } from '@apollo/experimental-nextjs-app-support/rsc';
import type { ApolloClientOpts } from 'common/apollo';
import { createApolloLink } from 'common/apollo';
import { headers } from 'next/headers';
import { SiteContextProvider, SiteContextType } from './site';

function getApolloOpts() {
  const { publicRuntimeConfig } = getConfig();
  const hdr = headers();
  const opts: ApolloClientOpts = {
    apiUri: publicRuntimeConfig.graphqlUrl,
    instanceIdentifier: hdr.get('x-instance-identifier')!,
    instanceHostname: hdr.get('host')!.split(':')[0],
  };
  console.log(opts);
  return opts;
}

export const { getClient } = registerApolloClient(() => {
  const opts = getApolloOpts();
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: createApolloLink(opts),
  });
});

export default async function SiteContextLoader({
  children,
}: PropsWithChildren) {
  const client = getClient();
  let data: GetInstanceContextQuery;
  try {
    const ret = await client.query<
      GetInstanceContextQuery,
      GetInstanceContextQueryVariables
    >({
      query: GET_INSTANCE_CONTEXT,
      context: {
        locale: 'de-CH', // FIXME
      },
    });
    console.log(ret);
    data = ret.data;
  } catch (err) {
    console.log(err);
    throw err;
  }
  const opts = getApolloOpts();
  const { scenarios } = data;
  const instance = data.instance!;
  const basePath = '';
  const { publicRuntimeConfig } = getConfig();
  const siteContext: SiteContextType = {
    scenarios: data.scenarios,
    parameters: data.parameters,
    menuPages: data.menuPages,
    title: instance.name!,
    apolloConfig: {
      instanceHostname: opts.instanceHostname,
      instanceIdentifier: opts.instanceIdentifier,
    },
    availableNormalizations: data.availableNormalizations,
    referenceYear: instance.referenceYear ?? null,
    minYear: instance.minimumHistoricalYear,
    maxYear: instance.modelEndYear,
    targetYear: instance.targetYear ?? instance.modelEndYear,
    latestMetricYear: instance.maximumHistoricalYear || 2018,
    baselineName: scenarios.find((scenario) => scenario.id === 'baseline')
      ?.name,
    iconBase: `${basePath}/static/themes/default/images/favicon`,
    ogImage: `${basePath}/static/themes/default/images/og-image-default.png`,
    deploymentType: publicRuntimeConfig.deploymentType,
  };
  return (
    <SiteContextProvider value={siteContext}>{children}</SiteContextProvider>
  );
}
