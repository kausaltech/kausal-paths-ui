'use client';

import {
  ApolloClient,
  ApolloNextAppProvider,
  InMemoryCache,
} from '@apollo/client-integration-nextjs';

import { getApolloClientConfig } from '@/common/apollo-config';
import { editorPreviewModeVar } from '@/components/model-editor/queries';

type Props = {
  locale: string;
  instanceIdentifier: string;
  instanceHostname: string;
} & React.PropsWithChildren;

/**
 * Editor routes must opt into a slice explicitly — after the backend's
 * Phase-4 resolver split, the default resolves against the latest published
 * revision. `editorPreviewModeVar` is the user-facing toggle (DRAFT by
 * default); on non-editor routes we return null so the backend uses its
 * published-first default.
 *
 * Keyed on `window.location.pathname` so client-side navigation between
 * editor and public pages switches mode without recreating Apollo.
 */
function detectPreviewMode() {
  if (typeof window === 'undefined') return null;
  if (!window.location.pathname.includes('/model-editor')) return null;
  return editorPreviewModeVar();
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
