'use client';

import { type ComponentType, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { ArrowDropDown } from '@mui/icons-material';
import {
  Box,
  Button,
  Divider,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Link as MuiLink,
  Paper,
  Select,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

import { gql } from '@apollo/client';
import { useQuery, useReactiveVar } from '@apollo/client/react';
import {
  Box as BoxIcon,
  BroadcastPin,
  Database,
  Diagram2,
  Funnel,
  FunnelFill,
  House,
  PencilSquare,
  Search,
} from 'react-bootstrap-icons';

import { modelEditorModeVar, nodeFiltersOpenVar, nodeFiltersVar } from '@/common/cache';
import { useInstance } from '@/common/instance';

const GET_NODE_SEARCH_LIST = gql`
  query EditorNodeSearchList {
    instance {
      id
      nodes {
        id
        name
        ... on Node {
          isOutcome
        }
      }
    }
  }
`;

const GET_DATASET_SEARCH_LIST = gql`
  query EditorDatasetSearchList {
    instance {
      id
      editor {
        datasets {
          id
          identifier
          name
        }
      }
    }
  }
`;

const GET_DIMENSION_SEARCH_LIST = gql`
  query EditorDimensionSearchList {
    instance {
      id
      editor {
        dimensions {
          id
          identifier
          name
        }
      }
    }
  }
`;

type SearchItem = { id: string; name: string };

type NodeSearchItem = SearchItem & { __typename?: string; isOutcome?: boolean };

type NodeSearchListQuery = {
  instance: { id: string; nodes: NodeSearchItem[] };
};

type DatasetSearchListQuery = {
  instance: { id: string; editor: { datasets: SearchItem[] } | null };
};

type DimensionSearchListQuery = {
  instance: { id: string; editor: { dimensions: SearchItem[] } | null };
};

type TabDef = {
  label: string;
  matches: (path: string) => boolean;
  href: string;
  Icon: ComponentType<{ size?: number }>;
};

const TABS: TabDef[] = [
  {
    label: 'Model',
    matches: (path) =>
      !path.includes('/model-editor/nodes') &&
      !path.includes('/model-editor/datasets') &&
      !path.includes('/model-editor/dimensions'),
    href: '',
    Icon: House,
  },
  {
    label: 'Nodes',
    matches: (path) => path.includes('/model-editor/nodes'),
    href: '/nodes',
    Icon: Diagram2,
  },
  {
    label: 'Datasets',
    matches: (path) => path.includes('/model-editor/datasets'),
    href: '/datasets',
    Icon: Database,
  },
  {
    label: 'Dimensions',
    matches: (path) => path.includes('/model-editor/dimensions'),
    href: '/dimensions',
    Icon: BoxIcon,
  },
];

function getModelEditorBase(pathname: string): string {
  const idx = pathname.indexOf('/model-editor');
  return idx >= 0 ? pathname.slice(0, idx) + '/model-editor' : '/model-editor';
}

type SearchMode = 'nodes' | 'datasets' | 'dimensions';

function getSearchMode(pathname: string): SearchMode {
  if (pathname.includes('/model-editor/datasets')) return 'datasets';
  if (pathname.includes('/model-editor/dimensions')) return 'dimensions';
  return 'nodes';
}

const PLACEHOLDERS: Record<SearchMode, string> = {
  nodes: 'Search nodes…',
  datasets: 'Search datasets…',
  dimensions: 'Search dimensions…',
};

const MAX_RESULTS = 10;
const ALL_OUTCOMES_VALUE = '__all__';

export default function ModelEditorNav() {
  const pathname = usePathname();
  const router = useRouter();
  const instance = useInstance();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [query, setQuery] = useState('');
  const base = getModelEditorBase(pathname);
  const activeTab = TABS.find((t) => t.matches(pathname)) ?? TABS[0];
  const mode = getSearchMode(pathname);
  const isLanding = activeTab.label === 'Model';

  const filters = useReactiveVar(nodeFiltersVar);
  const filtersOpen = useReactiveVar(nodeFiltersOpenVar);
  const editorMode = useReactiveVar(modelEditorModeVar);

  const { data: nodesData } = useQuery<NodeSearchListQuery>(GET_NODE_SEARCH_LIST, {
    skip: mode !== 'nodes',
    fetchPolicy: 'cache-first',
  });
  const { data: datasetsData } = useQuery<DatasetSearchListQuery>(GET_DATASET_SEARCH_LIST, {
    skip: mode !== 'datasets',
    fetchPolicy: 'cache-first',
  });
  const { data: dimensionsData } = useQuery<DimensionSearchListQuery>(GET_DIMENSION_SEARCH_LIST, {
    skip: mode !== 'dimensions',
    fetchPolicy: 'cache-first',
  });

  const items: SearchItem[] = useMemo(() => {
    if (mode === 'nodes') return nodesData?.instance.nodes ?? [];
    if (mode === 'datasets') return datasetsData?.instance.editor?.datasets ?? [];
    return dimensionsData?.instance.editor?.dimensions ?? [];
  }, [mode, nodesData, datasetsData, dimensionsData]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return items.filter((n) => n.name.toLowerCase().includes(q)).slice(0, MAX_RESULTS);
  }, [query, items]);

  const outcomeNodes = useMemo<SearchItem[]>(() => {
    const nodes = nodesData?.instance.nodes ?? [];
    return nodes.filter((n) => n.isOutcome);
  }, [nodesData]);

  const filtersAvailable = mode === 'nodes' && outcomeNodes.length > 1;
  const showFilterToggle = mode === 'nodes';
  const showFilters = filtersAvailable && filtersOpen;
  const hasActiveFilters = filters.outcomeId !== null;

  const handleSelect = (itemId: string) => {
    setQuery('');
    if (mode === 'nodes') {
      router.push(`${base}/nodes?node=${encodeURIComponent(itemId)}`);
    } else if (mode === 'datasets') {
      router.push(`${base}/datasets/${encodeURIComponent(itemId)}`);
    } else {
      router.push(`${base}/dimensions/${encodeURIComponent(itemId)}`);
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'absolute',
        top: 12,
        left: 12,
        zIndex: (theme) => theme.zIndex.appBar,
        borderRadius: 1,
        width: 360,
      }}
    >
      <Tooltip
        title={
          editorMode === 'draft'
            ? 'Viewing draft with unpublished edits. Toggle off to view published model.'
            : 'Viewing published model. Toggle on to view draft with unpublished edits.'
        }
        placement="right"
      >
        <Box
          component="label"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            px: 1,
            py: 0.5,
            cursor: 'pointer',
            userSelect: 'none',
            color: editorMode === 'draft' ? 'warning.main' : 'success.main',
          }}
        >
          <Switch
            checked={editorMode === 'draft'}
            onChange={(_, checked) => modelEditorModeVar(checked ? 'draft' : 'published')}
            size="small"
            color={editorMode === 'draft' ? 'warning' : 'success'}
          />
          {editorMode === 'draft' ? <PencilSquare size={12} /> : <BroadcastPin size={12} />}
          <Typography variant="overline" sx={{ color: 'inherit', fontWeight: 600, lineHeight: 1 }}>
            {editorMode === 'draft' ? 'Draft' : 'Published'}
          </Typography>
        </Box>
      </Tooltip>

      <Divider />

      <Box sx={{ display: 'flex', alignItems: 'stretch' }}>
        <MuiLink
          component={Link}
          href={base}
          underline="none"
          color="inherit"
          sx={{
            display: 'flex',
            alignItems: 'center',
            px: 1.5,
            fontWeight: 600,
            fontSize: (theme) => theme.typography.subtitle2.fontSize,
            '&:hover': { color: 'primary.main' },
          }}
        >
          {instance.name}
        </MuiLink>
        <Divider orientation="vertical" flexItem />
        <Button
          size="small"
          color="inherit"
          onClick={(e) => setAnchorEl(e.currentTarget)}
          startIcon={<activeTab.Icon size={16} />}
          endIcon={<ArrowDropDown />}
          sx={{ textTransform: 'none', px: 1.5, borderRadius: 0 }}
        >
          {activeTab.label}
        </Button>
      </Box>

      {!isLanding && (
        <>
          <Divider />

          <Box sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <TextField
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={PLACEHOLDERS[mode]}
              size="small"
              sx={{ flex: 1 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={14} />
                    </InputAdornment>
                  ),
                },
              }}
            />
            {showFilterToggle && (
              <Tooltip
                title={
                  filtersAvailable
                    ? filtersOpen
                      ? 'Hide filters'
                      : 'Show filters'
                    : 'No filters available'
                }
              >
                <span>
                  <IconButton
                    size="small"
                    onClick={() => nodeFiltersOpenVar(!filtersOpen)}
                    disabled={!filtersAvailable}
                    color={hasActiveFilters ? 'primary' : 'default'}
                  >
                    {hasActiveFilters ? <FunnelFill size={14} /> : <Funnel size={14} />}
                  </IconButton>
                </span>
              </Tooltip>
            )}
          </Box>

          {showFilters && (
            <>
              <Divider />
              <Box sx={{ p: 1 }}>
                <FormControl size="small" fullWidth>
                  <InputLabel id="outcome-filter-label">Outcome node</InputLabel>
                  <Select
                    labelId="outcome-filter-label"
                    label="Outcome node"
                    value={filters.outcomeId ?? ALL_OUTCOMES_VALUE}
                    onChange={(e) =>
                      nodeFiltersVar({
                        ...filters,
                        outcomeId: e.target.value === ALL_OUTCOMES_VALUE ? null : e.target.value,
                      })
                    }
                  >
                    <MenuItem value={ALL_OUTCOMES_VALUE}>All outcomes</MenuItem>
                    {outcomeNodes.map((n) => (
                      <MenuItem key={n.id} value={n.id}>
                        {n.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </>
          )}

          {query.trim().length > 0 && (
            <>
              <Divider />
              {results.length > 0 ? (
                <List dense sx={{ maxHeight: 320, overflow: 'auto', py: 0 }}>
                  {results.map((n) => (
                    <ListItemButton key={n.id} onClick={() => handleSelect(n.id)}>
                      <ListItemText
                        primary={n.name}
                        slotProps={{
                          primary: { noWrap: true },
                        }}
                      />
                    </ListItemButton>
                  ))}
                </List>
              ) : (
                <Box sx={{ px: 2, py: 1.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    No matches.
                  </Typography>
                </Box>
              )}
            </>
          )}
        </>
      )}

      <Menu
        anchorEl={anchorEl}
        open={anchorEl !== null}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ list: { dense: true } }}
      >
        {TABS.map((t) => (
          <MenuItem
            key={t.label}
            selected={t === activeTab}
            onClick={() => {
              setAnchorEl(null);
              if (t !== activeTab) router.push(base + t.href);
            }}
          >
            <ListItemIcon>
              <t.Icon size={16} />
            </ListItemIcon>
            <ListItemText>{t.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </Paper>
  );
}
