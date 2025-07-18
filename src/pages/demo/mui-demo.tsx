import { MuiThemeExample } from '@/components/common/MuiThemeExample';
import { Card, Container } from '@mui/material';
import Head from 'next/head';

function MuiDemoPage() {
  return (
    <>
      <Head>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <Container maxWidth="lg" sx={{ p: 4 }}>
        <Card>
          <MuiThemeExample />
        </Card>
      </Container>
    </>
  );
}

export default MuiDemoPage;
