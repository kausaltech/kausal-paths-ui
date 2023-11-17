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
  justify-content: flex-end;
  gap: 1rem;
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
  const [enabled, setEnabled] = useState(true);
  const [isChecked, setIsChecked] = useState(true);

  useEffect(() => {
    const showModal = localStorage.getItem('show-intro-modal');
    if (showModal === null || JSON.parse(showModal) === true) {
      setEnabled(true);
    } else {
      setEnabled(false);
    }
  }, []);

  const handleClose = () => setEnabled(false);

  const handleClickClose = () => {
    localStorage.setItem('show-intro-modal', JSON.stringify(!isChecked));
    handleClose();
  };

  const handleChangeCheckbox = (e) => {
    setIsChecked(e.target.checked);
  };

  return (
    <div>
      <Modal isOpen={enabled} toggle={handleClose} size={size} fade={true}>
        <StyledModalHeader toggle={handleClose}>
          So funktioniert das Netto-Null-Cockpit
        </StyledModalHeader>
        <ModalBody>{children}</ModalBody>
        <StyledModalFooter>
          <StyledContainer>
            <FormGroup check>
              <StyledLabel check>
                <StyledInput
                  type="checkbox"
                  checked={isChecked}
                  onChange={handleChangeCheckbox}
                />
                {t('do-not-show-again')}
              </StyledLabel>
            </FormGroup>
            <StyledButton onClick={handleClickClose}>{t('close')}</StyledButton>
          </StyledContainer>
        </StyledModalFooter>
      </Modal>
    </div>
  );
};

export default IntroModal;
