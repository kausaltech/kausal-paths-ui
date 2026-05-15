'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
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
import { useTranslations } from 'next-intl';
import {
  ArrowRight,
  Box as BoxIcon,
  CircleFill,
  CloudUpload,
  Database,
  Diagram2,
  People,
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

const CARD_DEFS = [
  {
    titleKey: 'editor-cards-nodes',
    descKey: 'editor-cards-nodes-desc',
    href: '/nodes',
    Icon: Diagram2,
  },
  {
    titleKey: 'editor-cards-datasets',
    descKey: 'editor-cards-datasets-desc',
    href: '/datasets',
    Icon: Database,
  },
  {
    titleKey: 'editor-cards-dimensions',
    descKey: 'editor-cards-dimensions-desc',
    href: '/dimensions',
    Icon: BoxIcon,
  },
] as const;

function getModelEditorBase(pathname: string): string {
  const idx = pathname.indexOf('/model');
  return idx >= 0 ? pathname.slice(0, idx) + '/model' : '/model';
}

type EditedNodeRow = {
  id: string;
  originalName: string;
  editedFields: string[];
};

const FIELD_LABEL_KEYS = {
  shortDescription: 'editor-field-short-description',
  actionGroup: 'editor-field-action-group',
} as const satisfies Record<EditableNodeField, string>;

function getEditedFieldLabels(edit: MockNodeEdit, t: ReturnType<typeof useTranslations>): string[] {
  const labels: string[] = [];
  for (const key of Object.keys(FIELD_LABEL_KEYS) as EditableNodeField[]) {
    if (edit[key] !== undefined) labels.push(t(FIELD_LABEL_KEYS[key]));
  }
  return labels;
}

function formatDateTime(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function formatRelative(
  iso: string | null | undefined,
  t: ReturnType<typeof useTranslations>
): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const deltaSec = Math.round((Date.now() - d.getTime()) / 1000);
  if (deltaSec < 60) return t('editor-relative-just-now');
  if (deltaSec < 3600)
    return t('editor-relative-minutes-ago', { count: Math.round(deltaSec / 60) });
  if (deltaSec < 86400)
    return t('editor-relative-hours-ago', { count: Math.round(deltaSec / 3600) });
  if (deltaSec < 2592000)
    return t('editor-relative-days-ago', { count: Math.round(deltaSec / 86400) });
  return null;
}

export default function ModelEditorLandingPage() {
  const t = useTranslations('model-editor');
  const pathname = usePathname();
  const instance = useInstance();
  const nodeEdits = useReactiveVar(mockNodeEditsVar);
  const previewMode = useReactiveVar(editorPreviewModeVar);

  const { data } = useQuery<LandingDataQuery>(GET_LANDING_DATA, {
    fetchPolicy: 'cache-and-network',
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
      const editedFields = getEditedFieldLabels(edit, t);
      if (editedFields.length === 0) continue;
      rows.push({ id, originalName: byId.get(id) ?? id, editedFields });
    }
    return rows;
  }, [nodeEdits, data, t]);

  const latestMockEdit = useMemo(() => {
    let latest: { at: Date; by: string } | null = null;
    for (const edit of Object.values(nodeEdits)) {
      if (!edit.editedAt) continue;
      if (!latest || edit.editedAt > latest.at) {
        latest = { at: edit.editedAt, by: edit.editedBy ?? t('common-unknown-user') };
      }
    }
    return latest;
  }, [nodeEdits, t]);

  // Seed the optimistic-locking token var whenever the query returns a new
  // value — mutations read from this var to gate writes via the backend's
  // StaleVersionError check.
  const currentToken = data?.instance.editor?.draftHeadToken ?? null;
  useEffect(() => {
    draftHeadTokenVar(currentToken);
  }, [currentToken]);

  const base = getModelEditorBase(pathname);
  const editor = data?.instance.editor ?? null;
  const hasUnpublishedChanges = editor?.hasUnpublishedChanges ?? false;
  const hasMockEdits = editedRows.length > 0;
  const lastPublishedLabel = formatDateTime(editor?.lastPublishedAt);
  const lastPublishedRelative = formatRelative(editor?.lastPublishedAt, t);
  const firstPublishedLabel = formatDateTime(editor?.firstPublishedAt);
  const hasBeenPublished = editor?.firstPublishedAt != null;
  const isDraftView = previewMode === 'DRAFT';
  const badgeLabel = isDraftView ? t('editor-draft') : t('editor-published');
  const badgeColor: 'warning' | 'success' = isDraftView ? 'warning' : 'success';
  const indicatorColor = isDraftView
    ? hasUnpublishedChanges
      ? 'warning.main'
      : 'success.main'
    : 'success.main';
  const statusHeading = isDraftView
    ? hasUnpublishedChanges
      ? t('editor-draft-unpublished')
      : hasBeenPublished
        ? t('editor-draft-up-to-date')
        : t('editor-draft-never-published')
    : hasBeenPublished
      ? t('editor-published-revision')
      : t('editor-published-no-revision');
  const statusDescription = isDraftView
    ? hasUnpublishedChanges
      ? t('editor-unpublished-changes')
      : hasBeenPublished
        ? t('editor-draft-no-changes')
        : t('editor-never-published-bootstrap')
    : hasBeenPublished
      ? t('editor-read-only-desc')
      : t('editor-no-published-revision');

  const handlePublish = async () => {
    try {
      const result = await publish({
        variables: { instanceId: instance.id, version: draftHeadTokenVar() },
        refetchQueries: ['EditorPublishState', 'ModelEditorLandingData'],
      });
      const payload = result.data?.instanceEditor.publishModelInstance;
      if (payload?.__typename === 'OperationInfo') {
        const msg =
          payload.messages.map((m) => m.message).join('; ') || t('editor-model-publish-failed');
        setToast({ severity: 'error', message: msg });
        return;
      }
      setToast({ severity: 'success', message: t('editor-model-published-ok') });
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
          {t('editor-model-landing')}
        </Typography>
        <Typography variant="h1" sx={{ mt: 0.5 }}>
          {instance.name}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          {instance.leadParagraph ?? t('editor-edit-the-model')}
        </Typography>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Button
          variant="outlined"
          component={Link}
          href={`${base}/users`}
          startIcon={<People size={14} />}
        >
          {t('editor-manage-access')}
        </Button>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
          gap: 2,
          mb: 4,
        }}
      >
        {CARD_DEFS.map(({ titleKey, descKey, href, Icon }) => (
          <Card key={href}>
            <CardActionArea component={Link} href={base + href} sx={{ height: '100%' }}>
              <CardContent
                sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, height: '100%' }}
              >
                <Box sx={{ color: 'primary.main' }}>
                  <Icon size={24} />
                </Box>
                <Typography variant="h3">{t(titleKey)}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {t(descKey)}
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
                  {lastPublishedRelative
                    ? t('editor-last-published-with-relative', {
                        date: lastPublishedLabel,
                        relative: lastPublishedRelative,
                      })
                    : t('editor-last-published', { date: lastPublishedLabel })}
                </Typography>
              ) : (
                <Typography variant="caption" color="text.secondary">
                  {t('editor-never-published')}
                </Typography>
              )}
              {firstPublishedLabel && firstPublishedLabel !== lastPublishedLabel && (
                <Typography variant="caption" color="text.secondary">
                  {t('editor-first-published', { date: firstPublishedLabel })}
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
              {publishing
                ? t('common-publishing')
                : hasBeenPublished
                  ? t('common-publish')
                  : t('common-publish-first-revision')}
            </Button>
          )}
        </Box>

        {hasMockEdits && (
          <>
            <Divider sx={{ mt: 2, mb: 1 }} />
            <Typography variant="caption" sx={{ color: 'info.main', display: 'block', mb: 1 }}>
              {t('editor-mock-preview')}
              {latestMockEdit
                ? t('editor-mock-preview-last-edited', {
                    date: latestMockEdit.at.toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    }),
                    name: latestMockEdit.by,
                  })
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
                      {t('common-view')}
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
