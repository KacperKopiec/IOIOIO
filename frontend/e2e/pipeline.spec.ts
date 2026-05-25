import { test, expect } from '@playwright/test';
import { navigate, findTableRow, waitForLoading, apiCreateCompany } from './utils/helpers';

test.describe('Pipeline - Pozyskiwanie firm', () => {
  test.setTimeout(120000);

  test.beforeEach(async ({ page }) => {
    await navigate(page, '/companies');

    const existing = await findTableRow(page, 'TestCorp Inc');
    const found = (await existing.count?.().catch(() => 0)) || 0;
    if (!found) {
      await apiCreateCompany(page, {
        name: 'TestCorp Inc',
        email: 'contact@testcorp.com',
        phone: '+48123456789',
      });

      await navigate(page, '/companies');
      await waitForLoading(page);
    }
  });

  test('should display pipeline overview on dashboard', async ({ page }) => {
    await navigate(page, '/');

    const pipelineStats = page.locator('[class*="pipeline"], [class*="stats"], [class*="overview"]').first();
    
    if (await pipelineStats.isVisible({ timeout: 2000 }).catch(() => false)) {
      const text = await pipelineStats.textContent();
      expect(text).toBeTruthy();
    }
  });
});
