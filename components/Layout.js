import Head from 'next/head';
import { useRouter } from 'next/router';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import GlobalNav from 'components/common/GlobalNav';
import { settingsVar } from 'common/cache';
import { useSite } from 'context/site';
import ActionPage from 'pages/actions/[slug]';

const PageContainer = styled.div`
  width: 100%;
  background-color: ${(props) => props.theme.graphColors.grey020};
  padding-bottom: 10rem;

  .popover {
    max-width: 480px;
  }
`;

const Layout = ({ children }) => {
  const router = useRouter();
  const { pathname } = router;
  const { iconBase, ogImage } = settingsVar();
  const { t } = useTranslation();
  const site = useSite();
  const { menuPages } = site;
  let activePage;

  for (const page in menuPages) {
    if (pathname === page.urlPath) {
      activePage = page;
      break;
    }
  }
  if (!activePage) {
    for (const page in menuPages) {
      if (pathname.startsWith(page.urlPath)) {
        activePage = page;
        break;
      }
    }
  }

  const navItems = menuPages.map((page) => ({
    name: page.title,
    slug: page.urlPath,
    urlPath: page.urlPath,
    active: page == activePage,
  }));

  return (
    <>
      <Head>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={site.title} />
        {iconBase && (
          <>
            <link rel="icon" href={`${iconBase}/icon.svg`} type="image/svg+xml" />
            <link rel="icon" href={`${iconBase}/favicon.ico`} />
            <link rel="apple-touch-icon" href={`${iconBase}/apple.png`} />
          </>
        )}
        {ogImage && (
          <meta property="og:image" key="head-og-image" content={ogImage} />
        )}
      </Head>
      <GlobalNav
        siteTitle={site.title}
        ownerName={site.owner}
        navItems={navItems}
      />
      <PageContainer>
        <main className="main">
          {children}
        </main>
      </PageContainer>
    </>
  );
};

export default Layout;
