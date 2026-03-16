import { useEffect, useState } from 'react';

import styled from '@common/themes/styled';

import { useTranslation } from '@/common/i18n';

import { KausalProgress } from './Loader';

const Loader = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
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
      <div className="visually-hidden">{t('loading')}</div>
    </Loader>
  );
};

export default ContentLoader;
