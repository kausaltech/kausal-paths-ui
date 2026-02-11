import React, { useMemo, useState } from 'react';

import Head from 'next/head';

import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { useTranslation } from 'next-i18next';
import * as Icon from 'react-bootstrap-icons';
import SVG from 'react-inlinesvg';
import { Collapse, Nav, NavItem, Navbar } from 'reactstrap';

import { isProductionDeployment } from '@common/env';
import { getThemeStaticURL } from '@common/themes/theme';

import { Link } from '@/common/links';
import type { GlobalNavProps } from '@/components/common/GlobalNav';
import NavDropdown from '@/components/common/NavDropdown';
import LanguageSelector from '@/components/general/LanguageSelector';
import { useSite } from '@/context/site';

const SecondaryNav = styled(Navbar)`
  padding: 0;

  &.show {
    padding: 0 0 ${(props) => props.theme.spaces.s150} 0;
  }

  .container {
    flex-wrap: nowrap;
  }

  .navbar-nav {
    padding: ${(props) => props.theme.spaces.s150} 0 0;
    align-items: flex-start;
  }

  .nav-item {
    display: flex;
    flex-direction: column;
  }

  @media (min-width: ${(props) => props.theme.breakpoints.values.md}px) {
    .navbar-nav {
      padding: 0;
    }

    .nav-item {
      flex-direction: row;
    }
  }
`;

const HomeLink = styled.a`
  display: flex;
  align-items: flex-start;
  color: ${(props) => props.theme.brandNavColor};
  font-weight: ${(props) => props.theme.fontWeightBold};
  line-height: ${(props) => props.theme.lineHeightSm};
  hyphens: auto;
  word-break: break-word;

  &:hover {
    text-decoration: none;
    color: ${(props) => props.theme.brandNavColor};
  }

  svg {
    display: block;
    width: 135px;
    height: auto;
    margin: ${(props) => props.theme.spaces.s050} ${(props) => props.theme.spaces.s150}
      ${(props) => props.theme.spaces.s050} 0;
  }

  @media (min-width: ${(props) => props.theme.breakpoints.values.md}px) {
    svg {
      width: 180px;
    }
  }

  @media (min-width: ${(props) => props.theme.breakpoints.values.xl}px) {
    svg {
      width: 242px;
    }
  }
`;

const NavLink = styled.div`
  a {
    display: block;
    margin: 0 0 ${(props) => props.theme.spaces.s050} ${(props) => props.theme.spaces.s100};
    color: ${(props) => props.theme.neutralDark};

    &:hover {
      text-decoration: none;
      color: ${(props) => props.theme.neutralDark};

      .highlighter {
        color: var(--hover-color);
      }
    }

    @media (min-width: ${(props) => props.theme.breakpoints.values.md}px) {
      align-self: flex-end;
      margin: 0 ${(props) => props.theme.spaces.s200} 0 0;
    }
  }
`;

const NavHighlighter = styled.span`
  display: inline-block;
  color: var(--stzh-base-color);

  &.active {
    color: var(--hover-color);
  }
`;

const NavbarToggler = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  margin: 0;
  font-size: 1.5rem;
  width: ${(props) => props.theme.spaces.s300};
  font-weight: ${(props) => props.theme.fontWeightBold};
  line-height: ${(props) => props.theme.lineHeightMd};
  hyphens: auto;
  border: none;
  overflow: visible;
  background: transparent;
  border-radius: 0;
  appearance: none;

  @media (min-width: ${(props) => props.theme.breakpoints.values.md}px) {
    display: none;
  }
`;

const StyledCollapse = styled(Collapse)`
  @media (min-width: ${(props) => props.theme.breakpoints.values.md}px) {
    display: flex;
    background-color: var(--stzh-color-white);
    height: 4rem;
    justify-content: space-between;
    align-items: center;
    text-align: center;
  }
`;

const SiteTitle = styled.span`
  @media (max-width: ${(props) => props.theme.breakpoints.values.md}px) {
    display: none;
  }
`;

const SecondaryNavWrapper = styled.div`
  background-color: var(--stzh-color-white);
`;

const StyledHeaderMain = styled.div`
  &.header__main {
    z-index: 1;
  }
