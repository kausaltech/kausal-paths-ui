'use client';

import type { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { AppBar, Box, Tab, Tabs, Toolbar, Typography } from '@mui/material';

type Props = {
  children: ReactNode;
};

type TabDef = {
  label: string;
  matches: (path: string) => boolean;
  href: string;
};

const TABS: TabDef[] = [
  {
    label: 'Node graph',
    matches: (path) => !path.includes('/model-editor/dimensions'),
    href: '',
  },
  {
    label: 'Dimensions',
    matches: (path) => path.includes('/model-editor/dimensions'),
    href: '/dimensions',
  },
];

function getModelEditorBase(pathname: string): string {
  const idx = pathname.indexOf('/model-editor');
  return idx >= 0 ? pathname.slice(0, idx) + '/model-editor' : '/model-editor';
}

export default function ModelEditorLayout({ children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const base = getModelEditorBase(pathname);
  const activeIndex = Math.max(
    0,
    TABS.findIndex((t) => t.matches(pathname))
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100dvh', width: '100%' }}>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar variant="dense" sx={{ gap: 2, minHeight: 48 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Model editor
          </Typography>
          <Tabs
            value={activeIndex}
            onChange={(_, idx: number) => {
              const tab = TABS[idx];
              if (tab) router.push(base + tab.href);
            }}
            sx={{ minHeight: 48 }}
          >
            {TABS.map((t) => (
              <Tab key={t.label} label={t.label} sx={{ minHeight: 48 }} />
            ))}
          </Tabs>
        </Toolbar>
      </AppBar>
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>{children}</Box>
    </Box>
  );
}
