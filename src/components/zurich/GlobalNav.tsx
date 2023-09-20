import React, { useState, useContext, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'next-i18next';
import {
  Collapse,
  Navbar,
  Nav,
  NavItem,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownItem,
  DropdownMenu,
} from 'reactstrap';
import * as Icon from 'react-bootstrap-icons';
import SVG from 'react-inlinesvg';
import styled, { useTheme } from 'styled-components';
import { useScrollPosition } from '@n8tb1t/use-scroll-position';
import { transparentize } from 'polished';
import SiteContext from 'context/site';
import { formatStaticUrl, Link } from 'common/links';
import NavDropdown from 'components/common/NavDropdown';
import LanguageSelector from 'components/general/LanguageSelector';

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

  @media (min-width: ${(props) => props.theme.breakpointMd}) {
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
    margin: ${(props) => props.theme.spaces.s050}
      ${(props) => props.theme.spaces.s150}
      ${(props) => props.theme.spaces.s050} 0;
  }

  @media (min-width: ${(props) => props.theme.breakpointMd}) {
    svg {
      width: 180px;
      margin: ${(props) => props.theme.spaces.s050}
        ${(props) => props.theme.spaces.s150}
        ${(props) => props.theme.spaces.s050} 0;
    }
  }
`;

const NavLink = styled.div`
  a {
    display: block;
    margin: 0 0 ${(props) => props.theme.spaces.s050}
      ${(props) => props.theme.spaces.s100};
    color: ${(props) => props.theme.neutralDark};

    &:hover {
      text-decoration: none;
      color: ${(props) => props.theme.neutralDark};

      .highlighter {
        color: var(--hover-color);
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
  color: var(--stzh-base-color);

  &.active {
    color: var(--hover-color);
  }
`;

const StyledDropdownToggle = styled(DropdownToggle)`
  display: block;
  padding: 0;
  margin: 0 0 ${(props) => props.theme.spaces.s100}
    ${(props) => props.theme.spaces.s100};
  color: ${(props) => props.theme.neutralDark};

  &:hover {
    text-decoration: none;
    color: ${(props) => props.theme.neutralDark};

    .highlighter {
      color: var(--hover-color);
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
    }

    &:hover {
    background-color: transparent;

      .highlighter {
        color: var(--hover-color);
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
  -webkit-appearance: none;

  @media (min-width: ${(props) => props.theme.breakpointMd}) {
    display: none;
  }
`;

const StyledCollapse = styled(Collapse)`
  @media (min-width: ${(props) => props.theme.breakpointMd}) {
    display: flex;
    background-color: var(--stzh-color-white);
    height: 4rem;
    justify-content: space-between;
    align-items: center;
    text-align: center;
  }
`;

const SiteTitle = styled.span`
  @media (max-width: ${(props) => props.theme.breakpointMd}) {
    display: none;
  }
`;

const SecondaryNavWrapper = styled.div`
  background-color: var(--stzh-color-white);
`;

function DropdownList(props) {
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
                  <NavHighlighter className="highlighter">
                    {child.name}
                  </NavHighlighter>
                </Link>
              </NavLink>
            </DropdownItem>
          ))}
      </DropdownMenu>
    </StyledDropdown>
  );
}

DropdownList.defaultProps = {
  active: false,
};

DropdownList.propTypes = {
  parentName: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
      slug: PropTypes.string,
      children: PropTypes.node,
    })
  ).isRequired,
  active: PropTypes.bool,
};

function GlobalNav(props) {
  const { t } = useTranslation();
  const site = useContext(SiteContext);
  const theme = useTheme();
  const [navIsFixed, setnavIsFixed] = useState(false);
  const [isOpen, toggleOpen] = useState(false);
  const { siteTitle, ownerName, navItems, fullwidth, sticky } = props;

  const orgLogo = useMemo(() => {
    const url = formatStaticUrl(theme.themeLogoUrl);
    return (
      <SVG
        className="org-logo"
        src={url}
        title={`${ownerName}, ${siteTitle} ${t('front-page')}`}
        preserveAspectRatio="xMinYMid meet"
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
    <div className="header header--has-appnav">
      <div className="header__inner">
        <div className="header__main">
          <div className="header__logobar" id="branding-navigation-bar">
            <div className="header__logobar-logo">
              <Link href="/" passHref>
                <HomeLink className="header__logo-link">{orgLogo}</HomeLink>
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
        </div>

        <SecondaryNavWrapper>
          <SecondaryNav
            expand="md"
            fixed={navIsFixed ? 'top' : ''}
            id="global-navigation-bar"
            className="header__appnav-inner"
            container={false}
          >
            <StyledCollapse isOpen={isOpen} navbar>
              <Nav
                navbar
                className="stzh-appnav__items sc-stzh-appnav sc-stzh-appnav-s me-auto"
              >
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
                            <a>
                              <NavHighlighter
                                className={`highlighter ${
                                  page.active && 'active'
                                }`}
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
              {site.watchLink ? (
                <Nav navbar>
                  <NavItem>
                    <NavLink>
                      <Link href={site.watchLink.url}>
                        <a>
                          <NavHighlighter className="highlighter">
                            {site.watchLink.title}
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
  );
}

GlobalNav.defaultProps = {
  fullwidth: false,
  sticky: false,
  ownerName: '',
};

GlobalNav.propTypes = {
  siteTitle: PropTypes.string.isRequired,
  ownerName: PropTypes.string,
  navItems: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
      slug: PropTypes.string,
      children: PropTypes.arrayOf(PropTypes.shape),
    })
  ).isRequired,
  fullwidth: PropTypes.bool,
  sticky: PropTypes.bool,
};

export default GlobalNav;
