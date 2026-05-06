'use client';

import { useRouter } from 'next/navigation';

import { Box, Button, Container, Paper, Stack, Typography } from '@mui/material';

import { authClient } from '@/lib/auth-client';
import { KAUSAL_PROVIDER_ID } from '@/lib/auth-const';

export default function SignInPage() {
  const router = useRouter();

  const handleSignIn = () => {
    void authClient.signIn.oauth2({
      providerId: KAUSAL_PROVIDER_ID,
      callbackURL: '/',
    });
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Paper
          sx={{
            p: { xs: 3, sm: 4 },
            mt: 2,
            filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.08))',
          }}
        >
          <Box sx={{ width: '100%', mb: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Sign in
            </Typography>
          </Box>
          <Stack spacing={2}>
            <Button variant="contained" size="large" onClick={handleSignIn} fullWidth>
              Sign in with Kausal
            </Button>
            <Typography variant="body2" align="center">
              Don&apos;t have an account?{' '}
              <Button variant="text" size="small" onClick={() => router.push('/auth/register')}>
                Register
              </Button>
            </Typography>
          </Stack>
        </Paper>
      </Box>
    </Container>
  );
}
