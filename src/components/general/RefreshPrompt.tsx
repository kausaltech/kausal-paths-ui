import { useEffect, useState } from 'react';

import { useApolloClient } from '@apollo/client';
import styled from '@emotion/styled';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
} from '@mui/material';
import { ArrowClockwise, X } from 'react-bootstrap-icons';

const DISABLE_REFRESH_PROMPT = 'hideRefreshPrompt';
const TEN_MINS = 10 * 60 * 1000;

function getIsPromptDisabled() {
  try {
    return localStorage.getItem(DISABLE_REFRESH_PROMPT) === 'true';
  } catch {
    return false;
  }
}

function storeDisableRefreshPrompt() {
  try {
    localStorage.setItem(DISABLE_REFRESH_PROMPT, 'true');
  } catch {}
}

/**
 * Determines if the toast to prompt the user to refresh the dashboard is visible.
 * This is a quick-win, in future graphs should refresh automatically when data changes.
 *
 * The refresh prompt becomes visible in two scenarios:
 *  1. When the user switches to another tab and returns, as they may
 *     have edited data in the NetZeroPlanner Data Studio.
 *  2. After ten minutes of inactivity, in case the user has switched
 *     to another window to edit data without triggering a visibilitychange event.
 *
 * The hook also supports disabling the prompt "permanently" via localStorage.
 */
function useIsPromptVisible() {
  const [isPromptVisible, setIsPromptVisible] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);

  function handleClose() {
    setIsPromptVisible(false);
  }

  function handleDisablePrompt() {
    handleClose();
    storeDisableRefreshPrompt();
  }

  useEffect(() => {
    const isDisabled = getIsPromptDisabled();

    if (isDisabled || isPromptVisible) {
      return;
    }

    const timeout = setTimeout(() => setIsPromptVisible(true), TEN_MINS);

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        if (!isPageVisible) {
          clearTimeout(timeout);
          setIsPromptVisible(true);
        }

        setIsPageVisible(true);
      } else {
        setIsPageVisible(false);
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPromptVisible, isPageVisible]);

  return {
    isVisible: isPromptVisible,
    handleDisable: handleDisablePrompt,
    handleClose,
  };
}

const StyledDialog = styled(Dialog)`
  .MuiDialog-root {
    position: fixed;
  }

  .MuiDialog-container {
    position: fixed;
    top: 0;
    right: 0;
    left: auto;
    bottom: auto;
    height: auto;
    justify-content: flex-end;
    align-items: flex-start;
    padding: ${({ theme }) => theme.spaces.s100};
    pointer-events: none;
  }

  .MuiDialog-paper {
    position: relative;
    margin: 0;
    background-color: ${({ theme }) => theme.cardBackground.primary};
    max-width: 400px;
    width: auto;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    border-radius: 8px;
    pointer-events: auto;
  }
`;

const StyledDialogTitle = styled(DialogTitle)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem 0.5rem;
  font-size: 1rem;
  font-weight: 600;
`;

const StyledDialogContent = styled(DialogContent)`
  padding: 0.5rem 1.5rem;

  p {
    margin: 0;
    font-size: 0.875rem;
    line-height: 1.4;
  }
`;

const StyledDialogActions = styled(DialogActions)`
  padding: 1rem 1.5rem;
  justify-content: flex-end;
  gap: 8px;
`;

const StyledCloseButton = styled(IconButton)`
  color: ${({ theme }) => theme.textColor.secondary};
  padding: 4px;

  &:hover {
    background-color: ${({ theme }) => theme.graphColors.grey020};
  }
`;

export function RefreshPrompt() {
  const { isVisible, handleDisable, handleClose } = useIsPromptVisible();
  const apolloClient = useApolloClient();

  function handleRefresh() {
    void apolloClient.refetchQueries({ include: ['GetPage', 'GetNodeVisualizations'] });
    handleClose();
  }

  return (
    <StyledDialog
      open={isVisible}
      onClose={handleClose}
      hideBackdrop
      disableEnforceFocus
      disableAutoFocus
      disableRestoreFocus
      PaperProps={{
        elevation: 3,
      }}
    >
      <StyledDialogTitle>
        Reload for the latest data
        <StyledCloseButton onClick={handleClose} size="small">
          <X size={16} />
        </StyledCloseButton>
      </StyledDialogTitle>
      <StyledDialogContent>
        <p>
          Updates may be available, click on the reload button or refresh the page to ensure you
          have the latest content.
        </p>
      </StyledDialogContent>
      <StyledDialogActions>
        <Button size="small" onClick={handleRefresh}>
          <ArrowClockwise size={18} />
          <span className="m-2">Reload</span>
        </Button>
        <Button size="small" onClick={handleDisable}>
          Don&apos;t show this again
        </Button>
      </StyledDialogActions>
    </StyledDialog>
  );
}
