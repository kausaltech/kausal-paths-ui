'use client';

import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { ArrowClockwise, BoxArrowUpRight } from 'react-bootstrap-icons';

import type { MyEditableInstancesQuery } from '@/common/__generated__/graphql';

const GET_MY_EDITABLE_INSTANCES = gql`
  query MyEditableInstances {
    me {
      id
      email
      editableInstances {
        id
        identifier
        name
        themeIdentifier
        frameworkConfig {
          id
          organizationName
          viewUrl
          framework {
            id
            identifier
            name
          }
        }
      }
    }
  }
`;

export default function MyModelsPage() {
  const { data, loading, error, refetch } = useQuery<MyEditableInstancesQuery>(
    GET_MY_EDITABLE_INSTANCES,
    {
      fetchPolicy: 'cache-and-network',
    }
  );

  const instances = data?.me?.editableInstances ?? [];

  return (
    <Container maxWidth="md" sx={{ pt: 16, pb: 6, mx: 0 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="overline" color="text.secondary">
          Account
        </Typography>
        <Typography variant="h1" sx={{ mt: 0.5 }}>
          My models
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          Model instances you can edit.
        </Typography>
      </Box>

      {loading && instances.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={24} />
        </Box>
      ) : error && instances.length === 0 ? (
        // A failed load leaves `instances` empty too, so check `error` first —
        // otherwise a transient outage would masquerade as "no edit access".
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Stack spacing={2} alignItems="flex-start">
            <Typography variant="body1">Couldn&apos;t load your models</Typography>
            <Typography variant="body2" color="text.secondary">
              We couldn&apos;t reach the backend to load the models you can edit. Try again in a
              moment.
            </Typography>
            <Button
              size="small"
              variant="outlined"
              startIcon={<ArrowClockwise size={16} />}
              onClick={() => void refetch()}
            >
              Retry
            </Button>
          </Stack>
        </Paper>
      ) : instances.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="body2" color="text.secondary">
            You don&apos;t have edit access to any model instances yet.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {instances.map((instance) => {
            const framework = instance.frameworkConfig?.framework;
            const orgName = instance.frameworkConfig?.organizationName;
            const viewUrl = instance.frameworkConfig?.viewUrl;
            return (
              <Paper key={instance.id} variant="outlined" sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography variant="h3" sx={{ fontSize: 16 }}>
                        {instance.name}
                      </Typography>
                      {framework && <Chip label={framework.name} size="small" />}
                    </Box>
                    {orgName && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {orgName}
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary">
                      {instance.identifier}
                    </Typography>
                  </Box>
                  {viewUrl && (
                    <Button
                      size="small"
                      variant="outlined"
                      endIcon={<BoxArrowUpRight size={12} />}
                      href={viewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open
                    </Button>
                  )}
                </Box>
              </Paper>
            );
          })}
        </Stack>
      )}
    </Container>
  );
}
