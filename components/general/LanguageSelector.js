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

const NavLink = styled.div`
  a {
    display: block;
    margin: 0 0 ${(props) => props.theme.spaces.s050} ${(props) => props.theme.spaces.s100};
    color: ${(props) => props.theme.neutralDark};

    &:hover {
        text-decoration: none;
        color: ${(props) => props.theme.neutralDark};

        .highlighter {
          border-bottom: 5px solid ${(props) => props.theme.brandDark};
        }
      }

    @media (min-width: ${(props) => props.theme.breakpointMd}) {
      align-self: flex-end;
      margin: 0;
    }
  }
`;

const CurrentLanguage = styled.span`
  display: inline-block;
  width: 1.5rem;
  margin: 0 .5rem;
  text-transform: uppercase;
`;

const languageNames = {
  fi: 'Suomi',
  en: 'English',
};

const LanguageSelector = (props) => {
  const router = useRouter();
  const { mobile } = props;

  const { locales } = router
  if (locales?.length < 2) return (null);
  const handleLocaleChange = (ev) => {
    ev.preventDefault();
    window.location.href = ev.target.href;
  };

  return (
    <NavLink>
    <UncontrolledDropdown nav inNavbar>
      <DropdownToggle nav>
        <Globe2 color={ mobile ? 'black' : 'white'} />
        <CurrentLanguage>{ router.locale }</CurrentLanguage>
      </DropdownToggle>
      <DropdownMenu right>
        { locales.map((locale) => (
          <DropdownItem key={locale} tag="div">
              <Link locale={locale} href='/'>
                <a onClick={handleLocaleChange}>
                  {languageNames[locale]}
                </a>
              </Link>
            </DropdownItem>
        ))}
      </DropdownMenu>
    </UncontrolledDropdown>
    
</NavLink>
  );
};

export default LanguageSelector;
