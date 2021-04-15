import { useContext } from 'react';
import { useRouter } from 'next/router'
import styled from 'styled-components';
import { Nav, NavItem as BSNavItem, Button } from 'reactstrap';
// import { i18n, Link, useTranslation } from 'i18n';
// import { I18nContext } from 'next-i18next';

const SideNav = styled.div`
  width: 240px;
  min-height: 100vh;
  padding: ${(props)=>props.theme.spaces.s100};

  background-color: ${(props)=>props.theme.themeColors.dark};
  color: ${(props)=>props.theme.themeColors.light};
`;

const SideHeader = styled.div`
  margin-bottom: ${(props)=>props.theme.spaces.s100};
  padding: 0.5rem 1rem;
`;

const AppTitle = styled.h1`
  margin-bottom: 0;
  font-size: ${(props)=>props.theme.fontSizeLg};
  line-height: ${(props)=>props.theme.lineHeightSm};
  font-weight: ${(props) => props.theme.fontWeightBold };
  color: ${(props)=>props.theme.themeColors.light};
  letter-spacing: 4px;
`;

const LanguageSwitch = styled.div`
  margin-top: ${(props)=>props.theme.spaces.s100};
  padding: 0.5rem 0.5rem;

  .btn.btn-link {
    color: ${(props)=>props.theme.brandLight};
    opacity: .65;

    &.disabled {
      color: ${(props)=>props.theme.brandLight};
      opacity: 1;
    }
  }
`;

const NavItem = styled(BSNavItem)`

  &.active > a {
    font-weight: 700;
    color: ${(props)=>props.theme.brandLight};
  }

  > a {
    display: block;
    padding: 0.5rem 1rem;
    color: ${(props)=>props.theme.themeColors.light};
    ${({ disabled }) => disabled && `
      opacity: .3;
    `}

    &:hover {
      color: ${(props)=>props.theme.brandLight};
      ${({ disabled }) => disabled && `
        text-decoration: none;
      `}
    }
  }
`;

const SideBarNav = ({ children }) => {

  // const { i18n: { language } } = useContext(I18nContext);
  // const { t } = useTranslation(['common']);
  const router = useRouter();

  return (
    <SideNav>
      <SideHeader>
        <AppTitle>Kausal Paths</AppTitle>
        <small><span className="badge badge-secondary">v0.1-dev</span></small>
      </SideHeader>
      <Nav vertical>
        <NavItem active={router.pathname === '/'}>
          {/*
          <Link href="/">{ t('outcome') }</Link>
          */}
        </NavItem>
        <NavItem active={router.pathname === '/scenario'}>
          {/*
          <Link href="/scenario">{ t('scenario') }</Link>
          */}
        </NavItem>
        <NavItem active={router.pathname === '/mobility'}>
          {/*
          <Link href="/mobility">{ t('mobility-data') }</Link>
          */}
        </NavItem>
      </Nav>

      {/*
      <LanguageSwitch>
        <Button
            onClick={() => i18n.changeLanguage('fi')}
            color="link"
            disabled={language==='fi'}
            size="sm"
          >
            SUOMI
        </Button>
        |
        <Button
          onClick={() => i18n.changeLanguage('en')}
          color="link"
          disabled={language==='en'}
          size="sm"
        >
          ENGLISH
        </Button>
      </LanguageSwitch>
      */}
    </SideNav>
  );
};

export default SideBarNav;
