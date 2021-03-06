import Link from 'next/link';
import styled from 'styled-components';
import { useTranslation } from 'next-i18next';
import { Container, Row, Col, ListGroup, ListGroupItem } from 'reactstrap';

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
                <Link key={inputNode.id} href={`/node/${inputNode.id}`}>
                  <ListGroupItem tag="a" href=''>
                    <span>{ inputNode.name }</span>
                  </ListGroupItem>
                </Link>
              ))}
            </ListGroup>
          </InputNodes>
          )}
        </Col>
        <Col md={{ size: 5, offset: 2 }}>
          { outputNodes.length > 0 && (
          <OutputNodes>
            <ListGroupItem tag="h5">
              { t('has-effect-on') }
            </ListGroupItem>
            <ListGroup>
              { outputNodes.map((outputNode, index) => (
                <Link key={outputNode.id} href={`/node/${outputNode.id}`}>
                  <ListGroupItem tag="a" href=''>
                    <span>{ outputNode.name }</span>
                  </ListGroupItem>
                </Link>
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
