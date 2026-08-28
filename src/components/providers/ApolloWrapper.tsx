'use client';

import {
  ApolloClient,
  ApolloNextAppProvider,
  InMemoryCache,
} from '@apollo/client-integration-nextjs';

import { getApolloClientConfig } from '@/common/apollo-config';
import { editorPreviewModeVar } from '@/components/model-editor/queries';
import { recoverFromInvalidToken } from '@/lib/invalid-token-recovery';

type Props = {
  locale: string;
  instanceIdentifier: string;
  instanceHostname: string;
  /** Base path the instance is served under (e.g. `/modeling`), or `''` at the host root. */
  basePath: string;
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
 * DRAFT deliberately sends no arg: the backend's default path IS the
 * editable working copy for editor operations (mutations force DRAFT
 * server-side). Explicitly requesting the DRAFT slice makes the backend
 * re-hydrate the draft per request, minting a fresh head token that breaks
 * optimistic locking — every mutation would be rejected as stale.
 */
function detectPreviewMode() {
  if (typeof window === 'undefined') return null;
  if (!EDITOR_ROUTE_RE.test(window.location.pathname)) return null;
  return editorPreviewModeVar() === 'PUBLISHED' ? 'PUBLISHED' : null;
}

export function ApolloWrapper({
  locale,
  instanceIdentifier,
  instanceHostname,
  basePath,
  children,
}: Props) {
  const opts = {
    locale,
    instanceIdentifier,
    instanceHostname,
    basePath,
    previewMode: detectPreviewMode,
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
