'use client';

import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

import CytoGraph from '@/components/CytoGraph';
import ContentLoader from '@/components/common/ContentLoader';
import GraphQLError from '@/components/common/GraphQLError';

const GET_NODES = gql`
  query CytoscapeNodes {
    nodes {
      id
      name
      color
      quantity
      isVisible
      unit {
        id
        htmlShort
      }
      inputNodes {
        id
      }
      outputNodes {
        id
      }
      metric {
        id
        historicalValues(latest: 1) {
          year
          value
        }
      }
      ... on ActionNode {
        parentAction {
          id
        }
        subactions {
          id
        }
        group {
          id
          color
        }
      }
    }
  }
`;

export default function Graph() {
  const { loading, error, data } = useQuery(GET_NODES);

  if (loading || typeof window === 'undefined') {
    return <ContentLoader />;
  }
  if (error) {
    return <GraphQLError error={error} />;
  }

  const { nodes } = data;
  return (
    <div>
      <CytoGraph nodes={nodes} />
    </div>
  );
}
