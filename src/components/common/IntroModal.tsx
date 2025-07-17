import React, { useEffect, useState } from 'react';

import styled from '@emotion/styled';
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
} from '@mui/material';
import { useTranslation } from 'next-i18next';

import RichText from './RichText';

const StyledButton = styled(Button)`
  background-color: ${(props) => props.theme.brandDark};
  color: ${(props) => props.theme.neutralLight};

  &:hover {
    background-color: ${(props) => props.theme.inputBtnFocusColor};
    color: ${(props) => props.theme.neutralLight};
  }
`;

const StyledFormControlLabel = styled(FormControlLabel)`
  .MuiFormControlLabel-label:hover {
    color: ${(props) => props.theme.inputBtnFocusColor};
    cursor: pointer;
  }
`;

const StyledCheckbox = styled(Checkbox)`
  &.Mui-checked {
    color: ${(props) => props.theme.brandDark};
  }
`;

const StyledContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  align-items: center;
`;

const StyledDialogTitle = styled(DialogTitle)`
  border: none;
`;

const StyledDialogActions = styled(DialogActions)`
  border: none;
  padding: 1rem 1.5rem;
`;

interface IntroModalProps {
  size?: string;
  title: string;
  paragraph: string;
}

const IntroModal = ({ size = 'lg', title, paragraph }: IntroModalProps) => {
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

  const handleChangeCheckbox = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsChecked(event.target.checked);
  };

  // Convert size prop to MUI maxWidth values
  const getMaxWidth = (size: string) => {
    switch (size) {
      case 'sm':
        return 'sm';
      case 'lg':
        return 'lg';
      case 'xl':
        return 'xl';
      default:
        return 'md';
    }
  };

  return (
    <Dialog open={enabled} onClose={handleClose} maxWidth={getMaxWidth(size)} fullWidth>
      <StyledDialogTitle>
        <RichText html={title} />
      </StyledDialogTitle>
      <DialogContent>
        <RichText html={paragraph} />
      </DialogContent>
      <StyledDialogActions>
        <StyledContainer>
          <StyledFormControlLabel
            control={<StyledCheckbox checked={isChecked} onChange={handleChangeCheckbox} />}
            label={t('do-not-show-again')}
          />
          <StyledButton variant="contained" onClick={handleClickClose}>
            {t('close')}
          </StyledButton>
        </StyledContainer>
      </StyledDialogActions>
    </Dialog>
  );
};

export default IntroModal;
