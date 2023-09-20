import React, { useMemo } from 'react';
import SVG from 'react-inlinesvg';
import styled, { useTheme } from 'styled-components';
import { formatStaticUrl } from 'common/links';

const FooterContainer = styled.footer`
  height: 10rem;
  padding-bottom: 10rem;
  background-color: ${(props) => props.theme.footerBackgroundColor};
`;

const SiteFooter = (props) => {
  const theme = useTheme();

  const orgLogo = useMemo(() => {
    const url = formatStaticUrl(theme.themeLogoUrl);
    return (
      <SVG className="org-logo" src={url} preserveAspectRatio="xMinYMid meet" />
    );
  }, []);

  return <FooterContainer> </FooterContainer>;
};

export default SiteFooter;
