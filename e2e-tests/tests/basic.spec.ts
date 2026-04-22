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
      await ctx.takeScreenshot(page, 'front-page');
    });
  });
}

getIdentifiersToTest().forEach((instance) => testInstance(instance));
