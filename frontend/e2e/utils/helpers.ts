import { Page, expect } from '@playwright/test';

/**
 * Utility: Wypełnij formularz
 */
export async function fillForm(
  page: Page,
  data: Record<string, string | number | boolean>
) {
  for (const [label, value] of Object.entries(data)) {
    // Szukaj pola po label, placeholder, aria-label
    const input = page.locator(
      `input[placeholder*="${label}"], input[aria-label*="${label}"], [data-testid="field-${label}"]`
    ).first();

    if (await input.isVisible()) {
      await input.fill(String(value));
    }
  }
}

/**
 * Utility: Kliknij przycisk po tekście
 */
export async function clickButton(page: Page, text: string | RegExp) {
  const button = page.locator(`button:has-text("${text}"), button:contains("${text}")`).first();
  await button.click();
}

/**
 * Utility: Przejdź do ścieżki URL
 */
export async function navigate(page: Page, path: string) {
  const maxAttempts = 5;
  let attempt = 0;
  for (; attempt < maxAttempts; attempt++) {
    try {
      await page.goto(path);
      await page.waitForLoadState('domcontentloaded');

      // Wait for either nav or main content to appear
      const ready = page.locator('nav, main, [data-testid="app-root"]').first();
      await ready.waitFor({ timeout: 15000 }).catch(() => null);
      return;
    } catch (err: any) {
      // If connection refused, retry a few times with backoff
      const msg = String(err?.message || err);
      if (msg.includes('ECONNREFUSED') || msg.includes('ENOTFOUND') || msg.includes('NS_ERROR_CONNECTION_REFUSED')) {
        const backoff = 500 + attempt * 500;
        await page.waitForTimeout(backoff);
        continue;
      }
      throw err;
    }
  }
  // Final attempt (let exception propagate if it fails)
  await page.goto(path);
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Czekaj na toast/notification
 */
export async function waitForNotification(
  page: Page,
  pattern: string | RegExp,
  timeout = 5000
) {
  const notification = page.locator('[role="status"], [role="alert"]');
  await notification.filter({ hasText: pattern }).waitFor({ timeout }).catch(() => null);
  return notification;
}

/**
 * Create a company via API (useful to seed data for tests)
 */
export async function apiCreateCompany(page: Page, payload: any) {
  // Use Playwright request to hit the dev server proxy (/api -> backend)
  const response = await page.request.post('/api/companies', {
    data: payload,
  });
  if (response.ok()) {
    return await response.json();
  }
  return null;
}

/**
 * Utility: Czekaj na tabelę i sprawdzaj wiersz
 */
export async function findTableRow(page: Page, searchText: string) {
  const row = page.locator(`table tr:has-text("${searchText}")`).first();
  await row.waitFor({ timeout: 15000 }).catch(() => null);
  return row;
}

/**
 * Utility: Pobierz dane z tabeli
 */
export async function getTableData(page: Page, tableSelector = 'table') {
  const table = page.locator(tableSelector).first();
  const rows = await table.locator('tbody tr').all().catch(() => []);

  const data = [];
  for (const row of rows) {
    const cells = await row.locator('td').all();
    const rowData = [];
    for (const cell of cells) {
      rowData.push(await cell.textContent());
    }
    data.push(rowData);
  }
  return data;
}

/**
 * Utility: Sprawdź input ma wartość
 */
export async function expectInputValue(
  page: Page,
  label: string,
  expectedValue: string
) {
  const input = page.locator(`input[aria-label*="${label}"]`).first();
  await expect(input).toHaveValue(expectedValue);
}

/**
 * Utility: Sprawdź element widoczny
 */
export async function expectVisible(page: Page, text: string | RegExp) {
  let element;
  if (text instanceof RegExp) {
    element = page.getByText(text).first();
  } else {
    element = page.locator(`text="${text}"`).first();
  }
  await expect(element).toBeVisible();
}

/**
 * Utility: Czekaj na modal/dialog
 */
export async function waitForModal(page: Page) {
  await page.locator('[role="dialog"]').waitFor({ timeout: 5000 });
}

/**
 * Utility: Zamknij modal
 */
export async function closeModal(page: Page) {
  // Szukaj przycisku Close, X, Anuluj
  const closeButton = page.locator(
    `button:has-text("Zamknij"), button:has-text("Anuluj"), button:has-text("✕"), [aria-label="Close"]`
  ).first();

  if (await closeButton.isVisible()) {
    await closeButton.click();
  }

  // Czekaj, aż modal zniknie
  await page.locator('[role="dialog"]').waitFor({ state: 'hidden', timeout: 3000 });
}

/**
 * Utility: Wybierz opcję z combobox/select
 */
export async function selectOption(page: Page, label: string, option: string) {
  // Szukaj combobox'a
  const select = page.locator(`[aria-label*="${label}"]`).first();
  await select.click();

  // Czekaj na opcje
  await page.waitForTimeout(100);

  // Kliknij opcję
  const optionElement = page.locator(`text="${option}"`).first();
  await optionElement.click();
}

/**
 * Utility: Czekaj na ładowanie
 */
export async function waitForLoading(page: Page) {
  // Czekaj na spinner, skeleton, lub loading state
  const loader = page.locator(
    '[class*="loading"], [class*="spinner"], [data-testid="loader"]'
  ).first();

  if (await loader.isVisible()) {
    await loader.waitFor({ state: 'hidden', timeout: 10000 });
  }

  await page.waitForLoadState('networkidle');
}
