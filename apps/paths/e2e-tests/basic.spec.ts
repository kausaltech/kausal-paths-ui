import { test as base, expect } from '@playwright/test';
import { InstanceContext, getIdentifiersToTest } from './context';

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

    test.beforeEach(async ({ page }) => {
      return;
      // FIXME: Enable later
      page.on('console', (msg) => {
        if (msg.text().includes('ReactDOM.hydrate is no longer supported'))
          return;
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
        await page.goto(ctx.baseURL);
        await ctx.checkMeta(page);

        test.slow();
        await expect(page.locator('nav#global-navigation-bar')).toBeVisible();
        await expect(page.locator('main#main')).toBeVisible();
        await ctx.waitForLoaded(page);
      });

      await test.step('There should be a plot', async () => {
        await expect(page.locator('.plot-container svg').nth(0)).toBeVisible();
      });
      await ctx.waitForLoaded(page);
      await expect(page).toHaveScreenshot({ fullPage: true });
    });
    test('action list page', async ({ page, ctx }) => {
      const listItem = ctx.getActionListPage()!;
      test.skip(!listItem, 'No action list page for instance');

      await page.goto(ctx.baseURL);
      await ctx.checkMeta(page);

      const nav = page.locator('nav#global-navigation-bar');
      const link = nav.getByRole('link', {
        name: listItem.title,
        exact: true,
      });

      await expect(link).toBeVisible();
      await ctx.waitForLoaded(page);

      // Test SPA navigation
      await link.click();
      await ctx.checkMeta(page);

      await expect
        .configure({ timeout: 15000 })(page.getByRole('tab').first())
        .toBeVisible();

      await ctx.waitForLoaded(page);
      await expect(page).toHaveScreenshot(`action-list-${instanceId}.png`, {
        fullPage: true,
      });

      // Test direct URL navigation
      await page.goto(`${ctx.baseURL}/${listItem.urlPath}`);
      await ctx.checkMeta(page);
      await ctx.waitForLoaded(page);
      await expect
        .configure({ timeout: 5000 })(
          page.getByRole('tab').locator('visible=true').first()
        )
        .toBeVisible();

      //const ss = await page.screenshot({ fullPage: true });
      //expect(ss).toMatchSnapshot('action-list.png');
    });
    test('action details page', async ({ page, ctx }) => {
      test.skip(
        ctx.instance.actions.length == 0,
        'No actions defined in instance'
      );
      await page.goto(ctx.getActionURL(ctx.instance.actions[0]));
      await ctx.checkMeta(page);
      await ctx.waitForLoaded(page);

      await expect(page.locator('nav[aria-label="breadcrumb"]')).toBeVisible();
      await expect(
        page.locator('main a').getByText(ctx.i18n.t('read-more'))
      ).toBeVisible();
      await expect(page).toHaveScreenshot({ fullPage: true });
    });
  });

getIdentifiersToTest().forEach((instance) => testInstance(instance));
