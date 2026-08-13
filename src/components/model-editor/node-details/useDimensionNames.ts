import { useMemo } from 'react';

import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

const GET_EDITOR_DIMENSION_NAMES = gql`
  query EditorDimensionNames {
    instance {
      id
      editor {
        dimensions {
          id
          name
        }
      }
    }
  }
`;

type EditorDimensionNamesQuery = {
  instance: {
    id: string;
    editor: { dimensions: { id: string; name: string }[] } | null;
  };
};

/**
 * uuid → display name for the model's dimensions, for rendering the solver's
 * `effectiveShape` dimension references. Unresolvable uuids (shouldn't
 * happen) fall back to the raw uuid so the row stays truthful.
 */
export function useDimensionNames(): Map<string, string> {
  const { data } = useQuery<EditorDimensionNamesQuery>(GET_EDITOR_DIMENSION_NAMES, {
    fetchPolicy: 'cache-first',
  });
  return useMemo(
    () => new Map((data?.instance.editor?.dimensions ?? []).map((d) => [d.id, d.name])),
    [data]
  );
}
