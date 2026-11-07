'use client';

import { usePathname } from 'next/navigation';

import {
  ApolloClient,
  ApolloNextAppProvider,
  InMemoryCache,
} from '@apollo/client-integration-nextjs';

import { type PreviewMode, getApolloClientConfig } from '@/common/apollo-config';
import { editorPreviewModeVar } from '@/components/model-editor/queries';
import { recoverFromInvalidToken } from '@/lib/invalid-token-recovery';

type Props = {
  locale: string;
  instanceIdentifier: string;
  instanceHostname: string;
} & React.PropsWithChildren;

/** Matches a `/model` path segment (the model editor routes). */
const EDITOR_ROUTE_RE = /(^|\/)model(\/|$)/;

/**
 * Which slice (`preview` arg on the `@instance` directive) an operation
 * should run against. Invoked lazily per operation, so toggling the editor's
 * draft/published switch takes effect without recreating the Apollo client.
 *
 * Only editor routes get an explicit slice — the public UI must always see
 * the backend's publish-first default, so a slice selection can never leak
 * out of the editor.
 *
 * DRAFT is sent explicitly too. With no arg the backend serves the live
 * revision whenever one exists, so the editor of a published instance would
 * read frozen datasets (shown as protected) beside its draft node rows.
 *
 * The server-side render runs these queries as well, and the browser reuses
 * their streamed results, so the server must pick the same slice. It has no
 * `window`, so it reads the route from `serverPathname`; the toggle is
 * browser state and is always DRAFT on first render.
 */
function detectPreviewMode(serverPathname: string | null): PreviewMode | null {
  if (typeof window === 'undefined') {
    return serverPathname && EDITOR_ROUTE_RE.test(serverPathname) ? 'DRAFT' : null;
  }
  if (!EDITOR_ROUTE_RE.test(window.location.pathname)) return null;
  return editorPreviewModeVar();
}

export function ApolloWrapper({ locale, instanceIdentifier, instanceHostname, children }: Props) {
  const pathname = usePathname();
  const opts = {
    locale,
    instanceIdentifier,
    instanceHostname,
    previewMode: () => detectPreviewMode(pathname),
    onInvalidToken: recoverFromInvalidToken,
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
