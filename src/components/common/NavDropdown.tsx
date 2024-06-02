import React, { type ReactNode } from 'react';
import Link from 'next/link';

import { transparentize } from 'polished';
import { DropdownItem, DropdownMenu, DropdownToggle, UncontrolledDropdown } from 'reactstrap';
import styled from 'styled-components';

const NavLink = styled.div`
  a {
    display: block;
    margin: 0 0 ${(props) => props.theme.spaces.s050} ${(props) => props.theme.spaces.s100};
    color: ${(props) => props.theme.neutralDark};

    &:hover {
      text-decoration: none;
      color: ${(props) => props.theme.neutralDark};

      .highlighter {
        border-bottom: 5px solid ${(props) => props.theme.brandNavBackground};
      }
    }

    @media (min-width: ${(props) => props.theme.breakpointMd}) {
      align-self: flex-end;
      margin: 0 ${(props) => props.theme.spaces.s100} 0;
    }
  }
`;

const NavHighlighter = styled.span`
  display: inline-block;
  padding: ${(props) => props.theme.spaces.s050} 0 calc(${(props) => props.theme.spaces.s050} - 5px);
  border-bottom: 5px solid transparent;
  transition: border 200ms;

  &.active {
    border-bottom: 5px solid ${(props) => props.theme.brandNavBackground};
  }

  @media (min-width: ${(props) => props.theme.breakpointMd}) {
    padding: ${(props) => props.theme.spaces.s150} 0
      calc(${(props) => props.theme.spaces.s150} - 5px);
  }
`;

const StyledDropdownToggle = styled(DropdownToggle)`
  display: block;
  padding: 0;
  margin: 0 0 ${(props) => props.theme.spaces.s100} ${(props) => props.theme.spaces.s100};
  color: ${(props) => props.theme.neutralDark};

  &:hover {
    text-decoration: none;
    color: ${(props) => props.theme.neutralDark};

    .highlighter {
      border-bottom: 5px solid ${(props) => props.theme.brandNavBackground};
    }
  }

  @media (min-width: ${(props) => props.theme.breakpointMd}) {
    align-self: flex-end;
    margin: 0 ${(props) => props.theme.spaces.s200} 0 0;
  }
`;

const StyledDropdown = styled(UncontrolledDropdown)`

  .dropdown-menu {
    border: 0px;
    padding-top: 0;
    box-shadow: none;
  }
  .dropdown-item {
    margin: 0 0 0 ${(props) => props.theme.spaces.s150};
    color: ${(props) => props.theme.neutralDark};

    .highlighter {
      display: inline-block;
      padding: ${(props) => props.theme.spaces.s050} 0 calc(${(props) =>
        props.theme.spaces.s050} - 5px);
    }

    &:hover {
    background-color: transparent;

      .highlighter {
        border-bottom: 5px solid ${(props) => props.theme.brandNavBackground};
      }
    }
  }

  @media (min-width: ${(props) => props.theme.breakpointMd}) {
    .dropdown-menu {
      background-color: ${(props) => props.theme.themeColors.white};
      box-shadow: 3px 3px 6px 2px ${(props) =>
        transparentize(0.85, props.theme.themeColors.black)}};
    }

    .dropdown-item {
      margin: 0;
    }
  }
`;

export type NavDropdownListItem = {
  id: string;
  urlPath: string;
  name: string;
  locale?: string;
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
    <StyledDropdown nav inNavbar className={active && 'active'}>
      <StyledDropdownToggle nav caret>
        <NavHighlighter className={`highlighter ${active && 'active'}`}>{children}</NavHighlighter>
      </StyledDropdownToggle>
      <DropdownMenu direction="left">
        {items &&
          items.map((child) => (
            <DropdownItem key={child.id}>
              <NavLink>
                <Link href={child.urlPath} locale={child.locale}>
                  <NavHighlighter className="highlighter">{child.name}</NavHighlighter>
                </Link>
              </NavLink>
            </DropdownItem>
          ))}
      </DropdownMenu>
    </StyledDropdown>
  );
}

export default NavDropdown;
