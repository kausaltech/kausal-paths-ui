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
import { useApolloClient, useQuery, useReactiveVar } from '@apollo/client/react';
import {
  BoxArrowUpRight,
  Box as BoxIcon,
  Compass,
  Database,
  Diagram2,
  Funnel,
  FunnelFill,
  House,
  Search,
} from 'react-bootstrap-icons';

import { nodeFiltersOpenVar, nodeFiltersVar } from '@/common/cache';
import { useInstance } from '@/common/instance';
import { editorPreviewModeVar } from './queries';

const GET_NODE_SEARCH_LIST = gql`
  query EditorNodeSearchList {
    instance {
      id
      nodes {
        id
        identifier
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

type SearchItem = { id: string; name: string; identifier?: string };

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

  const handleSelect = (item: SearchItem) => {
    setQuery('');
    if (mode === 'nodes') {
      const key = item.identifier ?? item.id;
      router.push(`${base}/nodes?node=${encodeURIComponent(key)}`);
    } else if (mode === 'datasets') {
      router.push(`${base}/datasets/${encodeURIComponent(item.id)}`);
    } else {
      router.push(`${base}/dimensions/${encodeURIComponent(item.id)}`);
    }
  };

  return (
    <Paper
      sx={{
        position: 'absolute',
        top: 12,
        left: 12,
        zIndex: (theme) => theme.zIndex.appBar,
        borderRadius: 1,
        width: 360,
        boxShadow: (theme) => theme.shadows[3],
      }}
    >
      <MuiLink
        component={Link}
        href={base}
        underline="none"
        color="inherit"
        sx={{
          display: 'block',
          px: 1.5,
          py: 0.75,
          fontWeight: 600,
          fontSize: (theme) => theme.typography.subtitle2.fontSize,
          '&:hover': { color: 'primary.main' },
        }}
      >
        {instance.name}
      </MuiLink>

      <Divider />

      <Box sx={{ display: 'flex', alignItems: 'stretch' }}>
        <PreviewModeToggle />
        <Divider orientation="vertical" flexItem sx={{ ml: 'auto' }} />
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
                    <ListItemButton key={n.id} onClick={() => handleSelect(n)}>
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
        <Divider />
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            router.push('/');
          }}
        >
          <ListItemIcon>
            <Compass size={16} />
          </ListItemIcon>
          <ListItemText>Explore</ListItemText>
          <BoxArrowUpRight size={12} style={{ marginLeft: 12, opacity: 0.6 }} />
        </MenuItem>
      </Menu>
    </Paper>
  );
}

function PreviewModeToggle() {
  const mode = useReactiveVar(editorPreviewModeVar);
  const client = useApolloClient();
  const isDraft = mode === 'DRAFT';

  const handleToggle = () => {
    const next: typeof mode = isDraft ? 'PUBLISHED' : 'DRAFT';
    editorPreviewModeVar(next);
    // Refetch active queries so they re-issue against the new slice. Using
    // `resetStore` would throw `Store reset while query was in flight` when
    // any suspense query (e.g. NodeGraph) is mid-fetch — refetch is safe.
    void client.refetchQueries({ include: 'active' });
  };

  const label = isDraft ? 'Draft' : 'Published';
  const color = isDraft ? 'warning.main' : 'success.main';
  const tooltip = isDraft
    ? 'Showing the editor draft. Toggle to preview the published revision.'
    : 'Showing the published revision (read-only). Toggle back to edit the draft.';

  return (
    <Tooltip title={tooltip} placement="right">
      <Box
        component="label"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          px: 1,
          py: 0.5,
          userSelect: 'none',
          color,
          cursor: 'pointer',
        }}
      >
        <Switch
          checked={isDraft}
          onChange={handleToggle}
          size="small"
          color={isDraft ? 'warning' : 'success'}
        />
        <Typography variant="overline" sx={{ color: 'inherit', fontWeight: 600, lineHeight: 1 }}>
          {label}
        </Typography>
      </Box>
    </Tooltip>
  );
}
