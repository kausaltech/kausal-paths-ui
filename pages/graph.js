import { gql, useQuery } from '@apollo/client';
import { Spinner } from 'reactstrap';
import CytoGraph from 'components/CytoGraph';
import GraphQLError from 'components/common/GraphQLError';

const GET_NODES = gql`
query GetNodes {
  nodes {
    id
    name
    color
    quantity
    isAction
    unit {
      htmlShort
    }
    inputNodes {
      id
    }
    outputNodes {
      id
    }
    metric {
      historicalValues(latest: 1) {
        year
        value
      }
    }
  }
}
`;

export default function Graph() {
  const { loading, error, data } = useQuery(GET_NODES);

  if (loading) {
    return <Spinner style={{ width: '3rem', height: '3rem' }} />;
  } if (error) {
    return <GraphQLError errors={error} />
  }

  const { nodes } = data;
  return (
    <div>
      <CytoGraph nodes={nodes} />
    </div>
  );
}
