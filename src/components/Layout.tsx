'use client';

import { usePathname } from 'next/navigation';

import { Box, Drawer, styled, useTheme } from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';

import { useReactiveVar } from '@apollo/client/react';

import { scenarioEditorDrawerOpenVar } from '@/common/cache';
import { useTranslation } from '@/common/i18n';
import { useInstance } from '@/common/instance';
import { formatUrl } from '@/common/links';
import ScenarioEditor from '@/components/scenario/ScenarioEditor';
import { useSiteOrNull } from '@/context/site';
import type { FooterNavItem } from './common/Footer';
import IntroModal from './common/IntroModal';
import { FooterSlot, GlobalNavSlot } from './custom';
import { RefreshPrompt } from './general/RefreshPrompt';

const DRAWER_WIDTH = 320;

const StyledSkipToContent = styled('a')`
  position: absolute;
  left: -9999px;
  z-index: 999;
  padding: ${({ theme }) => theme.spaces.s050};
  background-color: ${({ theme }) => theme.brandDark};
  border: ${({ theme }) => `${theme.btnBorderWidth} solid ${theme.themeColors.light}`};
  border-radius: ${({ theme }) => theme.btnBorderRadius};
  color: ${({ theme }) => theme.themeColors.light};
  opacity: 0;

  &:focus,
  &:visited {
    color: ${({ theme }) => theme.themeColors.light};
  }

  &:focus {
    left: 50%;
    top: ${({ theme }) => theme.spaces.s050};
    transform: translateX(-50%);
    opacity: 1;
  }
`;

const visuallyHiddenSx = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap' as const,
  border: 0,
};

type MenuPage = {
  id?: string | null;
  title: string;
  menuLabel?: string | null;
  urlPath: string;
  parentId?: string | null;
  children?: MenuPage[];
};

function getParentId(parent: unknown): string | null {
  if (typeof parent !== 'object' || parent === null) return null;
  const { id } = parent as Record<string, unknown>;
  return typeof id === 'string' ? id : null;
}

// The backend returns menu pages as a flat list. Nest each page under its parent
// when the parent is also in the menu. Children of the root page (`/`) stay at the
// top level, so a "home" menu item doesn't swallow the whole menu.
function buildMenuTree(pages: MenuPage[]): MenuPage[] {
  const byId = new Map(pages.filter((page) => page.id).map((page) => [page.id, page]));
  const roots: MenuPage[] = [];
  pages.forEach((page) => {
    const parent = page.parentId ? byId.get(page.parentId) : undefined;
    if (parent?.children && parent.urlPath !== '/') {
      parent.children.push(page);
    } else {
      roots.push(page);
    }
  });
  return roots;
}

function flattenMenu(pages: MenuPage[]): MenuPage[] {
  return pages.flatMap((page) => [page, ...flattenMenu(page.children ?? [])]);
}

type RawMenuPage = {
  id?: unknown;
  title: string;
  menuLabel?: unknown;
  urlPath: string;
  parent?: unknown;
};

function isMenuPage(page: unknown): page is RawMenuPage {
  if (typeof page !== 'object' || page === null) return false;
  const p = page as Record<string, unknown>;
  return (
    ('id' in p ? typeof p.id === 'string' || p.id === null || typeof p.id === 'undefined' : true) &&
    typeof p.title === 'string' &&
    typeof p.urlPath === 'string'
  );
}

function toMenuPage(page: RawMenuPage): MenuPage {
  return {
    id: typeof page.id === 'string' ? page.id : null,
    title: page.title,
    menuLabel: typeof page.menuLabel === 'string' ? page.menuLabel : null,
    urlPath: page.urlPath,
    parentId: getParentId(page.parent),
    children: [],
  };
}

function getMenuPages(pages: unknown): MenuPage[] {
  return (Array.isArray(pages) ? pages : []).filter(isMenuPage).map(toMenuPage);
}

