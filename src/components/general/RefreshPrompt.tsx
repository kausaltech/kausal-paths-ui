import { useEffect, useState } from 'react';

import { useApolloClient } from '@apollo/client';
import styled from '@emotion/styled';
import {
  Button,
  Card,
  CardActions,
  CardContent,
  IconButton,
  Portal,
  Typography,
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

const StyledNotificationContainer = styled.div<{ $isVisible: boolean }>`
  position: fixed;
  top: ${({ theme }) => theme.spaces.s100};
  right: ${({ theme }) => theme.spaces.s100};
  z-index: 1300;
  max-width: 400px;
  opacity: ${({ $isVisible }) => ($isVisible ? 1 : 0)};
  transform: translateX(${({ $isVisible }) => ($isVisible ? '0' : '100%')});
  transition: all 0.3s ease-in-out;
  pointer-events: ${({ $isVisible }) => ($isVisible ? 'auto' : 'none')};
`;

const StyledCard = styled(Card)`
  background-color: ${({ theme }) => theme.cardBackground.primary};
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border-radius: 8px;
`;

const StyledCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem 0.5rem;
`;

const StyledTitle = styled(Typography)`
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
`;

const StyledCardContent = styled(CardContent)`
  padding: 0.5rem 1.5rem !important;

  p {
    margin: 0;
    font-size: 0.875rem;
    line-height: 1.4;
  }
`;

const StyledCardActions = styled(CardActions)`
  padding: 1rem 1.5rem;
  justify-content: flex-end;
  gap: 8px;
`;

export function RefreshPrompt() {
  const { isVisible, handleDisable, handleClose } = useIsPromptVisible();
  const apolloClient = useApolloClient();

  function handleRefresh() {
    void apolloClient.refetchQueries({ include: ['GetPage', 'GetNodeVisualizations'] });
    handleClose();
  }

  return (
    <Portal>
      <StyledNotificationContainer $isVisible={isVisible}>
        <StyledCard elevation={3}>
          <StyledCardHeader>
            <StyledTitle>Reload for the latest data</StyledTitle>
            <StyledCloseButton onClick={handleClose} size="small">
              <X size={16} />
            </StyledCloseButton>
          </StyledCardHeader>
          <StyledCardContent>
            <p>
              Updates may be available, click on the reload button or refresh the page to ensure you
              have the latest content.
            </p>
          </StyledCardContent>
          <StyledCardActions>
            <Button size="small" onClick={handleRefresh} color="primary">
              <ArrowClockwise size={18} />
              <span className="m-2">Reload</span>
            </Button>
            <Button size="small" onClick={handleDisable}>
              Don&apos;t show this again
            </Button>
          </StyledCardActions>
        </StyledCard>
      </StyledNotificationContainer>
    </Portal>
  );
}
