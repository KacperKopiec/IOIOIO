import { Page } from '@playwright/test';

export const ROLES = {
  promocja: 'promocja',
  koordynator: 'koordynator',
  opiekun: 'opiekun',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

/**
 * Przełącz rolę za pomocą dev role switchera
 * Role switcher dostępny tylko w import.meta.env.DEV
 */
export async function switchRole(page: Page, role: Role) {
  // Czekaj, aż aplikacja się załaduje
  await page.waitForLoadState('networkidle');

  // Znajdź i kliknij role switcher (zazwyczaj w TopBar)
  // Opcja 1: Szukaj przycisku/menu z tekstem roli
  const roleButton = page.locator('button:has-text("Rola:"), button:has-text("Role")').first();

  if (await roleButton.isVisible()) {
    await roleButton.click();
    await page.waitForTimeout(100);
  }

  // Opcja 2: Szukaj opcji z rolą w menu lub combobox
  const roleOption = page.locator(`text="${role}"`).first();
  if (await roleOption.isVisible()) {
    await roleOption.click();
  }

  // Czekaj na zmianę kontekstu
  await page.waitForTimeout(300);
}

/**
 * Zaloguj się do aplikacji (jeśli wymagane)
 */
export async function login(page: Page) {
  // Przejdź na stronę główną
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Jeśli nie ma roli wybranej, zaznacz domyślną (promocja)
  const roleSelector = page.locator('[data-testid="role-selector"]');
  if (await roleSelector.isVisible()) {
    await switchRole(page, ROLES.promocja);
  }
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
  await notification.filter({ hasText: pattern }).waitFor({ timeout });
  return notification;
}

/**
 * Czekaj na toast i sprawdzaj success/error
 */
export async function expectNotification(
  page: Page,
  pattern: string | RegExp,
  type: 'success' | 'error' | 'warning' | 'info' = 'success'
) {
  const notification = await waitForNotification(page, pattern);
  const hasType = await notification.locator(`[class*="${type}"]`).count();
  return hasType > 0;
}
