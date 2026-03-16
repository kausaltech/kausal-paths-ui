import { expect } from '@/common/base-test.js';
import { getIdentifiersToTest, runInstanceTests } from '@/common/context.js';

function testInstance(instanceId: string) {
  runInstanceTests(instanceId, ({ test }) => {
    test('action list page through menu click', async ({ page, ctx }) => {
      const listItem = ctx.getActionListPage();
      const actionListPageInMenu = listItem?.showInMenus;
      test.skip(!listItem || !actionListPageInMenu, 'No action list page in menu for instance');
      if (!listItem) return;

      await ctx.navigateTo(page, ctx.baseURL);

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

      await expect(page.getByTestId('actions-list')).toBeVisible({ timeout: 45000 });

      await ctx.waitForLoaded(page);

      await ctx.takeScreenshot(page, 'action-list-page');
    });
    test('action list page through direct URL', async ({ page, ctx }) => {
      const listItem = ctx.getActionListPage();
      const actionListPageInMenu = listItem?.showInMenus;
      // Let's skip actionlistpage even if it exists but is not in menu
      test.skip(!listItem || !actionListPageInMenu, 'No action list page in menu for instance');
      if (!listItem) return;

      await ctx.navigateTo(page, `${ctx.baseURL}${listItem.urlPath}`);
      await expect(page).toHaveURL(`${ctx.baseURL}${listItem.urlPath}`, { timeout: 3000 }); // Fix NS_BINDING_ABORTED error in Firefox
      await ctx.checkMeta(page);
      await ctx.waitForLoaded(page);
      await expect.configure({ timeout: 30000 })(page.getByTestId('actions-list')).toBeVisible();
    });
    test('action details page', async ({ page, ctx }) => {
      test.skip(ctx.instance.actions.length == 0, 'No actions defined in instance');
      const listItem = ctx.getActionListPage();
      const actionListPageInMenu = listItem?.showInMenus;
      // Let's skip actionlistpage even if it exists but is not in menu
      test.skip(!listItem || !actionListPageInMenu, 'No action list page in menu for instance');
      const action = ctx.instance.actions[0];
      await ctx.navigateTo(page, ctx.getActionURL(action));
      await ctx.checkMeta(page);
      await ctx.waitForLoaded(page);

      await expect(
        page.locator(`main a[href*="/node/${action.id}"]`).getByText(ctx.i18n.t('read-more'))
      ).toBeVisible({ timeout: 15000 });
      //await expect(page).toHaveScreenshot({ fullPage: true });

      await ctx.takeScreenshot(page, 'action-details-page');
    });
  });
}

getIdentifiersToTest().forEach((instance) => testInstance(instance));
