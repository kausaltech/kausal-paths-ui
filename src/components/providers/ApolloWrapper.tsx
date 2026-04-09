'use client';

import {
  ApolloClient,
  ApolloNextAppProvider,
  InMemoryCache,
} from '@apollo/client-integration-nextjs';

import { getApolloClientConfig } from '@/common/apollo-config';

type Props = {
  locale: string;
  instanceIdentifier: string;
  instanceHostname: string;
} & React.PropsWithChildren;

export function ApolloWrapper({ locale, instanceIdentifier, instanceHostname, children }: Props) {
  const opts = { locale, instanceIdentifier, instanceHostname };
  const clientConfig = getApolloClientConfig(opts);
  return (
    <ApolloNextAppProvider
      makeClient={() =>
        new ApolloClient({
          link: clientConfig.link,
          cache: new InMemoryCache(clientConfig.cache),
        })
      }
    >
      {children}
    </ApolloNextAppProvider>
  );
}
