/* eslint-disable react-hooks/rules-of-hooks */
import { test as base, expect } from '@playwright/test';

import { InstanceContext, getIdentifiersToTest } from '@/common/context.js';

const test = base.extend<{ ctx: InstanceContext }>({});

const testInstance = (instanceId: string) =>
  test.describe(instanceId, () => {
    test.describe.configure({ mode: 'serial' });

    test.use({
      ctx: async ({}, use) => {
        const planInfo = await InstanceContext.fromInstanceId(instanceId);
        await use(planInfo);
      },
    });

    // eslint-disable-next-line @typescript-eslint/require-await
    test.beforeEach(async ({ page }) => {
      return;
      // FIXME: Enable later
      page.on('console', (msg) => {
        if (msg.text().includes('ReactDOM.hydrate is no longer supported')) return;
        if (msg.type() === 'error') {
          console.log(msg.text());
          throw new Error('Browser console got error output');
        } else if (msg.type() === 'warning') {
          console.log(msg.text());
          throw new Error('Browser console got warning output');
        }
      });
    });

    test('basic layout', async ({ page, ctx }) => {
      await test.step('Initial page load', async () => {
        await ctx.navigateTo(page, ctx.baseURL);

        test.slow();
        // Branding navigation bar and main content should be visible in all instances
        await expect(page.locator('nav#branding-navigation-bar')).toBeVisible();
        await expect(page.locator('main#main')).toBeVisible();
        await ctx.waitForLoaded(page);
      });

      await ctx.waitForLoaded(page);
      //await expect(page).toHaveScreenshot({ fullPage: true });
    });
  });

getIdentifiersToTest().forEach((instance) => testInstance(instance));
