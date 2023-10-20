'use client';
import Head from 'next/head';
import styled from 'styled-components';
import GlobalNav from 'components/common/GlobalNav';
import Footer from 'components/common/Footer';
import { useSite } from 'context/site';
import { CombinedIconSymbols } from 'components/common/icon';
import { useTheme } from 'common/theme';
import { useCustomComponent } from './custom';
import { useTranslation } from 'common/i18n';
import { usePathname } from 'next/navigation';
import { PropsWithChildren } from 'react';

const PageContainer = styled.div`
  width: 100%;
  min-height: calc(100vh - 20rem);
  background-color: ${(props) => props.theme.graphColors.grey030};
  padding-bottom: ${(props) => props.theme.spaces.s400};

  .popover {
    max-width: 480px;
  }
`;

const FooterContainer = styled.footer`
  background-color: ${(props) => props.theme.themeColors.black};
  padding-bottom: 7rem;
`;

const StyledSkipToContent = styled.a`
  position: absolute;
  left: -9999px;
  z-index: 999;
  padding: ${({ theme }) => theme.spaces.s050};
  background-color: ${({ theme }) => theme.brandDark};
  border: ${({ theme }) =>
    `${theme.btnBorderWidth} solid ${theme.themeColors.light}`};
  border-radius: ${({ theme }) => theme.btnBorderRadius};
  color: ${({ theme }) => theme.themeColors.light};
  opacity: 0;

  &:focus,
  &:visited {
    color: ${({ theme }) => theme.themeColors.light};
  }

  &:focus {
    left: 50%;
    top: ${({ theme }) => theme.spaces.s050};
    transform: translateX(-50%);
    opacity: 1;
  }
`;

const Layout = ({ children }: PropsWithChildren) => {
  const pathname = usePathname();
  const theme = useTheme();
  const site = useSite();
  const { t } = useTranslation();
  const { menuPages, iconBase: fallbackIconBase, ogImage } = site;
  let activePage;

  const iconBase = theme.name
    ? `/static/themes/${theme.name}/images/favicon`
    : fallbackIconBase;

  const menuItems = [...menuPages];

  menuItems.forEach((page) => {
    if (pathname === page.urlPath) {
      activePage = page;
    }
  });

  if (!activePage) {
    menuItems.forEach((page) => {
      if (pathname.startsWith(page.urlPath)) {
        activePage = page;
      }
    });
  }

  const navItems = menuItems.map((page) => ({
    name: page.title,
    slug: page.urlPath,
    urlPath: page.urlPath,
    active: page == activePage,
  }));

  const NavComponent = useCustomComponent('GlobalNav', GlobalNav);
  const FooterComponent = useCustomComponent('Footer', Footer);

  return (
    <>
      <Head>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={site.title} />
        {iconBase && (
          <>
            <link
              rel="icon"
              href={`${iconBase}/icon.svg`}
              type="image/svg+xml"
            />
            <link rel="icon" href={`${iconBase}/favicon.ico`} />
            <link rel="apple-touch-icon" href={`${iconBase}/apple.png`} />
          </>
        )}
        {ogImage && (
          <meta property="og:image" key="head-og-image" content={ogImage} />
        )}
      </Head>
      <CombinedIconSymbols />
      <StyledSkipToContent href="#main">
        {t('skip-to-main-content')}
      </StyledSkipToContent>
      <NavComponent
        siteTitle={site.title}
        ownerName={site.owner}
        navItems={navItems}
      />
      <PageContainer>
        <main className="main" id="main">
          {children}
        </main>
      </PageContainer>
      <FooterContainer>
        <FooterComponent />
      </FooterContainer>
    </>
  );
};

export default Layout;
