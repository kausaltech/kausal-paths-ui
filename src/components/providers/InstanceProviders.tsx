'use client';

import { type ReactNode, useState } from 'react';

import { ThemeProvider } from '@mui/material/styles';

import type { Theme } from '@kausal/themes/types';

import ThemedGlobalStyles from '@common/themes/ThemedGlobalStyles';
import { initializeMuiTheme } from '@common/themes/mui-theme/theme';

import { activeGoalVar, activeScenarioVar, yearRangeVar } from '@/common/cache';
import InstanceContext, { type InstanceContextType } from '@/common/instance';
import SiteContext, { type SiteContextType } from '@/context/site';

/**
 * Client component that provides instance-specific context to the component tree.
 * Handles SiteContext, InstanceContext, MUI theming, and initializes Apollo reactive vars.
 */
export function InstanceProviders({
  siteContext: initialSiteContext,
  instanceContext,
  themeProps,
  children,
}: {
  siteContext: SiteContextType;
  instanceContext: InstanceContextType;
  themeProps: Theme;
  children: ReactNode;
}) {
  const [siteContext, setSiteContext] = useState<SiteContextType>(initialSiteContext);
  const muiTheme = initializeMuiTheme(themeProps);

  // Initialize Apollo reactive vars from instance/site context
  const activeScenario = siteContext.scenarios.find((sc) => sc.isActive);
  const goals = instanceContext.goals;

  if (!activeGoalVar()) {
    const defaultGoal = goals.length > 1 ? goals.find((goal) => goal.default) : goals[0];
    activeGoalVar(defaultGoal ?? null);
  }

  if (!activeScenarioVar() && activeScenario) {
    activeScenarioVar({ ...activeScenario, isUserSelected: true });
  }

  if (!yearRangeVar()) {
    const yearRange: [number, number] = [
      instanceContext.minimumHistoricalYear ?? siteContext.referenceYear ?? 2010,
      siteContext.targetYear,
    ];
    yearRangeVar(yearRange);
  }

  return (
    <SiteContext.Provider value={[siteContext, setSiteContext]}>
      <InstanceContext.Provider value={instanceContext}>
        <ThemeProvider theme={muiTheme}>
          <ThemedGlobalStyles />
          {children}
        </ThemeProvider>
      </InstanceContext.Provider>
    </SiteContext.Provider>
  );
}
