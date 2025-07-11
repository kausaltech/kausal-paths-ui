import React, { useMemo, useState } from 'react';

import { useScrollPosition } from '@n8tb1t/use-scroll-position';
import { Link } from 'common/links';
import Icon from 'components/common/icon';
import NavDropdown, {
  type NavDropdownListItem,
  type NavDropdownProps,
} from 'components/common/NavDropdown';
import LanguageSelector from 'components/general/LanguageSelector';
import { useSite } from 'context/site';
import { useTranslation } from 'next-i18next';
import { transparentize } from 'polished';
import SVG from 'react-inlinesvg';
import {
  Collapse,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  Nav,
  Navbar,
  NavItem,
  UncontrolledDropdown,
} from 'reactstrap';
import styled, { useTheme } from 'styled-components';

import { getThemeStaticURL } from '@/common/theme';

const TopNav = styled(Navbar)`
  padding: 0 ${(props) => props.theme.spaces.s100};
  background-color: ${(props) => props.theme.brandNavBackground};
  border-bottom: 1px solid ${(props) => props.theme.themeColors.light};

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
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.07);

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

  @media (min-width: ${(props) => props.theme.breakpointMd}) {
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

  @media (min-width: ${(props) => props.theme.breakpointMd}) {
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

  @media (min-width: ${(props) => props.theme.breakpointMd}) {
    svg {
      display: block;
      max-width: 18em;
      height: calc(${(props) => props.theme.spaces.s200} + ${(props) => props.theme.spaces.s050});
      margin: ${(props) => props.theme.spaces.s050} ${(props) => props.theme.spaces.s150}
        ${(props) => props.theme.spaces.s050} 0;
    }
  }
`;

const EmptyLogo = styled.div`
  width: 0;
  height: ${(props) => props.theme.spaces.s200};
  margin: ${(props) => props.theme.spaces.s050} 0 ${(props) => props.theme.spaces.s050} 0;

  @media (min-width: ${(props) => props.theme.breakpointMd}) {
    width: 0;
    height: calc(${(props) => props.theme.spaces.s200} + ${(props) => props.theme.spaces.s050});
    margin: ${(props) => props.theme.spaces.s050} 0 ${(props) => props.theme.spaces.s050} 0;
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

    @media (min-width: ${(props) => props.theme.breakpointMd}) {
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
      border-bottom: 5px solid ${(props) => props.theme.brandDark};
    }
  }

  @media (min-width: ${(props) => props.theme.breakpointMd}) {
    align-self: flex-end;
    margin: 0 ${(props) => props.theme.spaces.s200} 0 0;
  }
`;

const StyledDropdown = styled(UncontrolledDropdown)`
  .dropdown-toggle.nav-link {
    padding-left: 0;
    padding-right: 0;
  }

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
      padding: ${(props) => props.theme.spaces.s050} 0
        calc(${(props) => props.theme.spaces.s050} - 5px);
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
      box-shadow: 3px 3px 6px 2px ${(props) => transparentize(0.85, props.theme.themeColors.black)};
    }

    .dropdown-item {
      margin: 0;
    }
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
  -webkit-appearance: none;

  @media (min-width: ${(props) => props.theme.breakpointMd}) {
    display: none;
  }
`;

function DropdownList(props: NavDropdownProps) {
  const { parentName, items, active } = props;
  return (
    <StyledDropdown nav inNavbar className={active && 'active'}>
      <StyledDropdownToggle nav caret>
        <NavHighlighter className={`highlighter ${active && 'active'}`}>
          {parentName}
        </NavHighlighter>
      </StyledDropdownToggle>
      <DropdownMenu direction="left">
        {items &&
          items.map((child) => (
            <DropdownItem key={child.id}>
              <NavLink>
                <Link href={child.urlPath}>
                  <NavHighlighter className="highlighter">{child.name}</NavHighlighter>
                </Link>
              </NavLink>
            </DropdownItem>
          ))}
      </DropdownMenu>
    </StyledDropdown>
  );
}

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
  const site = useSite();
  const theme = useTheme();
  const [navIsFixed, setnavIsFixed] = useState(false);
  const [isOpen, toggleOpen] = useState(false);
  const { siteTitle, ownerName, navItems, sticky } = props;
  const instanceId = site.instanceId || site.instanceContext?.id || 'default';

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

  if (sticky) {
    useScrollPosition(
      ({ prevPos, currPos }) => {
        const goingUp = currPos.y > prevPos.y && currPos.y < -70;
        if (goingUp !== navIsFixed) setnavIsFixed(goingUp);
      },
      [navIsFixed],
      null,
      false,
      300
    );
  }
  return (
    <div>
      <TopNav expand="md" id="branding-navigation-bar" aria-label={siteTitle} container="lg">
        <Link href="/" passHref>
          <HomeLink href="dummy">
            {orgLogo}
            <SiteTitle>{siteTitle}</SiteTitle>
          </HomeLink>
        </Link>
        {false /* FIXME */ && (
          <Nav navbar className="ml-auto">
            <NavItem>
              <NavLink>
                <Link href="#admin" passHref>
                  <a href="dummy">
                    <NavHighlighter className="highlighter">
                      <Icon name="user" size={20} color={theme.brandNavColor} /> Log in
                    </NavHighlighter>
                  </a>
                </Link>
              </NavLink>
            </NavItem>
          </Nav>
        )}
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
      <BotNav expand="md" fixed={navIsFixed ? 'top' : ''} id="global-navigation-bar" container="lg">
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
    </div>
  );
}

export default GlobalNav;
