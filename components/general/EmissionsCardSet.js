import DashCard from 'components/general/DashCard';
import { Spinner, Container, Row, Col } from 'reactstrap';
import styled from 'styled-components';
import EmissionsCard from './EmissionsCard';

const EmissionsCardSet = (props) => {
  const { sectors, rootSector, unit, date  } = props;

  //            sectors={data.page.emissionSectors}
  //rootSector={rootSector.id}
  //unit={unit}
  //date={activeYear}

  const cardSectors = sectors.filter((sector) => sector.parent?.id === rootSector);

  return (
    <div>
      <Row>
        { cardSectors.map((sector, indx) => (
          <Col key={sector.id} sm="3">
            <EmissionsCard
              date={date}
              unit={unit}
              sector={sector}
              subSectors={sectors.filter((sector) => sector.parent?.id === sector.id)}
              state="inactive"
            />
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default EmissionsCardSet;
