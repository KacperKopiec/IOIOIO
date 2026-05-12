# Dev

## Uruchomienie lokalnie

Tak samo jak w [[install]], ale w trybie deweloperskim zwykle nie
budujemy frontu — Vite na `:5173` serwuje na bieżąco.

```bash
docker compose up -d
docker exec crm-backend uv run alembic upgrade head
docker exec crm-backend uv run python -m app.db.seeds
docker exec crm-backend uv run python -m app.db.seeds_demo
```

Sprawdzenie:

```bash
curl http://localhost:8000/health           # backend bezpośrednio
curl http://localhost:5173/                 # Vite (no auth)
curl -u admin:pass http://localhost/api/health   # przez nginx
```

## Layout repo

```
backend/
  app/
    api/        # routery FastAPI (jeden plik na zasób)
    core/       # config, logging
    db/         # base, session, seeds, seeds_demo
    models/    # SQLAlchemy 2.0 + enumy
    schemas/   # Pydantic v2
    services/  # reguły biznesowe (pipeline, kpi, dashboard, reports)
    main.py
  migrations/  # Alembic (versions/0001_init.py, 0002_add_company_notes.py)
  tests/       # pytest, 45 testów
frontend/
  src/
    components/
      ui/          # Page, PageHeader, Button, Card, Badge, KpiCard,
                  # TagSelector, Modal, ProgressBar, Pagination, …
      Firms/, Events/, EventDetail/, EventPipeline/, EventCompany/,
      CompanyDetail/, modals/, Layout/, Sidebar/, TopBar/
    context/      # AuthContext (rola + setRole)
    hooks/api/    # jeden plik per zasób (companies, events, …)
    lib/          # api.ts (axios), queryClient.ts, format.ts
    pages/        # Dashboard, Firms, Events, EventDetail, EventPipeline,
                  # EventCompany, CompanyDetail, Reports
    types/api.ts  # TypeScript mirror Pydantic schemas
    test/setup.ts
    index.css     # tokens
  vite.config.ts
  vitest.config.ts
docs/
  architecture.md, install.md, api.md, admin.md, dev.md
```

## Gdzie są seedy

- `backend/app/db/seeds.py` — referencja (pipeline stages, roles, industries,
  tags, relationship_types, 3 użytkownicy demo). Idempotentne.
- `backend/app/db/seeds_demo.py` — ~20 firm, 3 wydarzenia, ~30
  wpisów pipeline, ~50 aktywności. Też idempotentne, ale dorzucają
  nowe wiersze przy każdym pełnym wywołaniu, więc puszczać tylko po
  resecie schema.

## Reset bazy

```bash
docker exec -it crm-db psql -U postgres -d app_db -c \
  "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
docker exec crm-backend uv run alembic upgrade head
docker exec crm-backend uv run python -m app.db.seeds
docker exec crm-backend uv run python -m app.db.seeds_demo
```

## Testy

### Backend (pytest)

```bash
docker exec crm-backend uv run pytest tests -q
```

45 testów (smoke + reguły biznesowe + KPI + filtry + tagi). Część
testów mutuje stan w bazie (np. pipeline move) i czyści po sobie —
nie odpalać równolegle.

### Frontend (vitest)

```bash
docker exec crm-frontend npm run test           # single run
docker exec crm-frontend npm run test:watch     # interaktywnie
```

29 testów (`lib/format`, `Button`, `Badge`, `KpiCard`, `Breadcrumb`).

### Build produkcyjny

```bash
docker exec crm-frontend npm run build
```

## Konwencje

- **CSS Modules + tokeny** z `src/index.css`. Żadnego tailwinda. Nigdy
  literalnych hex'ów w *.module.css poza `components/ui/*`.
- **TypeScript** — żadnego `any`, importy posortowane (eslint stoi nad
  tym). Nazwy plików komponentów `PascalCase.tsx`, hooki `camelCase.ts`.
- **Polski w UI**, angielski w nazwach plików / commitów / klas.
- **Layer separation** — strony nie odwołują się do `api.ts` wprost,
  zawsze przez hook z `hooks/api/`.
- **Commitów nie podpisujemy „🤖 Generated with…”**, treść trzyma się
  konwencji konkretnego repo (terse imperative, czasem niski case).

## Dev role switcher

W `TopBar`, widoczny tylko gdy `import.meta.env.DEV`. Pozwala
przełączać AuthContext.role między `koordynator | opiekun | promocja`
i z każdej roli widać inny dashboard + różne CTA są aktywne
(`Edytuj dane` w `/companies/:id` tylko dla opiekuna, `Edytuj` na
`/events/:id` tylko dla koordynatora).

## Dodawanie nowego endpointu

1. Model (`app/models/*.py`) + ewentualna migracja `alembic revision --autogenerate`.
2. Pydantic schema (`app/schemas/*.py`).
3. Router (`app/api/*.py`) — pamiętaj o `selectinload` dla relacji, żeby uniknąć N+1.
4. Test smoke + co najmniej jeden walidacyjny w `backend/tests/`.
5. Typy w `frontend/src/types/api.ts`.
6. Hook w `frontend/src/hooks/api/<resource>.ts`.
7. Użycie w stronie / komponencie.

## Dodawanie nowej zmiennej środowiskowej

1. Wstaw do `.env` (lokalnie + produkcyjnie).
2. Dodaj do `backend/app/core/config.py` (`Settings`).
3. Użyj z `get_settings()` lub przez dependency injection.

Nie commituj `.env`.
