'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Alert, Box, Button, Container, Paper, Stack, TextField, Typography } from '@mui/material';

import { type TypedDocumentNode, gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import { useTranslations } from 'next-intl';
import { ArrowLeft } from 'react-bootstrap-icons';
import SVG from 'react-inlinesvg';

import { useTheme } from '@common/themes';
import { getThemeStaticURL } from '@common/themes/theme';

import type {
  CreateInstanceFrameworkNameQueryVariables,
  CreateInstanceMutationVariables,
} from '@/common/__generated__/graphql';

const FRAMEWORK_NAME: TypedDocumentNode<
  CreateInstanceFrameworkNameData,
  CreateInstanceFrameworkNameQueryVariables
> = gql`
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

const CREATE_INSTANCE: TypedDocumentNode<CreateInstanceData, CreateInstanceMutationVariables> = gql`
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
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Generate a short, URL-safe random suffix to ensure identifier uniqueness.
function randomSuffix(length = 6): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}

// Build a unique identifier from the framework and the user-provided name,
// hidden from the user: {framework}-{slugified-name}-{hash}
function generateIdentifier(frameworkId: string, name: string): string {
  const parts = [slugify(frameworkId), slugify(name), randomSuffix()].filter(Boolean);
  return parts.join('-');
}

// Render field labels above the input instead of in the outline notch, so
// focus styling drawn around the input cannot overlap the label text.
const textFieldSlotProps = {
  inputLabel: {
    shrink: true,
    sx: {
      position: 'relative',
      transform: 'none',
      maxWidth: 'none',
      mb: 0.5,
      fontSize: '0.875rem',
      fontWeight: 500,
    },
  },
  input: { notched: false },
} as const;

export default function CreateInstancePage() {
  const t = useTranslations('common');
  const theme = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const frameworkId = searchParams.get('framework') ?? '';
  const logoUrl = theme.themeLogoUrl ? getThemeStaticURL(theme.themeLogoUrl) : null;
  const isLogoBitmap = theme.themeLogoUrl?.endsWith('.png');

  const [name, setName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ instanceId: string; instanceName: string } | null>(null);

  const [createInstance, { loading }] = useMutation(CREATE_INSTANCE);

  const { data: frameworkData } = useQuery(FRAMEWORK_NAME, {
    variables: { identifier: frameworkId },
    skip: !frameworkId,
  });
  const frameworkName = frameworkData?.framework?.name;

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setError(null);

    if (!frameworkId) {
      setError(t('error-framework-not-specified'));
      return;
    }

    try {
      const { data } = await createInstance({
        variables: {
          input: {
            frameworkId,
            name,
            identifier: generateIdentifier(frameworkId, name),
            organizationName,
          },
        },
      });

      if (!data || isOperationError(data.createInstance)) {
        const messages = data
          ? (data.createInstance as { messages: { message: string }[] }).messages
          : [];
        setError(messages.map((m) => m.message).join(', ') || t('create-model-failed'));
        return;
      }

      setCreated(data.createInstance satisfies { instanceId: string; instanceName: string });
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(t('error-unexpected'));
      }
    }
  };

  const isSuccess = !!created;
  const newInstanceName = created?.instanceName || t('my-model');

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
              {isSuccess ? t('create-model-all-set') : t('create-new-model')}
            </Typography>
            {!isSuccess && frameworkName && (
              <Typography
                variant="subtitle1"
                gutterBottom
                sx={{
                  color: 'text.secondary',
                }}
              >
                {t('create-model-using-framework', { framework: frameworkName })}
              </Typography>
            )}
          </Box>
          {isSuccess ? (
            <Stack spacing={2}>
              <Alert severity="success">
                {t('create-model-success', { name: newInstanceName })}
              </Alert>
              <Button variant="contained" size="large" onClick={() => router.push('/')} fullWidth>
                {t('return-to-front')}
              </Button>
            </Stack>
          ) : (
            <Box component="form" onSubmit={(e) => void handleSubmit(e)}>
              <Stack spacing={2}>
                <TextField
                  label={t('create-model-name-label')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  fullWidth
                  autoFocus
                  helperText={t('create-model-name-helper')}
                  slotProps={textFieldSlotProps}
                />
                <TextField
                  label={t('create-model-org-label')}
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  required
                  fullWidth
                  helperText={t('create-model-org-helper')}
                  slotProps={textFieldSlotProps}
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
                    {t('back')}
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    loading={loading}
                    loadingPosition="start"
                    fullWidth
                  >
                    {loading ? t('create-model-creating') : t('create-model-submit')}
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
