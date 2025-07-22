import React from 'react';

import Head from 'next/head';
import { useRouter } from 'next/router';

import { useReactiveVar } from '@apollo/client';
import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { Box, Drawer, Fab, IconButton } from '@mui/material';

import { scenarioEditorDrawerOpenVar } from '@/common/cache';
import { useTranslation } from '@/common/i18n';
import { useInstance } from '@/common/instance';
import { getThemeStaticURL } from '@/common/theme';
import Footer from '@/components/common/Footer';
import GlobalNav from '@/components/common/GlobalNav';
import ScenarioEditor from '@/components/scenario/ScenarioEditor';
import { useSite } from '@/context/site';

import IntroModal from './common/IntroModal';
import { useCustomComponent } from './custom';
import { RefreshPrompt } from './general/RefreshPrompt';

const DRAWER_WIDTH = 320;

const Content = styled.div`
  flex-grow: 1;
`;

const DrawerHeader = styled.div`
  display: flex;
  align-items: center;
  padding: ${({ theme }) => theme.spaces.s050};
  justify-content: space-between;
`;

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
  const site = useSite();
  const { t } = useTranslation();
  const { menuPages, iconBase: fallbackIconBase, ogImage } = site;
  const drawerOpen = useReactiveVar(scenarioEditorDrawerOpenVar);

  const handleDrawerOpen = () => {
    scenarioEditorDrawerOpenVar(true);
  };

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

  const isSettingsPanelHidden = !!instance.features?.hideNodeDetails;

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
      <Fab
        color="primary"
        aria-label="add"
        size="large"
        onClick={drawerOpen ? handleDrawerClose : handleDrawerOpen}
        sx={{ position: 'fixed', bottom: '20px', right: '20px' }}
      >
        <span>{'<'}</span>
      </Fab>
      <Box sx={{ display: 'flex' }}>
        <Drawer
          sx={{
            width: drawerOpen ? DRAWER_WIDTH : 0,
            flexShrink: 0,
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              backgroundColor: theme.graphColors.blue010,
            },
          }}
          variant="persistent"
          anchor="left"
          open={drawerOpen}
          slotProps={{
            paper: {
              elevation: 5,
            },
          }}
        >
          <DrawerHeader>
            <h1 style={{ fontSize: '1rem' }}>Scenario editor</h1>
            <IconButton onClick={handleDrawerClose}>
              <span>{'X'}</span>
            </IconButton>
          </DrawerHeader>
          {drawerOpen && <ScenarioEditor />}
        </Drawer>
        {showRefreshPrompt && <RefreshPrompt />}
        <Content>
          <NavComponent
            siteTitle={site.title}
            ownerName={site.owner ?? undefined}
            navItems={navItems}
          />
          <main className="main" id="main">
            {children}
          </main>
          <FooterComponent />
        </Content>
      </Box>
      {introModalEnabled && <IntroModal title={title} paragraph={paragraph} />}
    </>
  );
};

export default Layout;
