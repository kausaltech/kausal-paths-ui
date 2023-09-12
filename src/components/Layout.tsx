import Head from 'next/head';
import { useRouter } from 'next/router';
import styled from 'styled-components';
import GlobalNav from 'components/common/GlobalNav';
import { useSite } from 'context/site';
import Footer from 'components/common/Footer';

const PageContainer = styled.div`
  width: 100%;
  background-color: ${(props) => props.theme.graphColors.grey030};
  padding-bottom: 5rem;

  .popover {
    max-width: 480px;
  }
`;

const Layout = ({ children }) => {
  const router = useRouter();
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
      <stzh-header>
        <stzh-metanav slot="nav">
          <stzh-link href="#contact">Contact</stzh-link>
          <stzh-link href="#media">Media</stzh-link>
          <stzh-link href="#jobs">Jobs</stzh-link>
        </stzh-metanav>
        <img src="media/logo/stzh-default.svg" alt="Logo City Zürich, go to homepage" slot="logo" />
        <stzh-langnav language-active="/en" languages="[{&quot;text&quot;:&quot;Deutsch&quot;,&quot;value&quot;:&quot;/de&quot;},{&quot;text&quot;:&quot;English&quot;,&quot;value&quot;:&quot;/en&quot;}]" slot="langnav"></stzh-langnav>
      </stzh-header>
      <PageContainer>
        <main className="main">{children}</main>
      </PageContainer>
      <Footer />
    </>
  );
};

export default Layout;
