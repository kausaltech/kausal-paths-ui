import {
  Card, CardImg, CardText, CardBody,
  CardTitle, CardSubtitle, Button
} from 'reactstrap';
import styled from 'styled-components';

const CardWithState = styled(Card)`

  &.inactive {
    background-color: #ccc;
  }
`;

const DashCard = (props) => {
  const { children, state } = props;
  return (
    <CardWithState className={`mb-4 ${state}`}>
      <CardBody>
        { children }
      </CardBody>
    </CardWithState>
  );
};

export default DashCard;
