import { ApolloError } from "@apollo/client";

export function logError(error, context) {
  console.error(error.message);
  if (error instanceof ApolloError) {
    const { clientErrors, graphQLErrors, networkError } = error;
    if (clientErrors.length) {
      console.log('Client errors', clientErrors);
    }
    if (graphQLErrors.length) {
      console.log('GraphQL errors', graphQLErrors);
    }
    if (networkError) {
      const { message, result } = networkError;
      console.log(`Network error: ${message}`);
      console.log('Network result', result);
    }
    if (context?.query) {
      console.log('Query: ', context.query);
    }
  }
}
