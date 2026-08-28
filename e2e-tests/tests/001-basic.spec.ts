import { expect } from '@playwright/test';

import { getIdentifiersToTest, runInstanceTests } from '@/common/context.js';

function testInstance(instanceId: string) {
  runInstanceTests(instanceId, ({ test }) => {
    test('basic layout', async ({ page, ctx }) => {
      await test.step('Initial page load', async () => {
        await ctx.navigateTo(page, ctx.baseURL);

        test.slow();
        // Branding navigation bar and main content should be visible in all instances
        await ctx.waitForNavbarVisible(page);
        await expect(page.locator('main#main')).toBeVisible();
        await ctx.waitForLoaded(page);
      });

      await ctx.waitForLoaded(page);

      await test.step('Progress tracking indicator', async () => {
        // Progress-tracked instances render a status indicator on their outcome
        // pages; everything else must not.
        const indicator = page.getByTestId('progress-indicator');
        const isProgressTrackedOutcomePage =
          ctx.hasProgressTracking() && ctx.getFrontPage()?.__typename === 'OutcomePage';

        if (isProgressTrackedOutcomePage) {
          await expect(indicator.first()).toBeVisible();
        } else {
          await expect(indicator).toHaveCount(0);
        }
      });

      await ctx.takeScreenshot(page, 'front-page');
    });
  });
}

getIdentifiersToTest().forEach((instance) => testInstance(instance));
