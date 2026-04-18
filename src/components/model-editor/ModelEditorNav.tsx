'use client';

import { type ComponentType, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { ArrowDropDown } from '@mui/icons-material';
import {
  Box,
  Button,
  Divider,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Link as MuiLink,
  Paper,
} from '@mui/material';

import { Box as BoxIcon, Database, Diagram2, House } from 'react-bootstrap-icons';

import { useInstance } from '@/common/instance';

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

export default function ModelEditorNav() {
  const pathname = usePathname();
  const router = useRouter();
  const instance = useInstance();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const base = getModelEditorBase(pathname);
  const activeTab = TABS.find((t) => t.matches(pathname)) ?? TABS[0];

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'absolute',
        top: 12,
        left: 12,
        zIndex: (theme) => theme.zIndex.appBar,
        borderRadius: 1,
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
