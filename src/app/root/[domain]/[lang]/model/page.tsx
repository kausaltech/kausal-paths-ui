'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  List,
  ListItem,
  ListItemText,
  Paper,
  Snackbar,
  Typography,
} from '@mui/material';

import { gql } from '@apollo/client';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client/react';
import {
  ArrowRight,
  Box as BoxIcon,
  CircleFill,
  CloudUpload,
  Database,
  Diagram2,
} from 'react-bootstrap-icons';

import type {
  PublishModelInstanceMutation,
  PublishModelInstanceMutationVariables,
} from '@/common/__generated__/graphql';
import { useInstance } from '@/common/instance';
import {
  type EditableNodeField,
  type MockNodeEdit,
  mockNodeEditsVar,
} from '@/components/model-editor/mockEdits';
import {
  INSTANCE_EDITOR_PUBLISH_STATE,
  PUBLISH_MODEL_INSTANCE,
  draftHeadTokenVar,
  editorPreviewModeVar,
  staleVersionNotificationVar,
} from '@/components/model-editor/queries';
import { useSession } from '@/lib/auth-client';

const GET_LANDING_DATA = gql`
  query ModelEditorLandingData {
    instance {
      id
      nodes {
        id
        name
      }
      editor {
        ...InstanceEditorPublishState
      }
    }
  }
  ${INSTANCE_EDITOR_PUBLISH_STATE}
`;

type LandingDataQuery = {
  instance: {
    id: string;
    nodes: { id: string; name: string }[];
    editor: {
      live: boolean;
      hasUnpublishedChanges: boolean;
      firstPublishedAt: string | null;
      lastPublishedAt: string | null;
      draftHeadToken: string | null;
    } | null;
  };
};

type ToastState = { severity: 'success' | 'error'; message: string } | null;

type LandingCard = {
  title: string;
  description: string;
  href: string;
  Icon: typeof Diagram2;
};

const CARDS: LandingCard[] = [
  {
    title: 'Nodes',
    description: 'Edit the causal graph: nodes, edges, and formulas.',
    href: '/nodes',
    Icon: Diagram2,
  },
  {
    title: 'Datasets',
    description: 'Manage datasets that feed node inputs.',
    href: '/datasets',
    Icon: Database,
  },
  {
    title: 'Dimensions',
    description: 'Define dimensions and their categories.',
    href: '/dimensions',
    Icon: BoxIcon,
  },
];

function getModelEditorBase(pathname: string): string {
  const idx = pathname.indexOf('/model');
  return idx >= 0 ? pathname.slice(0, idx) + '/model' : '/model';
}

type EditedNodeRow = {
  id: string;
  originalName: string;
  editedFields: string[];
};

const FIELD_LABELS: Record<EditableNodeField, string> = {
  shortName: 'Short name',
  description: 'Description',
  nodeGroup: 'Node group',
  actionGroup: 'Action group',
};

function getEditedFieldLabels(edit: MockNodeEdit): string[] {
  const labels: string[] = [];
  for (const key of Object.keys(FIELD_LABELS) as EditableNodeField[]) {
    if (edit[key] !== undefined) labels.push(FIELD_LABELS[key]);
  }
  return labels;
}

