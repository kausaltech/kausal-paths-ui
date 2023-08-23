import styled from 'styled-components';
import { ArrowUp } from 'react-bootstrap-icons';

import { NodeLink } from 'common/links';
import DashCard from 'components/general/DashCard';

const InputNodesWrapper = styled.div`
  padding: 0.5rem;
  margin: 0 0.5rem 0.5rem;
  display: flex;
  justify-content: center;
  background-color: ${(props) => props.theme.graphColors.grey010};
`;

const NodeItem = styled.div`
  position: relative;
  padding: 0.5rem;
`;

const EffectIcon = styled.div`
  position: absolute;
  z-index: 44;
  left: 50%;
  top: -1.5rem;
`;

const InputNodeCards = (props) => {
  const { nodes } = props;

  return (
    <InputNodesWrapper>
      {nodes.map((input) => (
        <NodeItem key={input.id}>
          <EffectIcon>
            <ArrowUp size={32} />
          </EffectIcon>
          <DashCard>
            <NodeLink node={input}>
              <a>
                <h5>{input.name}</h5>
              </a>
            </NodeLink>
          </DashCard>
        </NodeItem>
      ))}
    </InputNodesWrapper>
  );
};

export default InputNodeCards;