`;

function GlobalNav(props: GlobalNavProps) {
  const { t, i18n } = useTranslation();
  const site = useSite();
  const theme = useTheme();
  const [isOpen, toggleOpen] = useState(false);
  const { siteTitle, ownerName, navItems } = props;

  const watchLinkTitle = site.watchLink
    ? t(`watchLink.${site.instanceId}.${i18n.language}`, {
        defaultValue:
          typeof site.watchLink.title === 'string'
            ? site.watchLink.title
            : site.watchLink.title[i18n.language] || Object.values(site.watchLink.title)[0],
      })
    : null;

  const watchLinkUrl = site.watchLink
    ? typeof site.watchLink.url === 'string'
      ? site.watchLink.url
      : site.watchLink.url[i18n.language] || Object.values(site.watchLink.url)[0]
    : '';

  const orgLogo = useMemo(() => {
    const url = getThemeStaticURL(theme.themeLogoUrl);
    return (
      <SVG
        className="org-logo"
        src={url}
        title={`${ownerName}, ${siteTitle} ${t('front-page')}`}
        preserveAspectRatio="xMinYMid meet"
      />
    );
  }, [theme.themeLogoUrl, ownerName, siteTitle, t]);

  const analyticsUrl = isProductionDeployment()
    ? 'https://www.stadt-zuerich.ch/etc/clientlibs/stzh/analytics/294297d554c0/068a31a4609c/launch-9189fcb507a0.min.js'
    : 'https://www.integ.stadt-zuerich.ch/etc/clientlibs/stzh/analytics/294297d554c0/068a31a4609c/launch-92ad5f87cc3b-staging.min.js';

  return (
    <>
      {isProductionDeployment() ? (
        <Head>
          <script key="zuerich-analytics" src={analyticsUrl} async />
        </Head>
      ) : null}

      <div className="header header--has-appnav">
        <div className="header__inner">
          <StyledHeaderMain className="header__main">
            <div className="header__logobar" id="branding-navigation-bar">
              <div className="header__logobar-logo">
                <Link href="/" passHref>
                  <HomeLink href="dummy" className="header__logo-link">
                    {orgLogo}
                  </HomeLink>
                </Link>
              </div>
              <NavbarToggler
                onClick={() => toggleOpen(!isOpen)}
                aria-label={isOpen ? t('nav-menu-close') : t('nav-menu-open')}
                aria-controls="global-navigation-bar"
                aria-expanded={isOpen}
                type="button"
              >
                {isOpen ? (
                  <Icon.XLg color={theme.themeColors.white} />
                ) : (
                  <Icon.List color={theme.themeColors.white} />
                )}
              </NavbarToggler>
            </div>
          </StyledHeaderMain>

          <SecondaryNavWrapper>
            <SecondaryNav
              expand="md"
              id="global-navigation-bar"
              className="header__appnav-inner"
              container={false}
            >
              <StyledCollapse isOpen={isOpen} navbar>
                <Nav navbar className="stzh-appnav__items sc-stzh-appnav sc-stzh-appnav-s me-auto">
                  {navItems &&
                    navItems.map((page) =>
                      page.children ? (
                        <NavDropdown
                          className="sc-stzh-link-h sc-stzh-link-s"
                          items={page.children}
                          active={page.active}
                          key={page.slug}
                        >
                          {page.name}
                        </NavDropdown>
                      ) : (
                        <NavItem
                          className="sc-stzh-link-h sc-stzh-link-s"
                          key={page.slug}
                          active={page.active}
                        >
                          <NavLink>
                            <Link href={page.urlPath}>
                              <a data-testid={`navitem::${page.urlPath}`}>
                                <NavHighlighter
                                  className={`highlighter ${page.active && 'active'}`}
                                >
                                  {page.name}
                                </NavHighlighter>
                              </a>
                            </Link>
                          </NavLink>
                        </NavItem>
                      )
                    )}
                </Nav>
                <Nav navbar className="d-md-none">
                  <LanguageSelector mobile />
                </Nav>
                {watchLinkUrl && watchLinkTitle ? (
                  <Nav navbar>
                    <NavItem>
                      <NavLink>
                        <Link href={watchLinkUrl}>
                          <a>
                            <NavHighlighter className="highlighter">
                              {watchLinkTitle}
                            </NavHighlighter>
                          </a>
                        </Link>
                      </NavLink>
                    </NavItem>
                  </Nav>
                ) : null}
              </StyledCollapse>
              <SiteTitle>{siteTitle}</SiteTitle>
            </SecondaryNav>
          </SecondaryNavWrapper>
        </div>
      </div>
    </>
  );
}

export default GlobalNav;
