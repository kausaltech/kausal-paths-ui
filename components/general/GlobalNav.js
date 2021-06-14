import React, { useState } from 'react';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import styled from 'styled-components';

import {
  Container,
  Navbar,
  NavbarToggler,
  Nav,
  NavItem,
  NavLink,
} from 'reactstrap';

const Brand = styled.div`
  margin-right: .5rem;

  a {
    color: ${(props) => props.theme.graphColors.grey010};
  }
`;

const GlobalNav = (props) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const toggle = () => setIsOpen(!isOpen);

  return (
    <Navbar color="dark" dark expand="md">
      <Brand>
        <Link href="/" passHref>
          <a href>
            Tampereen päästöskenaariot
          </a>
        </Link>
      </Brand>
      <NavbarToggler onClick={toggle} />
      <Nav className="mr-auto" navbar>
        <NavItem>
          <Link href="/" passHref>
            <NavLink>
              { t('emissions') }
            </NavLink>
          </Link>
        </NavItem>
        <NavItem>
          <Link href="/actions" passHref>
            <NavLink>
              { t('actions') }
            </NavLink>
          </Link>
        </NavItem>
      </Nav>
    </Navbar>
  );
};

export default GlobalNav;
