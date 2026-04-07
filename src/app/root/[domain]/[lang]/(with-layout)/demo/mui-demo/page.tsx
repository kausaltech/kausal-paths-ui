import type { Metadata } from 'next';

import { Card, Container } from '@mui/material';

import { MuiThemeExample } from '@/components/common/MuiThemeExample';

export const metadata: Metadata = {
  robots: 'noindex,nofollow',
};

export default function MuiDemoPage() {
  return (
    <Container fixed maxWidth="lg" sx={{ py: 4 }}>
      <Card>
        <MuiThemeExample />
      </Card>
    </Container>
  );
}
