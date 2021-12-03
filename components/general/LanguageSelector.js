import { useState, useRef, useEffect } from 'react';
import { Link } from 'common/urls';
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

  const { locales, pathname, asPath, query } = router
  if (locales?.length < 2) return (null);
  const handleLocaleChange = (ev) => {
    ev.preventDefault();
    window.location.href = ev.target.href;
  };

  return (
    <UncontrolledDropdown nav inNavbar>
      <DropdownToggle nav>
        <Globe2 color="white" />
        <CurrentLanguage>{ router.locale }</CurrentLanguage>
      </DropdownToggle>
      <DropdownMenu right>
        { locales.map((locale) => (
            <DropdownItem key={locale}>
              <Link locale={locale} href='/'>
                <a onClick={handleLocaleChange}>{languageNames[locale]}</a>
              </Link>
            </DropdownItem>
        ))}
      </DropdownMenu>
    </UncontrolledDropdown>
  );
};

export default LanguageSelector;
