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
  Collapse,
  Container,
  Divider,
  List,
  ListItem,
  ListItemText,
  Paper,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';

import { gql } from '@apollo/client';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client/react';
import { useTranslations } from 'next-intl';
import {
  ArrowRight,
  Box as BoxIcon,
  CaretDownFill,
  CaretRightFill,
  CircleFill,
  CloudUpload,
  Database,
  Diagram2,
  House,
  People,
} from 'react-bootstrap-icons';

import type {
  PublishModelInstanceMutation,
  PublishModelInstanceMutationVariables,
} from '@/common/__generated__/graphql';
import { useInstance } from '@/common/instance';
import { constraintViolationsVar } from '@/components/model-editor/constraintViolations';
import {
  type EditableNodeField,
  type MockNodeEdit,
  mockNodeEditsVar,
} from '@/components/model-editor/mockEdits';
import { getModelEditorBase } from '@/components/model-editor/paths';
import {
  INSTANCE_EDITOR_PUBLISH_STATE,
  PUBLISH_MODEL_INSTANCE,
  draftHeadTokenVar,
  editorPreviewModeVar,
  staleVersionNotificationVar,
} from '@/components/model-editor/queries';
import { useEditorDateFormat } from '@/components/model-editor/useEditorDateFormat';

const GET_LANDING_DATA = gql`
  query ModelEditorLandingData {
    instance {
      id
      siteTitle
      users {
        user {
          id
        }
      }
      nodes {
        id
        uuid
        name
      }
      editor {
        ...InstanceEditorPublishState
        # Most recent draft edit, shown while the model has no published
        # revision yet.
        latestChange: changeHistory(limit: 1) {
          uuid
          createdAt
        }
        # Structural conflicts in the draft; publishing is blocked while any
        # exist, so surface them before the user hits the button.
        constraintConflicts {
          code
          message
          origins {
            nodeUuid
          }
          value {
            nodeUuid
          }
        }
      }
    }
    scenarios {
      id
      identifier
      name
      isDefault
      allActionsEnabled
    }
    parameters {
      __typename
      id
      label
      ... on BoolParameterType {
        boolDefault: defaultValue
      }
      ... on NumberParameterType {
        numberDefault: defaultValue
        unit {
          id
          short
        }
      }
      ... on StringParameterType {
        stringDefault: defaultValue
      }
    }
  }
  ${INSTANCE_EDITOR_PUBLISH_STATE}
`;

type LandingConflict = {
  code: string;
  message: string;
  origins: { nodeUuid: string | null }[];
  value: { nodeUuid: string | null } | null;
};

type LandingScenario = {
  id: string;
  identifier: string;
  name: string;
  isDefault: boolean;
  allActionsEnabled: boolean;
};

type LandingParameter = {
  __typename: string;
  id: string;
  label: string | null;
  boolDefault?: boolean | null;
  numberDefault?: number | null;
  unit?: { short: string } | null;
  stringDefault?: string | null;
};

function formatParameterDefault(p: LandingParameter): string {
  switch (p.__typename) {
    case 'BoolParameterType':
      return p.boolDefault == null ? '—' : String(p.boolDefault);
    case 'NumberParameterType':
      return p.numberDefault == null
        ? '—'
        : `${p.numberDefault}${p.unit?.short ? ` ${p.unit.short}` : ''}`;
    case 'StringParameterType':
      return p.stringDefault ?? '—';
    default:
      return '—';
  }
}

