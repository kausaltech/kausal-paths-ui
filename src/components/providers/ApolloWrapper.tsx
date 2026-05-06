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

/**
 * Preview-mode routing is disabled while the backend's
 * `_create_from_published_revision` hydrate bug is being fixed. Returning
 * `null` keeps the `preview` arg off the `@instance` directive so the
 * backend serves its publish-first default everywhere. Re-enable by
 * threading `editorPreviewModeVar` / the `?preview=` URL param back through
 * here once the backend hydrate no longer stomps snapshot specs with live
 * DB state.
 */
function detectPreviewMode() {
  return null;
}

export function ApolloWrapper({ locale, instanceIdentifier, instanceHostname, children }: Props) {
  const opts = {
    locale,
    instanceIdentifier,
    instanceHostname,
    previewMode: detectPreviewMode,
  };
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
