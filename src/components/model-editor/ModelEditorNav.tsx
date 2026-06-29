'use client';

import { type ComponentType, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { ArrowDropDown } from '@mui/icons-material';
import {
  Box,
  Button,
  CircularProgress,
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
import { useTranslations } from 'next-intl';
import {
  BoxArrowUpRight,
  Box as BoxIcon,
  CheckCircleFill,
  Compass,
  Database,
  Diagram2,
  ExclamationTriangleFill,
  Funnel,
  FunnelFill,
  House,
  People,
  Search,
  XLg,
} from 'react-bootstrap-icons';

import { NodeStatus } from '@/common/__generated__/graphql';
import { nodeFiltersOpenVar, nodeFiltersVar } from '@/common/cache';
import { useInstance } from '@/common/instance';
import { Link as AppLink } from '@/common/links';
import { getModelEditorBase } from './paths';
import { nodeStatusVar } from './queries';

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

type NavLabelKey =
  | 'editor-nav-model'
  | 'editor-nav-nodes'
  | 'editor-nav-datasets'
  | 'editor-nav-dimensions'
  | 'editor-nav-users';

type TabDef = {
  labelKey: NavLabelKey;
  matches: (path: string) => boolean;
  href: string;
  Icon: ComponentType<{ size?: number }>;
};

const TABS: TabDef[] = [
  {
    labelKey: 'editor-nav-model',
    matches: (path) =>
      !path.includes('/model/nodes') &&
      !path.includes('/model/datasets') &&
      !path.includes('/model/dimensions') &&
      !path.includes('/model/users'),
    href: '',
    Icon: House,
  },
  {
    labelKey: 'editor-nav-nodes',
    matches: (path) => path.includes('/model/nodes'),
    href: '/nodes',
    Icon: Diagram2,
  },
  {
    labelKey: 'editor-nav-datasets',
    matches: (path) => path.includes('/model/datasets'),
    href: '/datasets',
    Icon: Database,
  },
  {
    labelKey: 'editor-nav-dimensions',
    matches: (path) => path.includes('/model/dimensions'),
    href: '/dimensions',
    Icon: BoxIcon,
  },
  {
    labelKey: 'editor-nav-users',
    matches: (path) => path.includes('/model/users'),
    href: '/users',
    Icon: People,
  },
];

type SearchMode = 'nodes' | 'datasets' | 'dimensions';

function getSearchMode(pathname: string): SearchMode | null {
  if (pathname.includes('/model/nodes')) return 'nodes';
  if (pathname.includes('/model/datasets')) return 'datasets';
  if (pathname.includes('/model/dimensions')) return 'dimensions';
  return null;
}

const SEARCH_PLACEHOLDER_KEY: Record<
  SearchMode,
  'nodes-search-nodes' | 'nav-search-datasets' | 'nav-search-dimensions'
> = {
  nodes: 'nodes-search-nodes',
  datasets: 'nav-search-datasets',
  dimensions: 'nav-search-dimensions',
};

const MAX_RESULTS = 10;
const ALL_OUTCOMES_VALUE = '__all__';

/**
 * Model-wide fault-tolerance status, derived from `nodeStatusVar`. Shows a
 * spinner while the async compute pass is in flight, then a problem count (or
 * an all-clear tick once a clean compute has settled). Stays silent until the
 * first status arrives so it doesn't flash on load.
 */
function ModelStatusIndicator() {
  const t = useTranslations('model-editor');
  const statuses = useReactiveVar(nodeStatusVar);
  const entries = Object.values(statuses);
  if (entries.length === 0) return null;

  const pending = entries.some((e) => e.pending);
  const problemCount = entries.filter((e) => e.status !== NodeStatus.Ok).length;

  let icon: React.ReactNode;
  let label: string;
  let color: string;
  if (pending) {
    icon = <CircularProgress size={14} thickness={5} color="inherit" />;
    label = t('editor-status-checking');
    color = 'text.secondary';
  } else if (problemCount > 0) {
    icon = <ExclamationTriangleFill size={14} />;
    label = t('editor-status-problem-count', { count: problemCount });
    color = 'warning.main';
  } else {
    icon = <CheckCircleFill size={14} />;
    label = '';
    color = 'success.main';
  }

  return (
    <Tooltip title={label} arrow>
      <Box
        sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1, color, flexShrink: 0 }}
        aria-label={label}
      >
        {icon}
        {label && (
          <Typography variant="caption" sx={{ fontSize: 11, whiteSpace: 'nowrap' }}>
            {label}
          </Typography>
        )}
      </Box>
    </Tooltip>
  );
}

