import DashCard from 'components/general/DashCard';
import { Spinner, Container, Row, Col } from 'reactstrap';
import styled from 'styled-components';
import EmissionsCard from './EmissionsCard';

const EmissionsCardSet = (props) => {
  const { cards } = props;
  const goal = 2030;

  return (
    <div>
      <Row>
        { cards.map((card, indx) => (
          <Col key={card.id} sm="3">
            <EmissionsCard
              date={goal}
              unit="kt CO₂e"
              card={card}
              state="active"
            />
          </Col>
        ))}
        { cards.map((card, indx) => (
          <Col key={card.id} sm="3">
            <EmissionsCard
              date={goal}
              unit="kt CO₂e"
              card={card}
            />
          </Col>
        ))}
        { cards.map((card, indx) => (
          <Col key={card.id} sm="3">
            <EmissionsCard
              date={goal}
              unit="kt CO₂e"
              card={card}
            />
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default EmissionsCardSet;
