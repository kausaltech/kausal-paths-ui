'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Alert, Box, Button, Container, Stack, TextField, Typography } from '@mui/material';

import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';

import { authClient } from '@/lib/auth-client';
import { KAUSAL_PROVIDER_ID } from '@/lib/auth-const';

const REGISTER_USER = gql`
  mutation RegisterUser($input: RegisterUserInput!) {
    registerUser(input: $input) {
      ... on RegisterUserResult {
        userId
        email
      }
      ... on OperationInfo {
        messages {
          kind
          message
          field
        }
      }
    }
  }
`;

type RegisterUserData = {
  registerUser:
    | { userId: string; email: string }
    | { messages: { kind: string; message: string; field?: string }[] };
};

function isOperationError(
  result: RegisterUserData['registerUser']
): result is { messages: { kind: string; message: string; field?: string }[] } {
  return 'messages' in result;
}

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const frameworkId = searchParams.get('framework') ?? '';

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [registerUser, { loading }] = useMutation<RegisterUserData>(REGISTER_USER);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!frameworkId) {
      setError('Framework not specified');
      return;
    }

    try {
      const { data } = await registerUser({
        variables: {
          input: {
            frameworkId,
            email,
            password,
            firstName: firstName || null,
            lastName: lastName || null,
          },
        },
      });

      if (!data || isOperationError(data.registerUser)) {
        const messages = data
          ? (data.registerUser as { messages: { message: string }[] }).messages
          : [];
        setError(messages.map((m) => m.message).join(', ') || 'Registration failed');
        return;
      }

      // Registration succeeded — start the OIDC login flow
      void authClient.signIn.oauth2({
        providerId: KAUSAL_PROVIDER_ID,
        callbackURL: '/',
      });
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Create an account
        </Typography>
        <Box component="form" onSubmit={(e: React.FormEvent) => void handleSubmit(e)}>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <Stack direction="row" spacing={2}>
              <TextField
                label="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                fullWidth
                autoFocus
              />
              <TextField
                label="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                fullWidth
              />
            </Stack>
            <TextField
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
            />
            {error && <Alert severity="error">{error}</Alert>}
            <Button type="submit" variant="contained" size="large" disabled={loading} fullWidth>
              {loading ? 'Creating account...' : 'Create account'}
            </Button>
            <Typography variant="body2" align="center">
              Already have an account?{' '}
              <Button variant="text" size="small" onClick={() => router.push('/auth/sign-in')}>
                Sign in
              </Button>
            </Typography>
          </Stack>
        </Box>
      </Box>
    </Container>
  );
}
