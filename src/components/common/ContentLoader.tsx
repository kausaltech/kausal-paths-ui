import { useEffect, useState } from 'react';

import styled from '@common/themes/styled';

import { useTranslation } from '@/common/i18n';
import { KausalProgress } from './Loader';

const Loader = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

/**
 * Self-contained screen-reader-only style. The Bootstrap `.visually-hidden`
 * class this used to rely on is a public-UI global that isn't loaded on all
 * routes (e.g. the model editor), where the label would render as visible
 * unstyled text.
 */
const VisuallyHidden = styled.div`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

interface ContentLoaderProps {
  fullPage?: boolean;
}

const ContentLoader = ({ fullPage = false }: ContentLoaderProps) => {
  const { t } = useTranslation();
  const [displayMessage, setDisplayMessage] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDisplayMessage(true), 250);

    return () => clearTimeout(timer);
  }, []);

  if (!displayMessage) {
    return null;
  }

  return (
    <Loader aria-busy="true" style={{ height: fullPage ? 'calc(100vh - 24rem)' : '3rem' }}>
      <KausalProgress />
      <VisuallyHidden>{t('loading')}</VisuallyHidden>
    </Loader>
  );
};

export default ContentLoader;
