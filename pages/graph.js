import { gql, useQuery } from '@apollo/client';
import { Spinner } from 'reactstrap';
import CytoGraph from 'components/CytoGraph';

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

  if (error) {
    return <div>{`Error loading data: ${error}`}</div>;
  }
  if (loading) {
    return <Spinner style={{ width: '3rem', height: '3rem' }} />;
  }

  const { nodes } = data;
  return (
    <div>
      <CytoGraph nodes={nodes} />
    </div>
  );
}