type LandingDataQuery = {
  instance: {
    id: string;
    siteTitle: string;
    users: { user: { id: string } }[];
    nodes: { id: string; uuid: string; name: string }[];
    editor: {
      live: boolean;
      hasUnpublishedChanges: boolean;
      firstPublishedAt: string | null;
      lastPublishedAt: string | null;
      draftHeadToken: string | null;
      latestChange: { uuid: string; createdAt: string }[];
      constraintConflicts: LandingConflict[];
    } | null;
  };
  scenarios: LandingScenario[];
  parameters: LandingParameter[];
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

function PropertyRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'baseline' }}>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 180, flexShrink: 0 }}>
        {label}
      </Typography>
      <Box sx={{ minWidth: 0 }}>{children}</Box>
    </Box>
  );
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
  const df = useEditorDateFormat();
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
  const [conflictsOpen, setConflictsOpen] = useState(false);

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
  // Structural conflicts block publishing server-side; resolve the nodes
  // each conflict points at so the list reads by name, not UUID. Until the
  // check result has arrived, treat publishability as unknown — the button
  // must not be enabled on the optimistic default.
  const conflictsKnown = editor?.constraintConflicts != null;
  const blockingConflicts = editor?.constraintConflicts ?? [];
  const nodeNameByUuid = useMemo(
    () => new Map((data?.instance.nodes ?? []).map((n) => [n.uuid, n.name])),
    [data]
  );
  // The root `parameters` query returns only the instance-level (global)
  // parameters that are visible — node-scoped ones are never included, so no
  // filtering is needed here.
  const globalParameters = data?.parameters ?? [];
  const conflictNodeNames = (conflict: LandingConflict): string[] => {
    const uuids = [...conflict.origins.map((o) => o.nodeUuid), conflict.value?.nodeUuid ?? null];
    return [...new Set(uuids.filter((u): u is string => u != null))]
      .map((u) => nodeNameByUuid.get(u))
      .filter((n): n is string => n != null);
  };
  const hasMockEdits = editedRows.length > 0;
  const lastPublishedLabel = editor?.lastPublishedAt ? df.dateTime(editor.lastPublishedAt) : null;
  const lastPublishedRelative = formatRelative(editor?.lastPublishedAt, t);
  // Shown instead of a publish timestamp while nothing has been published.
  const latestEditAt = editor?.latestChange?.[0]?.createdAt ?? null;
  const latestEditLabel = latestEditAt ? df.dateTime(latestEditAt) : null;
  const latestEditRelative = formatRelative(latestEditAt, t);
  const firstPublishedLabel = editor?.firstPublishedAt
    ? df.dateTime(editor.firstPublishedAt)
    : null;
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
      if (payload?.__typename === 'ConstraintViolations') {
        // Publishing is blocked while the draft has structural conflicts;
        // the top-level ConstraintViolationsNotice lists them.
        constraintViolationsVar(payload.conflicts);
        return;
      }
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
        <Stack direction="row" alignItems="center" spacing={1}>
          <House size={22} />
          <Typography variant="h5">{t('editor-nav-model')}</Typography>
        </Stack>
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
              ) : latestEditLabel ? (
                <Typography variant="caption" color="text.secondary">
                  {latestEditRelative
                    ? t('editor-last-edited-with-relative', {
                        date: latestEditLabel,
                        relative: latestEditRelative,
                      })
                    : t('editor-last-edited', { date: latestEditLabel })}
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
              disabled={publishing || !conflictsKnown || blockingConflicts.length > 0}
              onClick={() => {
                void handlePublish();
              }}
            >
              {publishing
                ? t('common-publishing')
                : !conflictsKnown
                  ? t('editor-checking-conflicts')
                  : hasBeenPublished
                    ? t('common-publish')
                    : t('common-publish-first-revision')}
            </Button>
          )}
        </Box>

        {isDraftView && blockingConflicts.length > 0 && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Box
              onClick={() => setConflictsOpen((v) => !v)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              {conflictsOpen ? <CaretDownFill size={11} /> : <CaretRightFill size={11} />}
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {t('editor-publish-blocked-conflicts', { count: blockingConflicts.length })}
              </Typography>
            </Box>
            <Collapse in={conflictsOpen}>
              <Box component="ul" sx={{ m: 0, mt: 0.5, pl: 2.5 }}>
                {blockingConflicts.map((conflict, i) => {
                  const names = conflictNodeNames(conflict);
                  return (
                    <Box component="li" key={i}>
                      <Typography variant="body2" sx={{ fontSize: 13 }}>
                        {conflict.message}
                      </Typography>
                      {names.length > 0 && (
                        <Typography variant="caption" color="text.secondary">
                          {names.join(', ')}
                        </Typography>
                      )}
                    </Box>
                  );
                })}
              </Box>
            </Collapse>
          </Alert>
        )}

        {hasMockEdits && (
          <>
            <Divider sx={{ mt: 2, mb: 1 }} />
            <Typography variant="caption" sx={{ color: 'info.main', display: 'block', mb: 1 }}>
              {t('editor-mock-preview')}
              {latestMockEdit
                ? t('editor-mock-preview-last-edited', {
                    date: df.dateTime(latestMockEdit.at),
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

      {/* General model properties from the instance configuration. Read-only
          for now; this box is where they'll become editable. */}
      <Paper variant="outlined" sx={{ p: 3, mt: 3 }}>
        <Typography variant="h3" sx={{ fontSize: 18, mb: 0.5 }}>
          {t('editor-model-properties')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('editor-model-properties-hint')}
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <PropertyRow label={t('editor-prop-name')}>
            <Typography variant="body2">{instance.name}</Typography>
          </PropertyRow>
          <PropertyRow label={t('editor-prop-framework')}>
            <Typography variant="body2">
              {instance.frameworkConfig?.framework?.name ?? '—'}
            </Typography>
          </PropertyRow>
          <PropertyRow label={t('editor-prop-owner')}>
            <Typography variant="body2">{instance.owner ?? '—'}</Typography>
          </PropertyRow>
          <PropertyRow label={t('editor-prop-reference-year')}>
            <Typography variant="body2">{instance.referenceYear ?? '—'}</Typography>
          </PropertyRow>
          <PropertyRow label={t('editor-prop-historical-range')}>
            <Typography variant="body2">
              {instance.minimumHistoricalYear}–{instance.maximumHistoricalYear ?? '—'}
            </Typography>
          </PropertyRow>
          <PropertyRow label={t('editor-prop-model-end-year')}>
            <Typography variant="body2">{instance.modelEndYear}</Typography>
          </PropertyRow>
          <PropertyRow label={t('editor-prop-target-year')}>
            <Typography variant="body2">{instance.targetYear ?? '—'}</Typography>
          </PropertyRow>
          <PropertyRow label={t('editor-prop-languages')}>
            <Typography variant="body2">
              {/* Bold marks the default language. */}
              <Box component="span" sx={{ fontWeight: 600 }}>
                {instance.defaultLanguage}
              </Box>
              {instance.supportedLanguages
                .filter((l) => l !== instance.defaultLanguage)
                .map((l) => `, ${l}`)
                .join('')}
            </Typography>
          </PropertyRow>
          <PropertyRow label={t('editor-prop-scenarios')}>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {(data?.scenarios ?? []).length === 0 && <Typography variant="body2">—</Typography>}
              {(data?.scenarios ?? []).map((scenario) => (
                <Chip
                  key={scenario.id}
                  label={
                    scenario.isDefault
                      ? `${scenario.name} (${t('editor-prop-default-marker')})`
                      : scenario.name
                  }
                  size="small"
                  variant="outlined"
                  color={scenario.isDefault ? 'primary' : 'default'}
                  title={scenario.identifier}
                />
              ))}
            </Box>
          </PropertyRow>
          <PropertyRow label={t('editor-prop-parameters')}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
              {globalParameters.map((p) => (
                <Typography key={p.id} variant="body2" title={p.id}>
                  {p.label ?? p.id}:{' '}
                  <Box component="span" sx={{ color: 'text.secondary' }}>
                    {formatParameterDefault(p)}
                  </Box>
                </Typography>
              ))}
              {globalParameters.length === 0 && <Typography variant="body2">—</Typography>}
            </Box>
          </PropertyRow>
          <PropertyRow label={t('editor-prop-users')}>
            <Typography variant="body2">
              {data?.instance.users.length ?? '—'}
              {' · '}
              <Typography
                component={Link}
                href={`${base}/users`}
                variant="body2"
                sx={{ color: 'primary.main' }}
              >
                {t('editor-prop-manage-access')}
              </Typography>
            </Typography>
          </PropertyRow>
        </Box>
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
