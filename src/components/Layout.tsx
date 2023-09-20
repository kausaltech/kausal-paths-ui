import Head from 'next/head';
import { useRouter } from 'next/router';
import styled from 'styled-components';
import GlobalNav from 'components/common/GlobalNav';
import ZurichGlobalNav from 'components/zurich/GlobalNav';
import ZurichSiteFooter from 'components/zurich/ZurichSiteFooter';
import Footer from 'components/common/Footer';
import { useSite } from 'context/site';
import { yearRangeVar, activeScenarioVar, activeGoalVar } from 'common/cache';
import { CombinedIconSymbols } from 'components/common/icon';
import { useTheme } from 'common/theme';

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

const Layout = ({ children }) => {
  const router = useRouter();
  const theme = useTheme();
  const { asPath: pathname } = router;
  const site = useSite();
  const { menuPages, iconBase, ogImage } = site;
  let activePage;

  const menuItems = [...menuPages];
  // Add extra pages that are not available in the backend
  site.demoPages?.map(
    (page) => router.locale === page.lang && menuItems.push(page)
  );
  // Add home page link if defined in instance
  site.homeLink?.map(
    (page) =>
      router.locale?.slice(0, 2) === page.lang && menuItems.unshift(page)
  );

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

  // FIXME: Temporary hack for Zurich demo
  const NavComponent = theme.name === 'zurich' ? ZurichGlobalNav : GlobalNav;
  const FooterComponent = theme.name === 'zurich' ? ZurichSiteFooter : Footer;

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
      <NavComponent
        siteTitle={site.title}
        ownerName={site.owner}
        navItems={navItems}
      />
      <PageContainer>
        <main className="main">{children}</main>
      </PageContainer>
      <FooterContainer>
        <FooterComponent />
      </FooterContainer>
    </>
  );
};

export default Layout;
