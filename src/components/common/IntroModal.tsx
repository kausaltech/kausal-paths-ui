import type React from 'react';
import { useState, useSyncExternalStore } from 'react';

import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
} from '@mui/material';

import styled from '@common/themes/styled';

import { useTranslation } from '@/common/i18n';
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

const INTRO_MODAL_STORAGE_KEY = 'show-intro-modal';

function subscribeToIntroModalPreference(onStoreChange: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === INTRO_MODAL_STORAGE_KEY) onStoreChange();
  };
  window.addEventListener('storage', handleStorage);
  return () => window.removeEventListener('storage', handleStorage);
}

function getIntroModalPreference() {
  return localStorage.getItem(INTRO_MODAL_STORAGE_KEY) !== 'false';
}

function getServerIntroModalPreference() {
  return false;
}

const IntroModal = ({ size = 'lg', title, paragraph }: IntroModalProps) => {
  const { t } = useTranslation();
  const preferenceEnabled = useSyncExternalStore(
    subscribeToIntroModalPreference,
    getIntroModalPreference,
    getServerIntroModalPreference
  );
  const [dismissed, setDismissed] = useState(false);
  const [isChecked, setIsChecked] = useState(true);

  const enabled = preferenceEnabled && !dismissed;
  const handleClose = () => setDismissed(true);

  const handleClickClose = () => {
    localStorage.setItem(INTRO_MODAL_STORAGE_KEY, JSON.stringify(!isChecked));
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
