'use client';

import { useRouter } from 'next/navigation';

import { Box, Button, Container, Stack, Typography } from '@mui/material';

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
        <Typography variant="h4" component="h1" gutterBottom>
          Sign in
        </Typography>
        <Stack spacing={2} sx={{ mt: 2 }}>
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
      </Box>
    </Container>
  );
}
