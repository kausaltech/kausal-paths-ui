'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Alert, Box, Button, Container, Paper, Stack, TextField, Typography } from '@mui/material';

import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import { ArrowLeft } from 'react-bootstrap-icons';
import SVG from 'react-inlinesvg';

import { useTheme } from '@common/themes';
import { getThemeStaticURL } from '@common/themes/theme';

const FRAMEWORK_NAME = gql`
  query CreateInstanceFrameworkName($identifier: ID!) {
    framework(identifier: $identifier) {
      id
      name
    }
  }
`;

type CreateInstanceFrameworkNameData = {
  framework: { id: string; name: string } | null;
};

const CREATE_INSTANCE = gql`
  mutation CreateInstance($input: CreateInstanceInput!) {
    createInstance(input: $input) {
      ... on CreateInstanceResult {
        instanceId
        instanceName
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

type CreateInstanceData = {
  createInstance:
    | { instanceId: string; instanceName: string }
    | { messages: { kind: string; message: string; field?: string }[] };
};

function isOperationError(
  result: CreateInstanceData['createInstance']
): result is { messages: { kind: string; message: string; field?: string }[] } {
  return 'messages' in result;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-');
}

export default function CreateInstancePage() {
  const theme = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const frameworkId = searchParams.get('framework') ?? '';
  const logoUrl = theme.themeLogoUrl ? getThemeStaticURL(theme.themeLogoUrl) : null;
  const isLogoBitmap = theme.themeLogoUrl?.endsWith('.png');

  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [identifierTouched, setIdentifierTouched] = useState(false);
  const [organizationName, setOrganizationName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ instanceId: string; instanceName: string } | null>(null);

  const [createInstance, { loading }] = useMutation<CreateInstanceData>(CREATE_INSTANCE);

  const { data: frameworkData } = useQuery<CreateInstanceFrameworkNameData>(FRAMEWORK_NAME, {
    variables: { identifier: frameworkId },
    skip: !frameworkId,
  });
  const frameworkName = frameworkData?.framework?.name;

  const handleNameChange = (value: string) => {
    setName(value);
    if (!identifierTouched) {
      setIdentifier(slugify(value));
    }
  };

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setError(null);

    if (!frameworkId) {
      setError('Framework not specified');
      return;
    }

    try {
      const { data } = await createInstance({
        variables: {
          input: {
            frameworkId,
            name,
            identifier,
            organizationName,
          },
        },
      });

      if (!data || isOperationError(data.createInstance)) {
        const messages = data
          ? (data.createInstance as { messages: { message: string }[] }).messages
          : [];
        setError(messages.map((m) => m.message).join(', ') || 'Instance creation failed');
        return;
      }

      setCreated(data.createInstance as { instanceId: string; instanceName: string });
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    }
  };

  const isSuccess = !!created;
  const newInstanceName = created?.instanceName || 'My instance';

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
              {isSuccess ? 'All set!' : 'Create a new instance'}
            </Typography>
            {!isSuccess && frameworkName && (
              <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                Using {frameworkName} framework
              </Typography>
            )}
          </Box>
          {isSuccess ? (
            <Stack spacing={2}>
              <Alert severity="success">
                Instance &ldquo;{newInstanceName}&rdquo; created successfully.
              </Alert>
              <Button variant="contained" size="large" onClick={() => router.push('/')} fullWidth>
                Return to front page
              </Button>
            </Stack>
          ) : (
            <Box component="form" onSubmit={(e) => void handleSubmit(e)}>
              <Stack spacing={2}>
                <TextField
                  label="Instance name"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                  fullWidth
                  autoFocus
                  helperText="A descriptive name for your instance, e.g. your city name"
                />
                <TextField
                  label="Identifier"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    setIdentifierTouched(true);
                  }}
                  required
                  fullWidth
                  helperText="A unique URL-safe identifier (auto-generated from the name)"
                />
                <TextField
                  label="Organization name"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  required
                  fullWidth
                  helperText="The organization responsible for this instance"
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
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    loading={loading}
                    loadingPosition="start"
                    fullWidth
                  >
                    {loading ? 'Creating a new instance...' : 'Create instance'}
                  </Button>
                </Stack>
              </Stack>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
}
