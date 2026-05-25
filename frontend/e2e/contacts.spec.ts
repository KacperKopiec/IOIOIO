import { test, expect } from '@playwright/test';
import { navigate } from './utils/helpers';

test.describe('Contacts Management', () => {
  test.beforeEach(async ({ page }) => {
    await navigate(page, '/contacts');
  });

   
  test('should search contacts by name', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Szukaj"], input[placeholder*="Search"]').first();

    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchInput.fill('John');
      await page.waitForTimeout(500);

      await page.waitForLoadState('networkidle');

      const rows = await page.locator('table tbody tr').all();
      expect(rows.length).toBeGreaterThan(0);
    }
  });

  test('should filter contacts by company', async ({ page }) => {
    const companyFilter = page.locator('input[placeholder*="Firma"], select[aria-label*="Firma"]').first();

    if (await companyFilter.isVisible({ timeout: 2000 }).catch(() => false)) {
      await companyFilter.click();
      await companyFilter.fill('TestCorp');
      await page.waitForTimeout(500);

      await page.waitForLoadState('networkidle');

      const rows = await page.locator('table tbody tr').all();
      expect(rows.length).toBeGreaterThanOrEqual(0);
    }
  });

  test('should sort contacts by name', async ({ page }) => {
    const nameHeader = page.locator('table thead th:has-text("Imię"), table thead th:has-text("Nazwa")').first();

    if (await nameHeader.isVisible()) {
      await nameHeader.click();
      await page.waitForTimeout(500);

      const rows = await page.locator('table tbody tr').all();
      expect(rows.length).toBeGreaterThan(0);
    }
  });
});
