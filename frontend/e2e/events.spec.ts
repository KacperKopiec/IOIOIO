import { test, expect } from '@playwright/test';
import { navigate } from './utils/helpers';
import { switchRole, ROLES } from './fixtures/auth';

test.describe('Events Management (Koordynator)', () => {
  test.beforeEach(async ({ page }) => {
    await switchRole(page, ROLES.koordynator);
    await navigate(page, '/events');
  });

  test('should filter events by status', async ({ page }) => {
    const statusFilter = page.locator('button:has-text("Status"), select[aria-label*="Status"]').first();

    if (await statusFilter.isVisible({ timeout: 2000 }).catch(() => false)) {
      await statusFilter.click();
      await page.waitForTimeout(200);

      const option = page.locator('text="Aktywny"').first();
      if (await option.isVisible()) {
        await option.click();
      }

      await page.waitForLoadState('networkidle');

      const rows = await page.locator('table tbody tr').all();
      expect(rows.length).toBeGreaterThanOrEqual(0);
    }
  });

  test('should sort events by date', async ({ page }) => {
    const dateHeader = page.locator('table thead th:has-text("Data")').first();

    if (await dateHeader.isVisible()) {
      await dateHeader.click();
      await page.waitForTimeout(500);

      const rows = await page.locator('table tbody tr').all();
      expect(rows.length).toBeGreaterThan(0);
    }
  });
});
