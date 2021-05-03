import Head from 'next/head';
import styled from 'styled-components';
import GlobalNav from 'components/general/GlobalNav';

const PageContainer = styled.div`
  display: flex;
  width: 100%;
  height: 100vh;
  background-color: ${(props) => props.theme.graphColors.grey030};

  .side-wrapper {
    flex-grow: 1;
    overflow: scroll;
  }

  .main {
    flex-basis: 0;
    flex-grow: 999;
    overflow: scroll;
  }
`;


const Layout = ({ children }) => {
  return (
    <>
    <Head> 
      <link rel="icon" href="/favicon.ico" />
    </Head>
    <GlobalNav />
    <PageContainer>
      <main className="main">
        {children}
      </main>
    </PageContainer>
    </>
  );
};

export default Layout;
