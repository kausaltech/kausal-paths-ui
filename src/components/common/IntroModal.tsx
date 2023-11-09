import { truncate } from 'lodash';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import {
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  FormGroup,
  Label,
  Input,
} from 'reactstrap';
import styled from 'styled-components';

const StyledButton = styled(Button)`
  background-color: ${(props) => props.theme.brandDark};
  color: ${(props) => props.theme.neutralLight};

  &:hover {
    background-color: ${(props) => props.theme.inputBtnFocusColor};
    color: ${(props) => props.theme.neutralLight};
  }
`;

const StyledLabel = styled(Label)`
  &:hover {
    color: ${(props) => props.theme.inputBtnFocusColor};
    cursor: pointer;
  }
`;

const StyledInput = styled(Input)`
  &:checked {
    background-color: ${(props) => props.theme.brandDark};
    border-color: ${(props) => props.theme.brandDark};
  }
`;

const StyledContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const StyledModalHeader = styled(ModalHeader)`
  border: none;
`;

const StyledModalFooter = styled(ModalFooter)`
  border: none;
`;

interface IntroModalProps {
  size?: string;
  children: ReactNode;
}

const IntroModal = ({ size = 'lg', children }: IntroModalProps) => {
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const storedValue = localStorage.getItem('intro-modal-enabled');
    if (storedValue != null && JSON.parse(storedValue) === false) {
      setEnabled(false);
    } else {
      setEnabled(true);
    }
  }, []);

  const handleChangeCheckbox = (e) => {
    localStorage.setItem(
      'intro-modal-enabled',
      JSON.stringify(!e.target.checked)
    );
  };

  const toggle = () => setEnabled(!enabled);

  return (
    <div>
      <Modal isOpen={enabled} toggle={toggle} size={size} fade={true}>
        <StyledModalHeader toggle={toggle}>
          Einblick ins neue Entwicklung der Treibhausgasemissionen
        </StyledModalHeader>
        <ModalBody>{children}</ModalBody>
        <StyledModalFooter>
          <StyledContainer>
            <FormGroup check>
              <StyledLabel check>
                <StyledInput type="checkbox" onChange={handleChangeCheckbox} />
                {t('do-not-show-again')}
              </StyledLabel>
            </FormGroup>
            <StyledButton onClick={toggle}>{t('close')}</StyledButton>
          </StyledContainer>
        </StyledModalFooter>
      </Modal>
    </div>
  );
};

export default IntroModal;
