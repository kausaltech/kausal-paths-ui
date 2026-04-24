'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { Alert, Box, Button, Container, Stack, TextField, Typography } from '@mui/material';

import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';

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
  const searchParams = useSearchParams();
  const frameworkId = searchParams.get('framework') ?? '';

  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [identifierTouched, setIdentifierTouched] = useState(false);
  const [organizationName, setOrganizationName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ instanceId: string; instanceName: string } | null>(null);

  const [createInstance, { loading }] = useMutation<CreateInstanceData>(CREATE_INSTANCE);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!identifierTouched) {
      setIdentifier(slugify(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

  if (created) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ mt: 8, mb: 4 }}>
          <Alert severity="success" sx={{ mb: 2 }}>
            Instance &ldquo;{created.instanceName}&rdquo; created successfully.
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Create a new instance
        </Typography>
        <Box component="form" onSubmit={(e: React.FormEvent) => void handleSubmit(e)}>
          <Stack spacing={2} sx={{ mt: 2 }}>
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
            <Button type="submit" variant="contained" size="large" disabled={loading} fullWidth>
              {loading ? 'Creating instance...' : 'Create instance'}
            </Button>
          </Stack>
        </Box>
      </Box>
    </Container>
  );
}
