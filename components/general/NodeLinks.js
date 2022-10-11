import Link from 'next/link';
import styled from 'styled-components';
import { useTranslation } from 'next-i18next';
import { Container, Row, Col, ListGroup, ListGroupItem } from 'reactstrap';
import { NodeLink } from 'common/urls';

const InputNodes = styled.div`
  margin-bottom: 4rem;
  padding: .5rem;
  border-radius:  ${(props) => props.theme.cardBorderRadius};
  font-size: 1rem;
  background-color: ${(props) => props.theme.graphColors.grey005};

  .list-group-item {
    display: flex;
    justify-content: space-between;
  }

  svg {
    margin-left: 1rem;
  }
`;

const OutputNodes = styled.div`
  margin-bottom: 4rem;
  text-align: right;
  padding: .5rem;
  border-radius:  ${(props) => props.theme.cardBorderRadius};
  font-size: 1rem;
  background-color: ${(props) => props.theme.graphColors.grey005};
  .list-group-item {
    display: flex;
    flex-direction: row-reverse;
    justify-content: space-between;
    text-align: right;
  }

  svg {
    margin-right: 1rem;
  }
`;

const NodeLinks = (props) => {
  const { inputNodes, outputNodes } = props;
  const { t } = useTranslation();
  return (
    <Container>
      <Row>
        <Col md={{ size: 5 }}>
          { inputNodes.length > 0 && (
          <InputNodes>
            <ListGroup>
              <ListGroupItem tag="h5">
                { t('affected-by') }
              </ListGroupItem>
              { inputNodes.map((inputNode, index) => (
                <NodeLink key={inputNode.id} node={inputNode}>
                  <ListGroupItem tag="a">
                    <span>{ inputNode.name }</span>
                  </ListGroupItem>
                </NodeLink>
              ))}
            </ListGroup>
          </InputNodes>
          )}
        </Col>
        <Col md={{ size: 5, offset: 2 }}>
          { outputNodes.length > 0 && (
          <OutputNodes>
            <ListGroup>
              <ListGroupItem tag="h5">
                { t('has-effect-on') }
              </ListGroupItem>
              { outputNodes.map((outputNode, index) => (
                <NodeLink key={outputNode.id} node={outputNode}>
                  <ListGroupItem tag="a">
                    <span>{ outputNode.name }</span>
                  </ListGroupItem>
                </NodeLink>
              ))}
            </ListGroup>
          </OutputNodes>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default NodeLinks;
