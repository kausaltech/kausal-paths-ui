'use client';

import { type ComponentType, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { ArrowDropDown } from '@mui/icons-material';
import {
  Box,
  Button,
  Divider,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Link as MuiLink,
  Paper,
  TextField,
  Typography,
} from '@mui/material';

import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { Box as BoxIcon, Database, Diagram2, House, Search } from 'react-bootstrap-icons';

import { useInstance } from '@/common/instance';

const GET_NODE_SEARCH_LIST = gql`
  query EditorNodeSearchList {
    instance {
      id
      nodes {
        id
        name
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

type NodeSearchListQuery = {
  instance: { id: string; nodes: SearchItem[] };
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

          <Box sx={{ p: 1 }}>
            <TextField
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={PLACEHOLDERS[mode]}
              size="small"
              fullWidth
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
          </Box>

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
