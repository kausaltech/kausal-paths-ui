'use client';

import { type ReactNode, useState } from 'react';

import type { Theme } from '@kausal/themes/types';

import { activeGoalVar, activeScenarioVar, yearRangeVar } from '@/common/cache';
import InstanceContext, { type InstanceContextType } from '@/common/instance';
import SiteContext, { type SiteContextType } from '@/context/site';
import { InstanceThemeProvider } from './InstanceThemedStyles';

/**
 * Client component that provides instance-specific context to the component tree.
 * Handles SiteContext, InstanceContext, the kausal MUI theme, and initializes
 * Apollo reactive vars. Instance-wide global CSS (heading colors, Bootstrap,
 * etc.) lives in the `(with-layout)` route group so routes like `model`
 * can opt out while still reading `theme.*` values in shared components.
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

  const activeScenario = siteContext.scenarios.find((sc) => sc.isActive);
  const goals = instanceContext.goals;

  if (!activeGoalVar()) {
    const defaultGoal = goals.length > 1 ? goals.find((goal) => goal.default) : goals[0];
    activeGoalVar(defaultGoal ?? null);
  }

  if (!activeScenarioVar() && activeScenario) {
    // isUserSelected=false marks this as a placeholder from SSR (the server's
    // GET_INSTANCE_CONTEXT fetch may not propagate the user's session cookie,
    // so isActive here can be stale). ScenarioSelector reconciles against the
    // client-side GET_SCENARIOS result once it loads.
    activeScenarioVar({ ...activeScenario, isUserSelected: false });
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
        <InstanceThemeProvider themeProps={themeProps}>{children}</InstanceThemeProvider>
      </InstanceContext.Provider>
    </SiteContext.Provider>
  );
}
