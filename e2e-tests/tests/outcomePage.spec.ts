/* eslint-disable react-hooks/rules-of-hooks */
import { expect, test } from '@/common/base-test.js';
import { InstanceContext, getIdentifiersToTest } from '@/common/context.js';

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
    test.beforeEach(async () => {
      return;
    });

    test('outcome page', async ({ page, ctx }) => {
      const outcomePage = ctx.getPageOfType('OutcomePage');
      test.skip(!outcomePage, 'No outcome page for instance');
      if (!outcomePage) return;

      await test.step('Navigate to outcome page', async () => {
        await ctx.navigateTo(page, `${ctx.baseURL}${outcomePage.urlPath}`);
        await expect(page).toHaveURL(`${ctx.baseURL}${outcomePage.urlPath}`, { timeout: 3000 });
        await ctx.checkMeta(page);
        await ctx.waitForLoaded(page);
      });

      await test.step('There should be a plot', async () => {
        await expect(page.locator('.plot-container canvas').nth(0)).toBeVisible();
        // Wait for ECharts canvas animation to complete
        await page.waitForTimeout(2000);
      });
    });
  });

getIdentifiersToTest().forEach((instance) => testInstance(instance));
