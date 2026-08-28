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

import { type TypedDocumentNode, gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { useTranslations } from 'next-intl';
import { ArrowClockwise, Compass, PencilSquare } from 'react-bootstrap-icons';

import type {
  MyEditableInstancesQuery,
  MyEditableInstancesQueryVariables,
} from '@/common/__generated__/graphql';
import { useInstance } from '@/common/instance';

const GET_MY_EDITABLE_INSTANCES: TypedDocumentNode<
  MyEditableInstancesQuery,
  MyEditableInstancesQueryVariables
> = gql`
  query MyEditableInstances {
    me {
      id
      email
      editableInstances {
        id
        identifier
        name
        siteTitle
        themeIdentifier
        frameworkConfig {
          id
          organizationName
          viewUrl
        }
      }
    }
  }
`;

export default function MyModelsPage() {
  const t = useTranslations('model-editor');
  const currentInstance = useInstance();
  const { data, loading, error, refetch } = useQuery(GET_MY_EDITABLE_INSTANCES, {
    fetchPolicy: 'cache-and-network',
  });

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
            const orgName = instance.frameworkConfig?.organizationName;
            const viewUrl = instance.frameworkConfig?.viewUrl;
            const editUrl = viewUrl ? `${viewUrl.replace(/\/$/, '')}/model` : null;
            const isCurrent = instance.id === currentInstance.id;
            return (
              <Paper key={instance.id} variant="outlined" sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography variant="h3" sx={{ fontSize: 16 }}>
                        {instance.siteTitle}
                      </Typography>
                      {isCurrent && (
                        <Chip
                          label={t('editor-this-model')}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      )}
                    </Box>
                    {orgName && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {orgName}
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.disabled">
                      {instance.identifier}
                    </Typography>
                  </Box>
                  {editUrl && viewUrl && (
                    <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                      {/* Same-tab navigation: entering another model's editor
                          replaces this session's context on purpose. */}
                      <Button
                        size="small"
                        href={editUrl}
                        disabled={isCurrent}
                        startIcon={<PencilSquare size={12} />}
                      >
                        {t('common-edit-model')}
                      </Button>
                      <Button
                        size="small"
                        href={viewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        startIcon={<Compass size={12} />}
                      >
                        {t('common-explore')}
                      </Button>
                    </Box>
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
