import { useEffect } from 'react';

import { useQuery } from '@apollo/client/react';

import type {
  EditorPublishStateQuery,
  EditorPublishStateQueryVariables,
} from '@/common/__generated__/graphql';
import { GET_INSTANCE_EDITOR_PUBLISH_STATE, draftHeadTokenVar } from './queries';

/**
 * Subscribes to `EditorPublishState` and seeds `draftHeadTokenVar` whenever
 * the query returns a fresh value. Mount in any editor screen that issues
 * mutations so the optimistic-locking token stays current.
 *
 * Mutations should include `refetchQueries: ['EditorPublishState']` so this
 * hook picks up the new head after a successful write.
 */
export function useEditorPublishState(): EditorPublishStateQuery['instance']['editor'] | null {
  const { data } = useQuery<EditorPublishStateQuery, EditorPublishStateQueryVariables>(
    GET_INSTANCE_EDITOR_PUBLISH_STATE,
    { fetchPolicy: 'cache-and-network' }
  );

  const token = data?.instance.editor?.draftHeadToken ?? null;
  useEffect(() => {
    draftHeadTokenVar(token);
  }, [token]);

  return data?.instance.editor ?? null;
}
