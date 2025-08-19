import React, { Fragment } from 'react';

import Head from 'next/head';
import { useRouter } from 'next/router';

import { useReactiveVar } from '@apollo/client';
import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { Box, Drawer } from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';

import { scenarioEditorDrawerOpenVar } from '@/common/cache';
import { useTranslation } from '@/common/i18n';
import { useInstance } from '@/common/instance';
import { getThemeStaticURL } from '@/common/theme';
import Footer from '@/components/common/Footer';
import GlobalNav from '@/components/common/GlobalNav';
import ScenarioEditor from '@/components/scenario/ScenarioEditor';
import { useSiteWithSetter } from '@/context/site';

import IntroModal from './common/IntroModal';
import { useCustomComponent } from './custom';
import { RefreshPrompt } from './general/RefreshPrompt';

const DRAWER_WIDTH = 320;

const StyledSkipToContent = styled.a`
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

const Layout = ({ children }: React.PropsWithChildren) => {
  const router = useRouter();
  const { asPath: pathname } = router;
  const theme = useTheme();
  const [site] = useSiteWithSetter();
  const { t } = useTranslation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { menuPages, iconBase: fallbackIconBase, ogImage } = site;
  const drawerOpen = useReactiveVar(scenarioEditorDrawerOpenVar);

  const handleDrawerClose = () => {
    scenarioEditorDrawerOpenVar(false);
  };

  let activePage;

  const iconBase = theme.name ? `/static/themes/${theme.name}/images/favicon` : fallbackIconBase;

  const menuItems = [...menuPages];

  menuItems.forEach((page) => {
    if (pathname === page.urlPath) {
      activePage = page;
    }
  });

  if (!activePage) {
    menuItems.forEach((page) => {
      if (pathname.startsWith(page.urlPath)) {
        activePage = page;
      }
    });
  }

  const navItems = menuItems.map((page) => ({
    id: page.id || '',
    name: page.title,
    slug: page.urlPath,
    urlPath: page.urlPath,
    active: page == activePage,
  }));

  const NavComponent = useCustomComponent('GlobalNav', GlobalNav);
  const FooterComponent = useCustomComponent('Footer', Footer);

  const instance = useInstance();

  const title = instance.introContent?.find(
    (block): block is { __typename: 'RichTextBlock'; field: string; value: string } =>
      block.__typename === 'RichTextBlock' && block.field === 'title'
  )?.value;

  const paragraph = instance.introContent?.find(
    (block): block is { __typename: 'RichTextBlock'; field: string; value: string } =>
      block.__typename === 'RichTextBlock' && block.field === 'paragraph'
  )?.value;

  const introModalEnabled = !!(title && paragraph);
  const showRefreshPrompt = instance.features.showRefreshPrompt;

  return (
    <>
      <Head>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
        <meta name="robots" content="noindex" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={site.title} />
        {iconBase && (
          <>
            <link rel="icon" href={getThemeStaticURL(theme.favicons.svg)} type="image/svg+xml" />
            <link rel="icon" href={getThemeStaticURL(theme.favicons.ico)} />
            <link rel="apple-touch-icon" href={getThemeStaticURL(theme.favicons.apple)} />
          </>
        )}
        {ogImage && <meta property="og:image" key="head-og-image" content={ogImage} />}
      </Head>
      {/* <CombinedIconSymbols /> */}

      <StyledSkipToContent href="#main">{t('skip-to-main-content')}</StyledSkipToContent>

      <Box sx={{ display: 'flex' }}>
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
          {drawerOpen && <ScenarioEditor handleDrawerClose={handleDrawerClose} />}
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
          {drawerOpen && <ScenarioEditor handleDrawerClose={handleDrawerClose} />}
        </Drawer>
        {showRefreshPrompt && <RefreshPrompt />}
        <Box sx={{ flexGrow: 1 }}>
          <NavComponent
            siteTitle={site.title}
            ownerName={site.owner ?? undefined}
            navItems={navItems}
          />
          <main className="main" id="main">
            {children}
          </main>
          <FooterComponent />
        </Box>
      </Box>
      {introModalEnabled && <IntroModal title={title} paragraph={paragraph} />}
    </>
  );
};

export default Layout;
