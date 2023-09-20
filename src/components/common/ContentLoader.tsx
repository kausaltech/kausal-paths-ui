import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Spinner } from 'reactstrap';

import { useTranslation } from 'next-i18next';

const Loader = styled.div<{ fullPage?: boolean }>`
  display: flex;
  height: ${(props) =>
    props.fullPage ? `calc(100vh - 24rem)` : props.theme.spaces.s400};
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
    const timer = setTimeout(setDisplayMessage(true), 250);

    return () => clearTimeout(timer);
  }, []);

  if (!displayMessage) {
    return null;
  }

  return (
    <Loader fullPage={fullPage}>
      <StyledSpinner type="grow" className="mx-1" />
      <StyledSpinner type="grow" className="mx-1" />
      <StyledSpinner type="grow" className="mx-1" />
      <div className="visually-hidden">{t('loading')}</div>
    </Loader>
  );
};

export default ContentLoader;
