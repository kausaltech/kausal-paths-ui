'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Alert, Box, Button, Container, Paper, Stack, TextField, Typography } from '@mui/material';

import { type TypedDocumentNode, gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import { ArrowLeft } from 'react-bootstrap-icons';
import SVG from 'react-inlinesvg';

import { useTheme } from '@common/themes';
import { getThemeStaticURL } from '@common/themes/theme';

import type {
  FrameworkNameQueryVariables,
  RegisterUserMutationVariables,
} from '@/common/__generated__/graphql';
import { authClient } from '@/lib/auth-client';
import { KAUSAL_PROVIDER_ID } from '@/lib/auth-const';

const GET_FRAMEWORK_NAME: TypedDocumentNode<FrameworkNameData, FrameworkNameQueryVariables> = gql`
  query FrameworkName($identifier: ID!) {
    framework(identifier: $identifier) {
      id
      name
    }
  }
`;

type FrameworkNameData = {
  framework: { id: string; name: string } | null;
};

const REGISTER_USER: TypedDocumentNode<RegisterUserData, RegisterUserMutationVariables> = gql`
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
  const theme = useTheme();
  const searchParams = useSearchParams();
  const frameworkId = searchParams.get('framework') ?? '';
  const invitationToken = searchParams.get('invitation_code');
  const logoUrl = theme.themeLogoUrl ? getThemeStaticURL(theme.themeLogoUrl) : null;
  const isLogoBitmap = theme.themeLogoUrl?.endsWith('.png');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [registerUser, { loading }] = useMutation(REGISTER_USER);

  const { data: frameworkData } = useQuery(GET_FRAMEWORK_NAME, {
    variables: { identifier: frameworkId },
    skip: !frameworkId,
  });
  const frameworkName = frameworkData?.framework?.name;

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setError(null);

    if (!frameworkId && !invitationToken) {
      setError('Registration context not specified');
      return;
    }

    try {
      const { data } = await registerUser({
        variables: {
          input: {
            frameworkId: frameworkId || null,
            invitationToken,
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
      void authClient.signIn.social({
        provider: KAUSAL_PROVIDER_ID,
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
        <Paper
          component="form"
          onSubmit={(e) => void handleSubmit(e)}
          sx={{
            p: { xs: 3, sm: 4 },
            mt: 2,
            filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.08))',
          }}
        >
          <Box sx={{ width: '100%', mb: 3 }}>
            {logoUrl && (
              <Box sx={{ mb: 3, height: 48, display: 'flex', alignItems: 'center' }}>
                {isLogoBitmap ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt=""
                    style={{ height: '100%', maxWidth: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <SVG
                    src={logoUrl}
                    preserveAspectRatio="xMinYMid meet"
                    style={{ height: '100%', maxWidth: '100%', display: 'block' }}
                  />
                )}
              </Box>
            )}
            <Typography variant="h4" component="h1" gutterBottom>
              Create an account
            </Typography>
            {frameworkName && (
              <Typography
                variant="subtitle1"
                gutterBottom
                sx={{
                  color: 'text.secondary',
                }}
              >
                The account can be used to acces {frameworkName} tool
              </Typography>
            )}
          </Box>
          <Stack spacing={2}>
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
            <Stack direction="row" spacing={2}>
              <Button
                type="button"
                variant="text"
                size="large"
                disabled={loading}
                onClick={() => router.push('/')}
                startIcon={<ArrowLeft />}
                fullWidth
                sx={{ justifyContent: 'flex-start' }}
              >
                Back
              </Button>
              <Button type="submit" variant="contained" size="large" disabled={loading} fullWidth>
                {loading ? 'Creating account...' : 'Create account'}
              </Button>
            </Stack>
            <Typography variant="body2" align="center">
              Already have an account?{' '}
              <Button variant="text" size="small" onClick={() => router.push('/auth/sign-in')}>
                Sign in
              </Button>
            </Typography>
          </Stack>
        </Paper>
      </Box>
    </Container>
  );
}
