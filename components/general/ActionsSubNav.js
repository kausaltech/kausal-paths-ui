import { ActionListLink } from 'common/links';
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
        <ActionListLink>
          <Button outline={active !== 'list'} tag="a">
            List
          </Button>
        </ActionListLink>
        <ActionListLink subPage='mac'>
          <Button outline={active !== 'mac'} tag="a">
            Cost effectiveness
          </Button>
        </ActionListLink>
      </ButtonGroup>
    </ActionViewsNav>
  )
};

export default ActionsSubNav;