export default function ModelEditorNav() {
  const t = useTranslations('model-editor');
  const pathname = usePathname();
  const router = useRouter();
  const instance = useInstance();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [query, setQuery] = useState('');
  const base = getModelEditorBase(pathname);
  const activeTab = TABS.find((t) => t.matches(pathname)) ?? TABS[0];
  const mode = getSearchMode(pathname);

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
    if (mode === 'dimensions') return dimensionsData?.instance.editor?.dimensions ?? [];
    return [];
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
        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
          <ModelStatusIndicator />
        </Box>
        <Divider orientation="vertical" flexItem />
        <Button
          size="small"
          color="inherit"
          onClick={(e) => setAnchorEl(e.currentTarget)}
          startIcon={<activeTab.Icon size={16} />}
          endIcon={<ArrowDropDown />}
          sx={{ textTransform: 'none', px: 1.5, borderRadius: 0 }}
        >
          {t(activeTab.labelKey)}
        </Button>
      </Box>

      {mode !== null && (
        <>
          <Divider />

          <Box sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <TextField
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t(SEARCH_PLACEHOLDER_KEY[mode])}
              size="small"
              sx={{ flex: 1 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={14} />
                    </InputAdornment>
                  ),
                  endAdornment: query ? (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setQuery('')}
                        aria-label={t('nodes-clear-search')}
                        edge="end"
                      >
                        <XLg size={12} />
                      </IconButton>
                    </InputAdornment>
                  ) : undefined,
                },
              }}
            />
            {showFilterToggle && (
              <Tooltip
                title={
                  filtersAvailable
                    ? filtersOpen
                      ? t('editor-hide-filters')
                      : t('editor-show-filters')
                    : t('editor-no-filters-available')
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
                  <InputLabel id="outcome-filter-label">{t('editor-outcome-node')}</InputLabel>
                  <Select
                    labelId="outcome-filter-label"
                    label={t('editor-outcome-node')}
                    value={filters.outcomeId ?? ALL_OUTCOMES_VALUE}
                    onChange={(e) =>
                      nodeFiltersVar({
                        ...filters,
                        outcomeId: e.target.value === ALL_OUTCOMES_VALUE ? null : e.target.value,
                      })
                    }
                  >
                    <MenuItem value={ALL_OUTCOMES_VALUE}>{t('editor-outcome-all')}</MenuItem>
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
                    {t('common-no-matches')}
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
        {TABS.map((tab) => (
          <MenuItem
            key={tab.labelKey}
            selected={tab === activeTab}
            onClick={() => {
              setAnchorEl(null);
              if (tab !== activeTab) router.push(base + tab.href);
            }}
          >
            <ListItemIcon>
              <tab.Icon size={16} />
            </ListItemIcon>
            <ListItemText>{t(tab.labelKey)}</ListItemText>
          </MenuItem>
        ))}
        <Divider />
        <MenuItem
          component={AppLink}
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setAnchorEl(null)}
        >
          <ListItemIcon>
            <Compass size={16} />
          </ListItemIcon>
          <ListItemText>{t('common-explore')}</ListItemText>
          <BoxArrowUpRight size={12} style={{ marginLeft: 12, opacity: 0.6 }} />
        </MenuItem>
      </Menu>
    </Paper>
  );
}

// Disabled while preview-mode routing is gated off in
// `ApolloWrapper.detectPreviewMode`. Restore the interactive handler +
// dynamic label once the backend DRAFT hydrate bug is fixed.
function PreviewModeToggle() {
  const t = useTranslations('model-editor');
  return (
    <Tooltip title={t('editor-draft-mode-disabled')} placement="right">
      <Box
        component="span"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          px: 1,
          py: 0.5,
          userSelect: 'none',
          color: 'success.main',
          opacity: 0.6,
        }}
      >
        <Switch checked={false} disabled size="small" color="success" />
        <Typography variant="overline" sx={{ color: 'inherit', fontWeight: 600, lineHeight: 1 }}>
          {t('editor-published')}
        </Typography>
      </Box>
    </Tooltip>
  );
}
