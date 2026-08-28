import { expect } from '@/common/base-test.js';
import { getIdentifiersToTest, runInstanceTests } from '@/common/context.js';

function testInstance(instanceId: string) {
  runInstanceTests(instanceId, ({ test }) => {
    test('progress tracking indicator', async ({ page, ctx }) => {
      test.skip(!ctx.hasProgressTracking(), 'Instance does not track progress');
      const outcomePage = ctx.getPageOfType('OutcomePage');
      test.skip(!outcomePage, 'No outcome page for instance');
      if (!outcomePage) return;
      test.slow();

      const latestProgressYear = ctx.getProgressYears()[0];

      await ctx.navigateTo(page, `${ctx.baseURL}${outcomePage.urlPath}`);

      const indicator = page.getByTestId('progress-indicator').first();
      await expect(indicator).toBeVisible();
      // The indicator always reports the latest year with measured data
      await expect(indicator).toContainText(
        `${ctx.i18n.t('calculated-emissions')} (${latestProgressYear})`
      );
      await expect(indicator.getByTestId('progress-status-badge')).toBeVisible();

      await ctx.takeScreenshot(page, 'progress-tracking-indicator');
    });

    test('progress tracking details', async ({ page, ctx }) => {
      test.skip(!ctx.hasProgressTracking(), 'Instance does not track progress');
      const outcomePage = ctx.getPageOfType('OutcomePage');
      test.skip(!outcomePage, 'No outcome page for instance');
      if (!outcomePage) return;
      test.slow();

      const progressYears = ctx.getProgressYears();
      const latestProgressYear = progressYears[0];
      const calculatedEmissions = ctx.i18n.t('calculated-emissions');
      const plannedEmissions = ctx.i18n.t('planned-emissions');

      await ctx.navigateTo(page, `${ctx.baseURL}${outcomePage.urlPath}`);

      const indicator = page.getByTestId('progress-indicator').first();
      const modal = page.getByTestId('progress-tracking-modal');

      await test.step('Open the details drawer', async () => {
        await expect(modal).toHaveCount(0);
        // Only the root outcome node offers the "view details" link
        const viewDetails = indicator.getByTestId('progress-view-details');
        await expect(viewDetails).toBeVisible();
        await ctx.waitForNetworkIdle(page, { timeout: 15000 }, async () => {
          await viewDetails.click();
          await expect(modal).toBeVisible();
          await ctx.waitForLoaded(page);
        });
      });

      await test.step('Planned and calculated emissions are compared', async () => {
        const cards = modal.getByTestId('emissions-card');
        await expect(cards).toHaveCount(2);
        await expect(cards.first()).toContainText(`${plannedEmissions} (${latestProgressYear})`);
        await expect(cards.last()).toContainText(`${calculatedEmissions} (${latestProgressYear})`);
        await expect(
          modal.getByTestId('progress-emissions-chart').locator('canvas').first()
        ).toBeVisible();
        // Wait for the ECharts canvas animation to complete
        await page.waitForTimeout(2000);
        await ctx.takeScreenshot(page, 'progress-tracking-details');
      });

      // The year selector only renders when there is more than one year to choose from
      if (progressYears.length > 1) {
        await test.step('Switch the tracked year', async () => {
          const yearSelector = modal.getByTestId('progress-year-selector');
          await expect(yearSelector).toContainText(`${latestProgressYear}`);

          const previousYear = progressYears[1];
          await yearSelector.getByRole('button', { name: `${latestProgressYear}` }).click();
          await ctx.waitForNetworkIdle(page, { timeout: 15000 }, async () => {
            await page.getByRole('menuitem', { name: `${previousYear}`, exact: true }).click();
            await ctx.waitForLoaded(page);
          });

          await expect(yearSelector).toContainText(`${previousYear}`);
          await expect(modal.getByTestId('emissions-card').first()).toContainText(
            `${plannedEmissions} (${previousYear})`
          );
        });
      }

      await test.step('Close the details drawer', async () => {
        await modal.getByRole('button', { name: 'Close' }).click();
        await expect(modal).toHaveCount(0);
      });
    });
  });
}

getIdentifiersToTest().forEach((instance) => testInstance(instance));
