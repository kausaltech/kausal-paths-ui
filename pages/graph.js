import { gql, useQuery } from "@apollo/client";
import { Spinner } from 'reactstrap';
import styled from 'styled-components';
import CytoGraph from 'components/CytoGraph';

const GET_NODES = gql`
query GetNodes {
  nodes {
    id
    name
    color
    inputNodes {
      id
    }
    outputNodes {
      id
    }
  }
}
`;

const VisContainer = styled.div`
  width: 100%;
  height: 800px;
  background-color: #f6f6f6;
  margin: 2em 0;
`;

export default function Graph() {
  const { loading, error, data } = useQuery(GET_NODES);

  if (loading) {
    return <Spinner style={{ width: '3rem', height: '3rem' }} />
  }
  if (error) {
    return <div>{error}</div>
  }

  const { nodes } = data;
  return (
    <div>
      <CytoGraph nodes={nodes}/>
    </div>
  );
}
