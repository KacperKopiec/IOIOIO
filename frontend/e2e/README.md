# End-to-End Tests (Playwright)

Pełne testy przełożenia funkcjonalności aplikacji z perspektywy użytkownika.

## Struktura

```
e2e/
├── auth.spec.ts           # Logowanie, przełączanie ról
├── pipeline.spec.ts       # Lejek pozyskiwania firm (5 etapów)
├── companies.spec.ts      # CRUD firm, filtry, role-based features
├── events.spec.ts         # Zarządzanie eventami (Koordynator)
├── contacts.spec.ts       # Zarządzanie kontaktami
├── dashboard.spec.ts      # Dashboard, raporty, statystyki
├── fixtures/
│   └── auth.ts            # Fixture do autentykacji
└── utils/
    └── helpers.ts         # Utility do form, nawigacji, asercji
```

## Scenariusze testowe

### auth.spec.ts
- Ładowanie aplikacji
- Przełączanie między 3 rolami (promocja, koordynator, opiekun)
- Persystencja roli across navigation
- Role-based UI (różne elementy dla każdej roli)

### pipeline.spec.ts
- Tworzenie firmy i start pipeline (Kontakt)
- Przejścia między etapami: Kontakt → Oferta wysłana → Negocjacje → Decyzja: TAK
- Odrzucenie firmy (Odrzucony)
- Śledzenie dat (first_contact_at, offer_sent_at, closed_at)

### companies.spec.ts
- Wyświetlanie listy firm
- Tworzenie, edycja (Opiekun only), usuwanie firmy
- Filtry (branża, etap)
- Sortowanie
- Role-based access (Promocja nie widzi przycisku "Edytuj dane")

### events.spec.ts
- Wyświetlanie eventów
- Tworzenie, edycja (Koordynator only), usuwanie
- Dodawanie firm do eventu
- KPI (jeśli dostępne)
- Filtry i sortowanie

### contacts.spec.ts
- CRUD kontaktów
- Wyszukiwanie i filtry (po firmie, stanowisku)
- Linkowanie z firmą
- Historia aktywności

### dashboard.spec.ts
- Statystyki pipeline
- Liczby firm na etapach
- KPI eventów
- Role-based dashboard content
- Raporty
- Globalne filtry i wyszukiwanie

## Uruchomienie

### Przygotowanie

```bash
# Upewnij się, że backend i baza są uruchomione
docker compose up -d
docker exec crm-backend uv run alembic upgrade head
docker exec crm-backend uv run python -m app.db.seeds_demo
```

### Testy

```bash
cd frontend

# Wszystkie testy
npm run e2e

# Tryb UI (najfajniej do debugowania)
npm run e2e:ui

# Z przeglądarką widoczną
npm run e2e:headed

# Debug mode
npm run e2e:debug
```

### Raport

```bash
npx playwright show-report
```

## Lokatory i selektory

Testy używają przede wszystkim **tekstu i accessibility attributes**:

```typescript
// Po tekście
page.locator('text="Dodaj firmę"')
page.locator('button:has-text("Zapisz")')

// Po accessibility
page.locator('[aria-label="Zamknij"]')
page.locator('[role="dialog"]')

// Po data-testid
page.locator('[data-testid="company-name"]')
```

## Fixture: switchRole

```typescript
import { switchRole, ROLES } from '../fixtures/auth';

await switchRole(page, ROLES.opiekun);  // Switch to "Opiekun" role
```

Dev role switcher dostępny tylko w `import.meta.env.DEV` (Vite dev mode).

## Utils: helpers

- `fillForm(page, data)` — Wypełnia formularz
- `clickButton(page, text)` — Klika przycisk po tekście
- `navigate(page, path)` — Przejdź do ścieżki
- `findTableRow(page, searchText)` — Szukaj wiersza w tabeli
- `getTableData(page, selector)` — Pobierz wszystkie dane z tabeli
- `waitForNotification(page, pattern)` — Czekaj na toast/alert
- `expectVisible(page, text)` — Assert że element jest widoczny
- `selectOption(page, label, option)` — Wybierz z combobox/select
- `waitForLoading(page)` — Czekaj na spinner/loader

## Konfiguracja (playwright.config.ts)

- **baseURL**: `http://localhost:5173`
- **timeout**: 30s (per test)
- **webServer**: automatycznie uruchamia `npm run dev`
- **retries**: 2 na CI, 0 w dev
- **workers**: 1 (sequential, żeby nie było race conditions)
- **trace/screenshot/video**: "on-first-retry"

## CI/CD

W CI (GitHub Actions) testy powinny:
1. Upewnić się, że docker compose jest uruchomiony
2. Poczekać, aż backend jest ready (health check)
3. Zaladować seed data
4. Uruchomić `npm run e2e`
5. Przesłać artefakty (playwright-report/, test-results/)

Przykład GitHub Actions workflow:

```yaml
- name: Run e2e tests
  run: |
    cd frontend
    npm run e2e
    
- name: Upload Playwright Report
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: playwright-report
    path: frontend/playwright-report/
    retention-days: 30
```

## Best Practices

1. **Czekaj na networkidle**: `await page.waitForLoadState('networkidle')`
2. **Czekaj na element**: `await element.waitFor()`
3. **Timeout dla element actions**: `{ timeout: 5000 }`
4. **Unikaj sleep**: używaj waitFor / waitForLoadState zamiast setTimeout
5. **Asercje**: `expect(await element.isVisible()).toBeTruthy()`
6. **Czekaj na toasty**: `await waitForNotification(page, /pattern/)`

## Troubleshooting

- **Timeout przy logowaniu**: backend nie startuje. Sprawdź `docker ps`, czy serwer żyje.
- **Element not found**: element może być ukryty. Dodaj screenshot: `await page.screenshot()`
- **Flaky testy**: zwłaszcza przy filtrach. Dodaj `waitForLoadState('networkidle')` po action.
- **Role switcher nie widoczny**: sprawdzić, czy testm uruchamiasz w dev mode (Vite, nie build).
