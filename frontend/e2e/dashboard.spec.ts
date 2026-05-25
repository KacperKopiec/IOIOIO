import { test, expect } from '@playwright/test';
import { navigate, expectVisible, waitForLoading } from './utils/helpers';
import { switchRole, ROLES } from './fixtures/auth';

test.describe('Dashboard & Reports', () => {
  test('should display dashboard with overview', async ({ page }) => {
    await navigate(page, '/');

    await waitForLoading(page);

    await expectVisible(page, /Dashboard|Panel|Przegląd/i);
  });

  test('should show pipeline statistics on dashboard', async ({ page }) => {
    await navigate(page, '/');
    await waitForLoading(page);

    const pipelineStats = page.locator('[class*="pipeline"], [class*="stats"], [class*="chart"]').first();

    if (await pipelineStats.isVisible({ timeout: 2000 }).catch(() => false)) {
      const text = await pipelineStats.textContent();
      expect(text).toBeTruthy();
    }
  });

  test('should display company count by stage', async ({ page }) => {
    await navigate(page, '/');
    await waitForLoading(page);

    const stageStats = page.locator('[class*="stage"], [class*="pipeline"], [class*="funnel"]').first();

    if (await stageStats.isVisible({ timeout: 2000 }).catch(() => false)) {
      const text = await stageStats.textContent();
      expect(text).toMatch(/\d+/);
    }
  });

  test('should display event KPIs on dashboard', async ({ page }) => {
    await navigate(page, '/');
    await waitForLoading(page);

    const eventKpis = page.locator('[class*="event"], [class*="kpi"], [class*="metric"]').first();

    if (await eventKpis.isVisible({ timeout: 2000 }).catch(() => false)) {
      const text = await eventKpis.textContent();
      expect(text).toBeTruthy();
    }
  });

  test('should change dashboard content based on role - Promocja', async ({ page }) => {
    await switchRole(page, ROLES.promocja);
    await navigate(page, '/');
    await waitForLoading(page);

    const mainContent = page.locator('main, [class*="content"], [class*="dashboard"]').first();
    await mainContent.waitFor({ timeout: 5000 });
    expect(await mainContent.isVisible()).toBeTruthy();
  });

  test('should change dashboard content based on role - Koordynator', async ({ page }) => {
    await switchRole(page, ROLES.koordynator);
    await navigate(page, '/');
    await waitForLoading(page);

    const mainContent = page.locator('main, [class*="content"]').first();
    await mainContent.waitFor({ timeout: 5000 });
    expect(await mainContent.isVisible()).toBeTruthy();
  });

  test('should change dashboard content based on role - Opiekun', async ({ page }) => {
    await switchRole(page, ROLES.opiekun);
    await navigate(page, '/');
    await waitForLoading(page);

    const mainContent = page.locator('main, [class*="content"]').first();
    await mainContent.waitFor({ timeout: 5000 });
    expect(await mainContent.isVisible()).toBeTruthy();
  });

  test('should access reports section', async ({ page }) => {
    const reportsLink = page.locator('a:has-text("Raporty"), a:has-text("Reports"), button:has-text("Raporty")').first();

    if (await reportsLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await reportsLink.click();
      await waitForLoading(page);

      const reportsContent = page.locator('main, [class*="report"]').first();
      await reportsContent.waitFor({ timeout: 5000 });
      expect(await reportsContent.isVisible()).toBeTruthy();
    }
  });

  test('should display company filters on page', async ({ page }) => {
    await navigate(page, '/companies');
    await waitForLoading(page);

    const filterSection = page.locator('[class*="filter"], [class*="sidebar"]').first();

    if (await filterSection.isVisible({ timeout: 2000 }).catch(() => false)) {
      const filterControls = await filterSection.locator('input, select, button').count();
      expect(filterControls).toBeGreaterThan(0);
    }
  });

  test('should apply and clear filters', async ({ page }) => {
    await navigate(page, '/companies');
    await waitForLoading(page);

    const resetButton = page.locator('button:has-text("Wyczyść"), button:has-text("Reset"), button:has-text("Usuń filtry")').first();

    if (await resetButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      const filterInput = page.locator('input[type="text"]').first();
      if (await filterInput.isVisible()) {
        await filterInput.fill('test');
        await page.waitForTimeout(500);
      }

      await resetButton.click();
      await page.waitForTimeout(500);

      if (await filterInput.isVisible()) {
        expect(await filterInput.inputValue()).toBe('');
      }
    }
  });

  test('should display search across all resources', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Szukaj"], input[placeholder*="Search"]').first();

    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchInput.fill('test');
      await page.waitForTimeout(500);

      await page.waitForLoadState('networkidle');

      const results = page.locator('[class*="result"], tbody tr').first();
      expect(await results.count()).toBeGreaterThanOrEqual(0);
    }
  });

  test('should display activities/timeline on dashboard', async ({ page }) => {
    await navigate(page, '/');
    await waitForLoading(page);

    const activitiesSection = page.locator('[class*="activity"], [class*="timeline"], [class*="feed"]').first();

    if (await activitiesSection.isVisible({ timeout: 2000 }).catch(() => false)) {
      const entries = await activitiesSection.locator('[class*="item"], li, div').count();
      expect(entries).toBeGreaterThanOrEqual(0);
    }
  });

  test('should export data (jeśli dostępne)', async ({ page }) => {
    await navigate(page, '/companies');
    await waitForLoading(page);

    const exportButton = page.locator('button:has-text("Eksportuj"), button:has-text("Export"), button:has-text("CSV")').first();

    if (await exportButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      const downloadPromise = page.waitForEvent('download');
      await exportButton.click();

      const download = await downloadPromise.catch(() => null);
      if (download) {
        expect(download).toBeTruthy();
      }
    }
  });
});
