import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Spinner } from 'reactstrap';

import { useTranslation } from 'next-i18next';

const Loader = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const StyledSpinner = styled(Spinner)`
  width: ${(props) => props.theme.spaces.s100};
  height: ${(props) => props.theme.spaces.s100};
  background-color: ${(props) => props.theme.themeColors.dark};
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
    <Loader
      aria-busy="true"
      style={{ height: fullPage ? 'calc(100vh - 24rem)' : '3rem' }}
    >
      <StyledSpinner type="grow" className="mx-1" />
      <StyledSpinner type="grow" className="mx-1" />
      <StyledSpinner type="grow" className="mx-1" />
      <div className="visually-hidden">{t('loading')}</div>
    </Loader>
  );
};

export default ContentLoader;
