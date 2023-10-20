'use client';

import {
  ApolloNextAppProvider,
  NextSSRApolloClient,
  NextSSRInMemoryCache,
} from '@apollo/experimental-nextjs-app-support/ssr';
import { ApolloClientOpts, createApolloLink } from 'common/apollo';
import possibleTypes from 'common/__generated__/possible_types.json';
import { PropsWithChildren } from 'react';

export function makeClient(opts: ApolloClientOpts) {
  return new NextSSRApolloClient({
    link: createApolloLink(opts),
    cache: new NextSSRInMemoryCache({
      possibleTypes: possibleTypes.possibleTypes,
    }),
  });
}

type OwnProps = PropsWithChildren & {
  opts: ApolloClientOpts;
};

export default function ApolloWrapper({ opts, children }: OwnProps) {
  return (
    <ApolloNextAppProvider makeClient={() => makeClient(opts)}>
      {children}
    </ApolloNextAppProvider>
  );
}
