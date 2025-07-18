import { useEffect, useState } from 'react';

import styled from '@emotion/styled';
import { CircularProgress } from '@mui/material';
import { useTranslation } from 'next-i18next';

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
      <CircularProgress />
      <div className="visually-hidden">{t('loading')}</div>
    </Loader>
  );
};

export default ContentLoader;
