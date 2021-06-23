import Head from 'next/head';
import { useRouter } from 'next/router';
import styled from 'styled-components';
import GlobalNav from 'components/common/GlobalNav';

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

  return (
    <>
      <Head>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <GlobalNav
        siteTitle="Tampereen päästöskenaariot"
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
