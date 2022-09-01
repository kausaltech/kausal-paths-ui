
import Link from 'next/link';
import styled, { useTheme } from 'styled-components';
import { ButtonGroup, Button } from 'reactstrap';
const ActionViewsNav = styled.div`
  float: right;
`;

const ActionsSubNav = (props) => {

  const { active } = props;

  return (
    <ActionViewsNav>
      <ButtonGroup
        className="my-2"
        size="sm"
      >
        <Link href={`/actions`}>
        <Button outline={active !== 'list'} tag="a">
          List
        </Button>
        </Link>
        <Link href={`/actions/mac`}>
        <Button outline={active !== 'mac'} tag="a">
          Cost effectiveness
        </Button>
        </Link>
      </ButtonGroup>
    </ActionViewsNav>
  )
};

export default ActionsSubNav;