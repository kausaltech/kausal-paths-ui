import React from 'react';
import { Spinner } from 'reactstrap';
import styled from 'styled-components';

const LoaderOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.4);
  z-index: 1;
`;

const Loader = () => {
  return (
    <LoaderOverlay>
      <Spinner size="sm" color="primary" />
    </LoaderOverlay>
  );
};

export default Loader;
