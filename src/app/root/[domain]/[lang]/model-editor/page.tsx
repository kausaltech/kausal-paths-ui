'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import {
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
  Typography,
} from '@mui/material';

import { gql } from '@apollo/client';
import { useQuery, useReactiveVar } from '@apollo/client/react';
import {
  ArrowRight,
  Box as BoxIcon,
  CircleFill,
  CloudUpload,
  Database,
  Diagram2,
} from 'react-bootstrap-icons';

import { modelEditorModeVar } from '@/common/cache';
import { useInstance } from '@/common/instance';
import {
  type EditableNodeField,
  type MockNodeEdit,
  mockLastPublishedVar,
  mockNodeEditsVar,
  publishMockEdits,
} from '@/components/model-editor/mockEdits';
import { useSession } from '@/lib/auth-client';

const GET_LANDING_NODE_NAMES = gql`
  query ModelEditorLandingNodes {
    instance {
      id
      nodes {
        id
        name
      }
    }
  }
`;

type LandingNodesQuery = {
  instance: { id: string; nodes: { id: string; name: string }[] };
};

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
  const idx = pathname.indexOf('/model-editor');
  return idx >= 0 ? pathname.slice(0, idx) + '/model-editor' : '/model-editor';
}

type EditedNodeRow = {
  id: string;
  displayName: string;
  originalName: string;
  editedName: string | null;
  editedFields: string[];
};

const FIELD_LABELS: Record<EditableNodeField, string> = {
  name: 'Name',
  shortName: 'Short name',
  description: 'Description',
  color: 'Color',
  isVisible: 'Visibility',
  isOutcome: 'Outcome',
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

export default function ModelEditorLandingPage() {
  const router = useRouter();
  const pathname = usePathname();
  const instance = useInstance();
  const { data: session, isPending } = useSession();
  const nodeEdits = useReactiveVar(mockNodeEditsVar);
  const lastPublished = useReactiveVar(mockLastPublishedVar);
  const editorMode = useReactiveVar(modelEditorModeVar);
  const isDraft = editorMode === 'draft';
  const currentUserName = session?.user?.name ?? session?.user?.email ?? 'Unknown user';

  // Seed a mock "last published" entry so Published mode has something to show
  // before the user has clicked Publish in this session.
  useEffect(() => {
    if (!session?.user) return;
    if (mockLastPublishedVar() !== null) return;
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    mockLastPublishedVar({ at: fourteenDaysAgo, by: currentUserName });
  }, [session?.user, currentUserName]);

  const { data: nodesData } = useQuery<LandingNodesQuery>(GET_LANDING_NODE_NAMES, {
    fetchPolicy: 'cache-first',
    skip: !session?.user,
  });

  const editedRows = useMemo<EditedNodeRow[]>(() => {
    const nodes = nodesData?.instance.nodes ?? [];
    const byId = new Map(nodes.map((n) => [n.id, n.name]));
    const rows: EditedNodeRow[] = [];
    for (const [id, edit] of Object.entries(nodeEdits)) {
      const editedFields = getEditedFieldLabels(edit);
      if (editedFields.length === 0) continue;
      const originalName = byId.get(id) ?? id;
      const editedName = typeof edit.name === 'string' ? edit.name : null;
      rows.push({
        id,
        originalName,
        editedName,
        displayName: editedName ?? originalName,
        editedFields,
      });
    }
    return rows;
  }, [nodeEdits, nodesData]);

  const latestEdit = useMemo(() => {
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
  const hasEdits = editedRows.length > 0;

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
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            mb: isDraft && hasEdits ? 2 : 0,
          }}
        >
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  display: 'flex',
                  color: isDraft ? 'warning.main' : 'success.main',
                }}
              >
                <CircleFill size={12} />
              </Box>
              <Typography variant="h3">{isDraft ? 'Draft' : 'Published'}</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {!isDraft
                ? 'You are viewing the published model. To see the unpublished edits here, toggle Draft mode.'
                : hasEdits
                  ? `${editedRows.length} node${editedRows.length === 1 ? '' : 's'} with unpublished edits.`
                  : 'No unpublished edits.'}
            </Typography>
            {isDraft && latestEdit ? (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mt: 0.5 }}
              >
                Last edited{' '}
                {latestEdit.at.toLocaleString(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}{' '}
                by {latestEdit.by}
              </Typography>
            ) : (
              lastPublished && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', mt: 0.5 }}
                >
                  Last published{' '}
                  {lastPublished.at.toLocaleString(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}{' '}
                  by {lastPublished.by}
                </Typography>
              )
            )}
          </Box>
        </Box>

        {isDraft && hasEdits && (
          <>
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
                  sx={{ borderTop: '1px solid', borderColor: 'divider', py: 1 }}
                >
                  <ListItemText
                    primary={
                      row.editedName !== null && row.editedName !== row.originalName ? (
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}
                        >
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ textDecoration: 'line-through' }}
                          >
                            {row.originalName}
                          </Typography>
                          <ArrowRight size={12} />
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {row.editedName}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {row.displayName}
                        </Typography>
                      )
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
                            sx={{ height: 18, '& .MuiChip-label': { px: 0.75, fontSize: 10 } }}
                          />
                        ))}
                      </Box>
                    }
                    slotProps={{ secondary: { component: 'div' } }}
                  />
                </ListItem>
              ))}
            </List>
            {isDraft && (
              <>
                <Divider sx={{ mt: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<CloudUpload size={14} />}
                    disabled={!hasEdits}
                    onClick={() => publishMockEdits(currentUserName)}
                  >
                    Publish edits
                  </Button>
                </Box>
              </>
            )}
          </>
        )}
      </Paper>
    </Container>
  );
}