const Layout = ({ children }: React.PropsWithChildren) => {
  const pathname = usePathname();
  const theme = useTheme();
  const site = useSiteOrNull();
  const { t } = useTranslation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { menuPages, footerPages, additionalLinkPages } = site ?? {};
  const drawerOpen = useReactiveVar(scenarioEditorDrawerOpenVar);

  const handleDrawerClose = () => {
    scenarioEditorDrawerOpenVar(false);
  };

  let activePage: MenuPage | undefined;

  const menuItems = getMenuPages(menuPages);
  const menuTree = buildMenuTree(menuItems);

  const rawAdditionalLinkPages = Array.isArray(additionalLinkPages) ? additionalLinkPages : [];
  const additionalLinkItems: MenuPage[] = rawAdditionalLinkPages.filter(isMenuPage).map((page) => ({
    id: typeof page.id === 'string' ? page.id : null,
    title: page.title,
    urlPath: page.urlPath,
  }));

  // The footer shows two levels too: deeper descendants are listed under their
  // top-level ancestor, which is rendered as a heading rather than a link.
  const footerNavItems: FooterNavItem[] = buildMenuTree(getMenuPages(footerPages)).map((page) => {
    const descendants = flattenMenu(page.children ?? []);
    return {
      id: page.id || page.urlPath,
      name: page.menuLabel || page.title,
      slug: page.urlPath,
      children: descendants.length
        ? descendants.map((item) => ({
            id: item.id || item.urlPath,
            name: item.menuLabel || item.title,
            slug: item.urlPath,
          }))
        : undefined,
    };
  });

  // `urlPath` is the raw backend path (e.g. `/some-page`), while `pathname`
  // includes the instance basePath and locale prefix. Resolve each menu page to
  // its full path before comparing.
  const resolvedMenuItems = menuItems.map((page) => ({
    page,
    fullPath: formatUrl(site, page.urlPath),
  }));

  resolvedMenuItems.forEach(({ page, fullPath }) => {
    if (pathname === fullPath) {
      activePage = page;
    }
  });

  if (!activePage) {
    resolvedMenuItems.forEach(({ page, fullPath }) => {
      if (pathname.startsWith(fullPath)) {
        activePage = page;
      }
    });
  }

  // GlobalNav renders one dropdown level, so deeper descendants are flattened into it.
  const navItems = menuTree.map((page) => {
    const descendants = flattenMenu(page.children ?? []);
    return {
      id: page.id || '',
      name: page.menuLabel || page.title,
      slug: page.urlPath,
      urlPath: page.urlPath,
      active: page === activePage || descendants.some((child) => child === activePage),
      children: descendants.length
        ? descendants.map((item) => ({
            id: item.id || item.urlPath,
            name: item.menuLabel || item.title,
            urlPath: item.urlPath,
          }))
        : undefined,
    };
  });

  const instance = useInstance();

  const title = instance.introContent?.find(
    (
      block
    ): block is { __typename: 'RichTextBlock'; id: string | null; field: string; value: string } =>
      block.__typename === 'RichTextBlock' && block.field === 'title'
  )?.value;

  const paragraph = instance.introContent?.find(
    (
      block
    ): block is { __typename: 'RichTextBlock'; id: string | null; field: string; value: string } =>
      block.__typename === 'RichTextBlock' && block.field === 'paragraph'
  )?.value;

  const introModalEnabled = !!(title && paragraph);
  const showRefreshPrompt = instance.features.showRefreshPrompt;

  return (
    <>
      <StyledSkipToContent href="#main">{t('skip-to-main-content')}</StyledSkipToContent>

      <Box sx={{ display: 'flex', maxWidth: '100%', minWidth: 0 }}>
        {/* Persistent drawer for desktop */}
        <Drawer
          sx={{
            display: { xs: 'none', md: 'block' },
            width: drawerOpen ? DRAWER_WIDTH : 0,
            flexShrink: 0,
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          }}
          variant="persistent"
          anchor="left"
          open={!isMobile && drawerOpen}
          slotProps={{
            paper: {
              sx: {
                width: DRAWER_WIDTH,
                boxSizing: 'border-box',
                backgroundColor: theme.graphColors.blue010,
                borderRadius: 0,
                boxShadow: 10,
              },
            },
          }}
        >
          {drawerOpen && !isMobile && <ScenarioEditor handleDrawerClose={handleDrawerClose} />}
        </Drawer>
        {/* Temporary drawer for mobile */}
        <Drawer
          variant="temporary"
          open={isMobile && drawerOpen}
          onClose={handleDrawerClose}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              backgroundColor: theme.graphColors.blue010,
              borderRadius: 0,
              boxShadow: 10,
            },
          }}
          slotProps={{
            root: {
              keepMounted: true,
            },
          }}
        >
          {drawerOpen && isMobile && <ScenarioEditor handleDrawerClose={handleDrawerClose} />}
        </Drawer>
        {showRefreshPrompt && <RefreshPrompt />}
        <Box
          sx={{
            flexGrow: 1,
            flexShrink: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
          }}
        >
          <GlobalNavSlot
            siteTitle={site?.title || ''}
            ownerName={site?.owner || undefined}
            navItems={navItems}
          />
          <Box component="main" className="main" id="main" sx={{ flexGrow: 1 }}>
            {/* hidden H1 fallback for accessibility */}
            <Box component="h1" sx={visuallyHiddenSx}>
              {activePage?.title || site?.title || ''}
            </Box>
            {children}
          </Box>
          <FooterSlot additionalLinks={additionalLinkItems} navItems={footerNavItems} />
        </Box>
      </Box>
      {introModalEnabled && <IntroModal title={title} paragraph={paragraph} />}
    </>
  );
};

export default Layout;
