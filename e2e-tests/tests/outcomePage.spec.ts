/* eslint-disable react-hooks/rules-of-hooks */
import type { Locator, Page, Request } from 'playwright';

import { expect, test } from '@/common/base-test.js';
import { InstanceContext, getIdentifiersToTest } from '@/common/context.js';

class InflightRequests {
  private _page: Page;
  private _requests: Set<Request>;
  private onStarted: (request: Request) => void;
  private onFinished: (request: Request) => void;

  constructor(page: Page) {
    this._page = page;
    this._requests = new Set();
    this.onFinished = (request: Request) => this._requests.delete(request);
    this.onStarted = (request: Request) => this._requests.add(request);
    this._page.on('request', this.onStarted);
    this._page.on('requestfinished', this.onFinished);
    this._page.on('requestfailed', this.onFinished);
  }

  inflightRequests() {
    return Array.from(this._requests);
  }

  stop() {
    this._page.removeListener('request', this.onStarted);
    this._page.removeListener('requestfinished', this.onFinished);
    this._page.removeListener('requestfailed', this.onFinished);
  }
}

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
        await ctx.waitForNavbarVisible(page);
        await ctx.waitForLoaded(page);
      });

      await test.step('There should be a plot', async () => {
        await expect(page.locator('.plot-container canvas').nth(0)).toBeVisible();
        // Wait for ECharts canvas animation to complete
        await page.waitForTimeout(2000);
      });
    });

    test('edit scenario', async ({ page, ctx }) => {
      const outcomePage = ctx.getPageOfType('OutcomePage');
      test.skip(!outcomePage, 'No outcome page for instance');
      if (!outcomePage) return;

      await ctx.navigateTo(page, `${ctx.baseURL}${outcomePage.urlPath}`);

      const scenarioEditor = page.getByTestId('scenario-editor');
      const scenarioEditButton = page.locator('button[aria-controls="scenario-editor"]');
      const scenarioPanelSelector = page.getByTestId('scenario-panel-selector');
      const scenarioSelectInput = scenarioPanelSelector.locator('input[name="scenario"]');
      const outcomeCardSet = page.getByTestId('outcome-card-set').first();

      await test.step('Click edit scenario', async () => {
        await expect(scenarioPanelSelector).toBeVisible();
        await expect(scenarioSelectInput).not.toHaveValue('custom');
        await expect(outcomeCardSet).toBeVisible();
        await expect(outcomeCardSet).not.toHaveAttribute('data-scenario-id', 'custom');
        await expect(scenarioEditor).not.toBeVisible();
        await expect(scenarioEditButton).toBeVisible();
        await scenarioEditButton.click();
        await expect(scenarioEditor).toBeVisible();
        await ctx.waitForLoaded(page);
        await ctx.takeScreenshot(page, 'scenario-edit-dialog');
      });

      await test.step('Modify scenario', async () => {
        test.skip(ctx.getVisibleActions().length === 0, 'No visible actions for instance');
        const actionsChooser = scenarioEditor.getByTestId('actions-chooser');
        await expect(actionsChooser).toBeVisible();
        const actionToggle = actionsChooser
          .getByTestId('action-list-item')
          .getByRole('switch')
          .first();
        await expect(actionToggle).toBeVisible();

        const requestTracker = new InflightRequests(page);
        await actionToggle.click();
        await expect(scenarioSelectInput).toHaveValue('custom');
        await ctx.waitForLoaded(page);
        await expect.poll(() => requestTracker.inflightRequests().length).toBe(0);
        requestTracker.stop();
        await expect(outcomeCardSet).toBeVisible();
        await expect(outcomeCardSet).toHaveAttribute('data-scenario-id', 'custom');
        await ctx.takeScreenshot(page, 'scenario-edit-modified');
      });

      await test.step('Choose default scenario', async () => {
        await scenarioPanelSelector.click();
        const options = await page.locator('#menu-scenario').getByRole('option').all();
        let defaultOption: Locator | null = null;
        for (const option of options) {
          const value = await option.getAttribute('data-value');
          if (value === 'default') {
            defaultOption = option;
            break;
          }
        }
        expect(defaultOption).toBeDefined();
        if (!defaultOption) {
          throw new Error('Default scenario not found');
        }
        await expect(defaultOption).toBeVisible();
        await defaultOption.click();
        await ctx.waitForLoaded(page);
        await expect(outcomeCardSet).toHaveAttribute('data-scenario-id', 'default');
      });

      await test.step('Close scenario editor', async () => {
        await scenarioEditButton.click();
        await expect(scenarioEditor).not.toBeVisible();
        await ctx.waitForLoaded(page);
        await ctx.takeScreenshot(page, 'scenario-edit-closed');
      });
    });
  });

getIdentifiersToTest().forEach((instance) => testInstance(instance));