function formatDateTime(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function formatRelative(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const deltaSec = Math.round((Date.now() - d.getTime()) / 1000);
  if (deltaSec < 60) return 'just now';
  if (deltaSec < 3600) return `${Math.round(deltaSec / 60)} min ago`;
  if (deltaSec < 86400) return `${Math.round(deltaSec / 3600)} h ago`;
  if (deltaSec < 2592000) return `${Math.round(deltaSec / 86400)} d ago`;
  return null;
}

export default function ModelEditorLandingPage() {
  const router = useRouter();
  const pathname = usePathname();
  const instance = useInstance();
  const { data: session, isPending } = useSession();
  const nodeEdits = useReactiveVar(mockNodeEditsVar);
  const previewMode = useReactiveVar(editorPreviewModeVar);

  const { data } = useQuery<LandingDataQuery>(GET_LANDING_DATA, {
    fetchPolicy: 'cache-and-network',
    skip: !session?.user,
  });

  const [publish, { loading: publishing }] = useMutation<
    PublishModelInstanceMutation,
    PublishModelInstanceMutationVariables
  >(PUBLISH_MODEL_INSTANCE);

  const [toast, setToast] = useState<ToastState>(null);

  const editedRows = useMemo<EditedNodeRow[]>(() => {
    const nodes = data?.instance.nodes ?? [];
    const byId = new Map(nodes.map((n) => [n.id, n.name]));
    const rows: EditedNodeRow[] = [];
    for (const [id, edit] of Object.entries(nodeEdits)) {
      const editedFields = getEditedFieldLabels(edit);
      if (editedFields.length === 0) continue;
      rows.push({ id, originalName: byId.get(id) ?? id, editedFields });
    }
    return rows;
  }, [nodeEdits, data]);

  const latestMockEdit = useMemo(() => {
    let latest: { at: Date; by: string } | null = null;
    for (const edit of Object.values(nodeEdits)) {
      if (!edit.editedAt) continue;
      if (!latest || edit.editedAt > latest.at) {
        latest = { at: edit.editedAt, by: edit.editedBy ?? 'Unknown user' };
      }
    }
    return latest;
  }, [nodeEdits]);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.replace('/auth/sign-in');
    }
  }, [isPending, session, router]);

  // Seed the optimistic-locking token var whenever the query returns a new
  // value — mutations read from this var to gate writes via the backend's
  // StaleVersionError check.
  const currentToken = data?.instance.editor?.draftHeadToken ?? null;
  useEffect(() => {
    draftHeadTokenVar(currentToken);
  }, [currentToken]);

  if (isPending || !session?.user) {
    return (
      <Box
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const base = getModelEditorBase(pathname);
  const editor = data?.instance.editor ?? null;
  const hasUnpublishedChanges = editor?.hasUnpublishedChanges ?? false;
  const hasMockEdits = editedRows.length > 0;
  const lastPublishedLabel = formatDateTime(editor?.lastPublishedAt);
  const lastPublishedRelative = formatRelative(editor?.lastPublishedAt);
  const firstPublishedLabel = formatDateTime(editor?.firstPublishedAt);
  const hasBeenPublished = editor?.firstPublishedAt != null;
  const isDraftView = previewMode === 'DRAFT';
  const badgeLabel = isDraftView ? 'Draft' : 'Published';
  const badgeColor: 'warning' | 'success' = isDraftView ? 'warning' : 'success';
  const indicatorColor = isDraftView
    ? hasUnpublishedChanges
      ? 'warning.main'
      : 'success.main'
    : 'success.main';
  const statusHeading = isDraftView
    ? hasUnpublishedChanges
      ? 'Draft · unpublished changes'
      : hasBeenPublished
        ? 'Draft · up to date with published'
        : 'Draft · never published'
    : hasBeenPublished
      ? 'Viewing published revision'
      : 'Viewing draft (no published revision yet)';
  const statusDescription = isDraftView
    ? hasUnpublishedChanges
      ? 'Edits to this model have not been published yet.'
      : hasBeenPublished
        ? 'The draft has no changes over the published revision.'
        : 'This model has never been published. Public readers see the draft as a bootstrap.'
    : hasBeenPublished
      ? 'Read-only preview of the live revision. Switch to Draft to edit.'
      : 'No published revision exists yet — showing the draft.';

  const handlePublish = async () => {
    try {
      const result = await publish({
        variables: { instanceId: instance.id, version: draftHeadTokenVar() },
        refetchQueries: ['EditorPublishState', 'ModelEditorLandingData'],
      });
      const payload = result.data?.instanceEditor.publishModelInstance;
      if (payload?.__typename === 'OperationInfo') {
        const msg = payload.messages.map((m) => m.message).join('; ') || 'Publish failed';
        setToast({ severity: 'error', message: msg });
        return;
      }
      setToast({ severity: 'success', message: 'Model published.' });
    } catch (err) {
      const isStale =
        CombinedGraphQLErrors.is(err) &&
        err.errors.some((e) => e.extensions?.code === 'stale_version');
      if (isStale) {
        // The top-level StaleVersionNotice snackbar takes over from here.
        staleVersionNotificationVar(true);
        return;
      }
      setToast({ severity: 'error', message: err instanceof Error ? err.message : String(err) });
    }
  };

  return (
    <Container maxWidth="md" sx={{ pt: 16, pb: 6, mx: 0 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="overline" color="text.secondary">
          Model editor
        </Typography>
        <Typography variant="h1" sx={{ mt: 0.5 }}>
          {instance.name}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          {instance.leadParagraph ?? 'Edit the model for this instance.'}
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
          gap: 2,
          mb: 4,
        }}
      >
        {CARDS.map(({ title, description, href, Icon }) => (
          <Card key={href}>
            <CardActionArea component={Link} href={base + href} sx={{ height: '100%' }}>
              <CardContent
                sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, height: '100%' }}
              >
                <Box sx={{ color: 'primary.main' }}>
                  <Icon size={24} />
                </Box>
                <Typography variant="h3">{title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {description}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Box>

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 2,
            mb: hasUnpublishedChanges || !hasBeenPublished ? 2 : 0,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
              <Box sx={{ display: 'flex', color: indicatorColor }}>
                <CircleFill size={12} />
              </Box>
              <Typography variant="h3">{statusHeading}</Typography>
              <Chip
                label={badgeLabel}
                size="small"
                color={badgeColor}
                variant="outlined"
                sx={{ ml: 0.5, height: 20, fontSize: 10, fontWeight: 600 }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {statusDescription}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, mt: 1 }}>
              {lastPublishedLabel ? (
                <Typography variant="caption" color="text.secondary">
                  Last published {lastPublishedLabel}
                  {lastPublishedRelative ? ` (${lastPublishedRelative})` : ''}
                </Typography>
              ) : (
                <Typography variant="caption" color="text.secondary">
                  Never published
                </Typography>
              )}
              {firstPublishedLabel && firstPublishedLabel !== lastPublishedLabel && (
                <Typography variant="caption" color="text.secondary">
                  First published {firstPublishedLabel}
                </Typography>
              )}
            </Box>
          </Box>
          {isDraftView && (hasUnpublishedChanges || !hasBeenPublished) && (
            <Button
              variant="contained"
              color="primary"
              size="small"
              startIcon={<CloudUpload size={14} />}
              disabled={publishing}
              onClick={() => {
                void handlePublish();
              }}
            >
              {publishing ? 'Publishing…' : hasBeenPublished ? 'Publish' : 'Publish first revision'}
            </Button>
          )}
        </Box>

        {hasMockEdits && (
          <>
            <Divider sx={{ mt: 2, mb: 1 }} />
            <Typography variant="caption" sx={{ color: 'info.main', display: 'block', mb: 1 }}>
              Mock preview · edits to short name, description, node group and action group are not
              yet persisted
              {latestMockEdit
                ? ` · last edited ${latestMockEdit.at.toLocaleString(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })} by ${latestMockEdit.by}`
                : ''}
            </Typography>
            <List dense disablePadding>
              {editedRows.map((row) => (
                <ListItem
                  key={row.id}
                  disableGutters
                  secondaryAction={
                    <Button
                      size="small"
                      variant="text"
                      component={Link}
                      href={`${base}/nodes?node=${encodeURIComponent(row.id)}`}
                    >
                      View
                    </Button>
                  }
                  sx={{
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    py: 1,
                    bgcolor: (theme) => `${theme.palette.info.main}14`,
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'info.dark' }}>
                          {row.originalName}
                        </Typography>
                        <ArrowRight size={12} />
                      </Box>
                    }
                    secondary={
                      <Box
                        component="span"
                        sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}
                      >
                        {row.editedFields.map((label) => (
                          <Chip
                            key={label}
                            label={label}
                            size="small"
                            variant="outlined"
                            sx={{
                              height: 18,
                              borderColor: 'info.main',
                              color: 'info.dark',
                              '& .MuiChip-label': { px: 0.75, fontSize: 10 },
                            }}
                          />
                        ))}
                      </Box>
                    }
                    slotProps={{ secondary: { component: 'div' } }}
                  />
                </ListItem>
              ))}
            </List>
          </>
        )}
      </Paper>

      <Snackbar
        open={toast !== null}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={toast?.severity ?? 'success'} onClose={() => setToast(null)}>
          {toast?.message ?? ''}
        </Alert>
      </Snackbar>
    </Container>
  );
}
