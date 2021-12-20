import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Spinner } from 'reactstrap';

import { useTranslation } from 'next-i18next';

const Loader = styled.div`
  padding: ${(props) => props.theme.spaces.s800} ${(props) => props.theme.spaces.s300};
  text-align: center;
`;

const StyledSpinner = styled(Spinner)`
  width: ${(props) => props.theme.spaces.s100};
  height: ${(props) => props.theme.spaces.s100};
  background-color: ${(props) => props.theme.brandDark};
`;

const ContentLoader = () => {
  const { t } = useTranslation();
  const [displayMessage, setDisplayMessage] = useState(false);

  useEffect(() => {
    const timer = setTimeout(setDisplayMessage(true), 250);

    return () => clearTimeout(timer);
  });

  if (!displayMessage) {
    return null;
  }

  return (
    <Loader>
      <StyledSpinner type="grow" className="mx-1" />
      <StyledSpinner type="grow" className="mx-1" />
      <StyledSpinner type="grow" className="mx-1" />
      <div className="sr-only">{ t('loading') }</div>
    </Loader>
  );
};

export default ContentLoader;
