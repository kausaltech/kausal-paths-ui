import Head from 'next/head';
import { useRouter } from 'next/router';

import styled from 'styled-components';

import { useTranslation } from '@/common/i18n';
import { useInstance } from '@/common/instance';
import { useBaseTheme } from '@/common/mui-theme/use-base-theme';
import { getThemeStaticURL } from '@/common/theme';
import Footer from '@/components/common/Footer';
import GlobalNav from '@/components/common/GlobalNav';
import { useSite } from '@/context/site';

import IntroModal from './common/IntroModal';
import { useCustomComponent } from './custom';
import { RefreshPrompt } from './general/RefreshPrompt';

const PageContainer = styled.div`
  width: 100%;
  min-height: calc(100vh - 20rem);
  background-color: ${(props) => props.theme.graphColors.grey030};
  padding-bottom: ${(props) => props.theme.spaces.s400};

  .popover {
    max-width: 480px;
  }
`;

const FooterContainer = styled.footer<{ $isSettingsPanelHidden: boolean }>`
  background-color: ${(props) => props.theme.themeColors.black};
  padding-bottom: ${({ $isSettingsPanelHidden }) => ($isSettingsPanelHidden ? '0' : '7rem')};
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
  const theme = useBaseTheme();
  const site = useSite();
  const { t } = useTranslation();
  const { menuPages, iconBase: fallbackIconBase, ogImage } = site;
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
    id: page.id,
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
      <NavComponent
        siteTitle={site.title}
        ownerName={site.owner ?? undefined}
        navItems={navItems}
      />
      <PageContainer>
        {showRefreshPrompt && <RefreshPrompt />}
        <main className="main" id="main">
          {children}
        </main>
      </PageContainer>
      <FooterContainer $isSettingsPanelHidden={isSettingsPanelHidden}>
        <FooterComponent />
      </FooterContainer>
      {introModalEnabled && <IntroModal title={title} paragraph={paragraph} />}
    </>
  );
};

export default Layout;
