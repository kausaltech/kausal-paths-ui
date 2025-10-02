import React, { Fragment, useMemo, useState } from 'react';

import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { Box, Container } from '@mui/material';
import { useTranslation } from 'next-i18next';
import SVG from 'react-inlinesvg';
import { Collapse, Nav, NavItem, Navbar } from 'reactstrap';

import { Link } from '@/common/links';
import { getThemeStaticURL } from '@/common/theme';
import NavDropdown, { type NavDropdownListItem } from '@/components/common/NavDropdown';
import Icon from '@/components/common/icon';
import LanguageSelector from '@/components/general/LanguageSelector';
import { useSiteWithSetter } from '@/context/site';

const BrandNavWrapper = styled(Box)`
  background-color: ${(props) => props.theme.brandNavBackground};
  border-bottom: 1px solid ${(props) => props.theme.themeColors.light};

  .container {
    padding-right: 0 !important;
    padding-left: 0 !important;
  }
`;

const BotNavWrapper = styled(Box)`
  background-color: ${(props) => props.theme.themeColors.white};
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.07);
`;

const TopNav = styled(Navbar)`
  padding: 0;
  background-color: ${(props) => props.theme.brandNavBackground};

  .nav-item a,
  .nav-item a:hover {
    color: ${(props) => props.theme.brandNavColor};
  }

  .dropdown-item {
    text-align: left;
  }

  a.dropdown-item,
  a.dropdown-item:hover,
  .dropdown-item a,
  .dropdown-item a:hover {
    color: ${(props) => props.theme.themeColors.dark};
    text-align: left;
    text-decoration: none;
  }
`;

const BotNav = styled(Navbar)`
  background-color: ${(props) => props.theme.themeColors.white};
  padding: 0;

  &.show {
    padding: 0 0 ${(props) => props.theme.spaces.s150} 0;
  }

  .container {
    flex-wrap: nowrap;
  }

  .navbar-nav {
    padding: ${(props) => props.theme.spaces.s150} 0 0;
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

const SiteTitle = styled.div`
  font-size: ${(props) => props.theme.fontSizeBase};
  font-family: ${(props) => `${props.theme.brandNavFontFamily}, ${props.theme.fontFamilyFallback}`};
  line-height: 1;
  padding: ${(props) => props.theme.spaces.s150} 0 ${(props) => props.theme.spaces.s150};

  @media (min-width: ${(props) => props.theme.breakpoints.values.md}px) {
    font-size: ${(props) => props.theme.fontSizeMd};
  }
`;
const HomeLink = styled.a`
  display: flex;
  align-items: center;
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
    display: none;
    width: auto;
    max-width: 6em;
    height: ${(props) => props.theme.spaces.s200};
    margin: ${(props) => props.theme.spaces.s050} ${(props) => props.theme.spaces.s150}
      ${(props) => props.theme.spaces.s050} 0;
  }

  @media (min-width: ${(props) => props.theme.breakpoints.values.md}px) {
    svg {
      display: block;
      max-width: 18em;
      height: calc(${(props) => props.theme.spaces.s200} + ${(props) => props.theme.spaces.s050});
      margin: ${(props) => props.theme.spaces.s050} ${(props) => props.theme.spaces.s150}
        ${(props) => props.theme.spaces.s050} 0;
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
        border-bottom: 5px solid ${(props) => props.theme.brandDark};
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

const NavbarToggler = styled.button`
  display: inline-block;
  padding: 0;
  margin: 0;
  text-align: right;
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

export type GlobalNavProps = {
  siteTitle: string;
  ownerName?: string;
  navItems: {
    id: string;
    name: string;
    slug: string;
    urlPath: string;
    active?: boolean;
    children?: NavDropdownListItem[];
  }[];
  sticky?: boolean;
};

function GlobalNav(props: React.PropsWithChildren<GlobalNavProps>) {
  const { t, i18n } = useTranslation();
  const [site] = useSiteWithSetter();
  const theme = useTheme();
  const [isOpen, toggleOpen] = useState(false);
  const { siteTitle, ownerName, navItems } = props;
  //const instanceId = site.instanceId || site.instanceContext?.id || 'default';

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
        onError={(err) => console.error(err)}
      />
    );
  }, [theme.themeLogoUrl, ownerName, siteTitle, t]);

  return (
    <Fragment>
      <BrandNavWrapper>
        <Container fixed maxWidth="xl" sx={{ backgroundColor: 'theme.brandNavBackground' }}>
          <TopNav expand="md" id="branding-navigation-bar" aria-label={siteTitle} container={false}>
            <Nav navbar className="me-auto">
              <Link href="/" passHref>
                <HomeLink href="dummy">
                  {orgLogo}
                  <SiteTitle>{siteTitle}</SiteTitle>
                </HomeLink>
              </Link>
            </Nav>
            <Nav navbar className="ml-auto d-none d-md-flex">
              <LanguageSelector mobile={false} />
            </Nav>
            <NavbarToggler
              onClick={() => toggleOpen(!isOpen)}
              aria-label={isOpen ? t('nav-menu-close') : t('nav-menu-open')}
              aria-controls="global-navigation-bar"
              aria-expanded={isOpen}
              type="button"
            >
              {isOpen ? (
                <Icon name="times" color={theme.brandNavColor} />
              ) : (
                <Icon name="bars" color={theme.brandNavColor} />
              )}
            </NavbarToggler>
          </TopNav>
        </Container>
      </BrandNavWrapper>
      <BotNavWrapper>
        <Container fixed maxWidth="xl">
          <BotNav expand="md" id="global-navigation-bar" container={false}>
            <Collapse isOpen={isOpen} navbar>
              <Nav navbar className="me-auto">
                {navItems &&
                  navItems.map((page) =>
                    page.children ? (
                      <NavDropdown items={page.children} active={page.active} key={page.slug}>
                        {page.name}
                      </NavDropdown>
                    ) : (
                      <NavItem key={page.slug} active={page.active}>
                        <NavLink>
                          <Link href={page.urlPath}>
                            <a>
                              <NavHighlighter className={`highlighter ${page.active && 'active'}`}>
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
              {site.watchLink ? (
                <Nav navbar>
                  <NavItem>
                    <NavLink>
                      <Link href={watchLinkUrl}>
                        <a>
                          <NavHighlighter className="highlighter">{watchLinkTitle}</NavHighlighter>
                        </a>
                      </Link>
                    </NavLink>
                  </NavItem>
                </Nav>
              ) : null}
            </Collapse>
          </BotNav>
        </Container>
      </BotNavWrapper>
    </Fragment>
  );
}

export default GlobalNav;
