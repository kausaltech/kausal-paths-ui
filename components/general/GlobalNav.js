import React, { useState, useContext } from 'react';
import Link from 'next/link'
import styled from 'styled-components';

import {
  Container,
  Collapse,
  Navbar,
  NavbarToggler,
  NavbarBrand,
  Nav,
  NavItem,
  NavLink,
} from 'reactstrap';

const Brand = styled.div`
  margin-right: .5rem;

  a {
    color: ${(props) => props.theme.graphColors.grey010 };
  }
`;

const GlobalNav = (props) => {

  const [isOpen, setIsOpen] = useState(false);
  const toggle = () => setIsOpen(!isOpen);

  return (
    <Navbar color="dark" dark expand="md">
    <Container>
      <Brand>
        <Link href="/" passHref>
          <a>
            Tampereen päästöskenaariot
          </a>
        </Link>
      </Brand>
      <NavbarToggler onClick={toggle} />
        <Nav className="mr-auto" navbar>
          <NavItem>
            <Link href="/" passHref>
              <NavLink>
                Päästöt
              </NavLink>
            </Link>
          </NavItem>
          <NavItem>
            <Link href="/actions" passHref>
              <NavLink>
                Toimet
              </NavLink>
            </Link>
          </NavItem>
        </Nav>
    </Container>
    </Navbar>
  )
}

export default GlobalNav;
