import { type ReactNode } from 'react';

import { transparentize } from 'polished';

import styled from '@common/themes/styled';

import { Link } from '@/common/links';
import {
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  UncontrolledDropdown,
} from '@/components/common/Dropdowns';

// Styles follow the Watch UI nav dropdown, using the same theme colors as
// GlobalNav so the dropdown matches the surrounding navbar items.

const NavHighlighter = styled.span`
  height: 100%;
  display: inline-block;
  padding: ${(props) => props.theme.spaces.s050} 0 calc(${(props) => props.theme.spaces.s050} - 5px);
  border-bottom: 5px solid transparent;
  transition: border 200ms;

  &.active {
    border-bottom: 5px solid ${(props) => props.theme.brandDark};
  }

  @media (min-width: ${(props) => props.theme.breakpoints.values.md}px) {
    padding: ${(props) => props.theme.spaces.s150} 0
      calc(${(props) => props.theme.spaces.s150} - 5px);
  }
`;

const StyledDropdownToggle = styled(DropdownToggle)`
  height: 100%;
  display: flex;
  padding: 0;
  margin: 0 0 ${(props) => props.theme.spaces.s100} ${(props) => props.theme.spaces.s100};
  color: ${(props) => props.theme.neutralDark};

  &:hover {
    text-decoration: none;
    color: ${(props) => props.theme.neutralDark};

    .highlighter {
      border-bottom: 5px solid ${(props) => props.theme.brandDark};
    }
  }

  @media (min-width: ${(props) => props.theme.breakpoints.values.md}px) {
    align-self: flex-end;
    margin: 0 ${(props) => props.theme.spaces.s200} 0 0;
  }
`;

const StyledDropdown = styled(UncontrolledDropdown)`
  position: static;

  .dropdown-toggle.nav-link {
    color: ${(props) => props.theme.neutralDark};
    padding-left: 0;
    padding-right: 0;
    white-space: normal;

    &::after {
      align-self: center;
      margin-top: 0;
    }
  }

  &.show {
    .dropdown-toggle.nav-link {
      color: ${(props) => props.theme.neutralDark};

      &::after {
        border-top-color: ${(props) => props.theme.brandDark};
      }
    }
  }

  .dropdown-menu {
    background-color: ${(props) => props.theme.themeColors.white};
    border: 0px;
    padding-top: ${(props) => props.theme.spaces.s150};
    box-shadow: none;
  }

  /* The link itself is the menu item, so it stays keyboard-activatable */
  .dropdown-item {
    display: flex;
    margin: 0 0 ${(props) => props.theme.spaces.s050}
      calc(${(props) => props.theme.spaces.s150} + ${(props) => props.theme.spaces.s100});
    color: ${(props) => props.theme.neutralDark};
    white-space: normal;

    .highlighter {
      display: inline-block;
      padding: 0 0 calc(${(props) => props.theme.spaces.s050} - 5px);
      line-height: 1;
    }

    &:hover,
    &:focus {
      background-color: transparent;
      color: ${(props) => props.theme.neutralDark};
      text-decoration: none;

      .highlighter {
        border-bottom: 5px solid ${(props) => props.theme.brandDark};
      }
    }
  }

  @media (min-width: ${(props) => props.theme.breakpoints.values.md}px) {
    /* GlobalNav makes nav items flex rows; the absolutely positioned menu needs a
       block parent to open below the toggle instead of on top of it. */
    &.dropdown.nav-item {
      display: block;
    }

    .dropdown-menu {
      box-shadow: 3px 3px 6px 2px ${(props) => transparentize(0.85, props.theme.themeColors.black)};
    }

    .dropdown-item {
      margin: 0;
      padding-right: calc(
        var(--bs-dropdown-item-padding-x) + ${(props) => props.theme.spaces.s200}
      );
    }
  }
`;

const DropdownMenuWrapper = styled.div`
  position: static;

  @media (min-width: ${(props) => props.theme.breakpoints.values.md}px) {
    position: absolute;
  }
`;

const StyledDropdownMenu = styled(DropdownMenu)`
  min-width: 0;
  width: 100%;

  &.dropdown-menu {
    position: static;
    transform: none !important;
  }

  &.dropdown-menu[data-bs-popper] {
    top: unset;
  }

  .dropdown-item {
    width: auto;
  }

  @media (min-width: ${(props) => props.theme.breakpoints.values.md}px) {
    min-width: 260px;
    width: auto;

    &.dropdown-menu {
      position: absolute;
    }

    .dropdown-item {
      width: 100%;
    }
  }
`;

export type NavDropdownListItem = {
  id: string;
  urlPath: string;
  name: string;
};

export type NavDropdownProps = {
  items: NavDropdownListItem[];
  active?: boolean;
  children: ReactNode;
  className?: string;
};

function NavDropdown(props: NavDropdownProps) {
  const { items, active, children } = props;
  return (
    <StyledDropdown nav inNavbar className={active ? 'active' : undefined}>
      <StyledDropdownToggle nav caret>
        <NavHighlighter className={`highlighter ${active && 'active'}`}>{children}</NavHighlighter>
      </StyledDropdownToggle>
      <DropdownMenuWrapper>
        <StyledDropdownMenu>
          {items &&
            items.map((child) => (
              <DropdownItem key={child.id} tag={Link} href={child.urlPath}>
                <NavHighlighter className="highlighter">{child.name}</NavHighlighter>
              </DropdownItem>
            ))}
        </StyledDropdownMenu>
      </DropdownMenuWrapper>
    </StyledDropdown>
  );
}

export default NavDropdown;
