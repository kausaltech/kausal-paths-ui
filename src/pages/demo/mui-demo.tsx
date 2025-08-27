import Head from 'next/head';

import { Card, Container } from '@mui/material';

import { MuiThemeExample } from '@/components/common/MuiThemeExample';

function MuiDemoPage() {
  return (
    <>
      <Head>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <Container fixed maxWidth="lg" sx={{ py: 4 }}>
        <Card>
          <MuiThemeExample />
        </Card>
      </Container>
    </>
  );
}

export default MuiDemoPage;
