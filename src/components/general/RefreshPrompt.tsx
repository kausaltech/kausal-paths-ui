import { useEffect, useState } from 'react';

import { useApolloClient } from '@apollo/client';
import styled from '@emotion/styled';
import { ArrowClockwise } from 'react-bootstrap-icons';
import { Toast, ToastBody, ToastHeader } from 'reactstrap';

import Button from '../common/Button';

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

const StyledWrapper = styled.div<{ $isVisible: boolean }>`
  position: fixed;
  top: 0;
  right: 0;
  max-width: 500px;
  display: ${({ $isVisible }) => ($isVisible ? 'block' : 'none')};
  z-index: ${({ $isVisible }) => ($isVisible ? '1100' : 'unset')};
`;

const StyledToast = styled(Toast)`
  margin: ${({ theme }) => theme.spaces.s100};
  background-color: ${({ theme }) => theme.cardBackground.primary};
  display: block !important; // Support fade in transition
`;

const StyledActions = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  gap: 8px;
`;

export function RefreshPrompt() {
  const { isVisible, handleDisable, handleClose } = useIsPromptVisible();
  const apolloClient = useApolloClient();

  function handleRefresh() {
    apolloClient.refetchQueries({ include: ['GetPage', 'GetNodeVisualizations'] });
    handleClose();
  }

  return (
    <StyledWrapper $isVisible={isVisible}>
      <StyledToast isOpen={isVisible} fade transition={{ unmountOnExit: false, timeout: 400 }}>
        <ToastHeader toggle={handleClose}>Reload for the latest data</ToastHeader>
        <ToastBody>
          <p>
            Updates may be available, click on the reload button or refresh the page to ensure you
            have the latest content.
          </p>
          <StyledActions>
            <Button size="sm" onClick={handleRefresh}>
              <ArrowClockwise size={18} />
              <span className="m-2">Reload</span>
            </Button>
            <Button size="sm" onClick={handleDisable}>
              Don&apos;t show this again
            </Button>
          </StyledActions>
        </ToastBody>
      </StyledToast>
    </StyledWrapper>
  );
}
