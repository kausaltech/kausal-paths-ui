import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from '@apollo/client';

import possibleTypes from '@/common/__generated__/possible_types.json';

const GRAPHQL_URL =
  import.meta.env.VITE_PATHS_GRAPHQL_URL || 'https://api.paths.kausal.dev/v1/graphql/';
export const INSTANCE_IDENTIFIER = import.meta.env.VITE_PATHS_INSTANCE_IDENTIFIER || 'sunnydale';

function createInstanceMiddleware(instanceIdentifier: string) {
  return new ApolloLink((operation, forward) => {
    operation.setContext(({ headers = {} }: { headers: Record<string, string> }) => ({
      headers: {
        ...headers,
        'x-paths-instance-identifier': instanceIdentifier,
      },
    }));
    return forward(operation);
  });
}

export function createApolloClient(instanceIdentifier = INSTANCE_IDENTIFIER) {
  const httpLink = new HttpLink({
    uri: GRAPHQL_URL,
  });
  return new ApolloClient({
    link: ApolloLink.from([createInstanceMiddleware(instanceIdentifier), httpLink]),
    cache: new InMemoryCache({
      possibleTypes: possibleTypes.possibleTypes,
    }),
  });
}
