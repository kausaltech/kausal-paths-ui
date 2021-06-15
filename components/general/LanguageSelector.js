import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Globe2 } from 'react-bootstrap-icons';
import styled from 'styled-components';
import {
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from 'reactstrap';

const CurrentLanguage = styled.span`
  display: inline-block;
  width: 1.5rem;
  margin: 0 .5rem;
  text-transform: uppercase;
  color: white;
`;

const languageNames = {
  fi: 'Suomi',
  en: 'English',
};

const LanguageSelector = (props) => {
  const router = useRouter();

  return (
    <UncontrolledDropdown nav inNavbar>
      <DropdownToggle nav>
        <Globe2 color="white" />
        <CurrentLanguage>{ router.locale }</CurrentLanguage>
      </DropdownToggle>
      <DropdownMenu right>
        { router.locales.map((locale) => (
          <DropdownItem key={locale}>
            <Link href="/" locale={locale}>
              <a className="dropdown-item">
                {languageNames[locale]}
              </a>
            </Link>
          </DropdownItem>
        ))}
      </DropdownMenu>
    </UncontrolledDropdown>
  );
};

export default LanguageSelector;
