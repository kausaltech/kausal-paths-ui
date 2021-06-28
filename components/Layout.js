import Head from 'next/head';
import { useRouter } from 'next/router';
import styled from 'styled-components';
import GlobalNav from 'components/common/GlobalNav';
import { settingsVar } from 'common/cache';

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
  const { iconBase, siteTitle, ogImage } = settingsVar();

  return (
    <>
      <Head>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={siteTitle} />
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
        siteTitle={siteTitle}
        ownerName="Tampereen kaupunki"
        navItems={[
          {
            name: 'Päästöt',
            slug: '',
            urlPath: '/',
            active: router.pathname === '/',
          },
          {
            name: 'Toimet',
            slug: 'actions',
            urlPath: '/actions',
            active: router.pathname.startsWith('/actions'),
          },
        ]}
        fullwidth
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
