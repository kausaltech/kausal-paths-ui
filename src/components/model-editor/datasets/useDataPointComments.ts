import { useCallback } from 'react';

import { useMutation } from '@apollo/client/react';

import type {
  CreateDataPointCommentMutation,
  CreateDataPointCommentMutationVariables,
  ResolveDataPointCommentMutation,
  ResolveDataPointCommentMutationVariables,
  UnresolveDataPointCommentMutation,
  UnresolveDataPointCommentMutationVariables,
} from '@/common/__generated__/graphql';
import { DataPointCommentReviewState } from '@/common/__generated__/graphql';
import {
  CREATE_DATA_POINT_COMMENT,
  DATA_POINT_COMMENT_FIELDS,
  RESOLVE_DATA_POINT_COMMENT,
  UNRESOLVE_DATA_POINT_COMMENT,
} from './queries';
import type { AddCommentInput } from './shared';

type Params = {
  instanceId: string;
  datasetId: string;
  /**
   * Refetch the InstanceDataset query. Each handler calls this afterwards
   * because the SSR-hydrated InstanceDataset observer doesn't re-render from a
   * passive cache broadcast in this runtime (only from its own fetch — same
   * reason the grid refetches after every edit).
   */
  onRefetch: () => Promise<unknown>;
};

export function useDataPointComments({ instanceId, datasetId, onRefetch }: Params) {
  const [createComment] = useMutation<
    CreateDataPointCommentMutation,
    CreateDataPointCommentMutationVariables
  >(CREATE_DATA_POINT_COMMENT);
  const [resolveComment] = useMutation<
    ResolveDataPointCommentMutation,
    ResolveDataPointCommentMutationVariables
  >(RESOLVE_DATA_POINT_COMMENT);
  const [unresolveComment] = useMutation<
    UnresolveDataPointCommentMutation,
    UnresolveDataPointCommentMutationVariables
  >(UNRESOLVE_DATA_POINT_COMMENT);

  const submitComment = useCallback(
    async (dataPointId: string, input: AddCommentInput) => {
      const result = await createComment({
        variables: {
          instanceId,
          datasetId,
          dataPointId,
          input: {
            text: input.text,
            isReview: input.isReview,
            isSticky: false,
            reviewState: input.isReview ? DataPointCommentReviewState.Unresolved : null,
          },
        },
        // Append the new comment to its DataPoint's `comments` field directly in
        // the normalised cache. Avoids refetching the whole InstanceDataset query
        // (~48s on slow connections).
        update: (cache, { data }) => {
          const payload = data?.instanceEditor.datasetEditor.createDataPointComment;
          if (payload?.__typename !== 'DataPointComment') return;
          const dpId = cache.identify({
            __typename: 'DataPoint',
            id: dataPointId,
          });
          if (!dpId) return;
          cache.modify({
            id: dpId,
            fields: {
              // writeFragment guarantees the comment entity is fully written (so
              // the InstanceDataset read stays complete and re-broadcasts) and
              // returns a ref we can append. The dedupe guard keeps a re-run from
              // inserting twice.
              comments: (existing: readonly { __ref: string }[] = [], { readField }) => {
                const ref = cache.writeFragment({
                  fragment: DATA_POINT_COMMENT_FIELDS,
                  fragmentName: 'DataPointCommentFields',
                  data: payload,
                });
                if (!ref) return existing;
                if (existing.some((e) => readField('id', e) === payload.id)) {
                  return existing;
                }
                return [...existing, ref];
              },
            },
          });
        },
      });
      const payload = result.data?.instanceEditor.datasetEditor.createDataPointComment;
      if (payload?.__typename === 'OperationInfo') {
        throw new Error(payload.messages.map((m) => m.message).join('; '));
      }
      // Refetch to make the new comment show in both the panel and the grid's
      // per-cell comment indicator without a manual reload (see onRefetch note).
      await onRefetch();
    },
    [createComment, instanceId, datasetId, onRefetch]
  );

  const setResolved = useCallback(
    async (commentId: string, resolved: boolean) => {
      const variables = { instanceId, datasetId, commentId };
      const payload = resolved
        ? (await resolveComment({ variables })).data?.instanceEditor.datasetEditor
            .resolveDataPointComment
        : (await unresolveComment({ variables })).data?.instanceEditor.datasetEditor
            .unresolveDataPointComment;
      if (payload?.__typename === 'OperationInfo') {
        throw new Error(payload.messages.map((m) => m.message).join('; '));
      }
      // Same reactivity caveat as comment creation: refetch so the
      // resolved/unresolved state (and the cell's needs-review tint) updates
      // without a manual reload.
      await onRefetch();
    },
    [resolveComment, unresolveComment, instanceId, datasetId, onRefetch]
  );

  return { submitComment, setResolved };
}
