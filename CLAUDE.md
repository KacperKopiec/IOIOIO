# CLAUDE.md

Lekki CRM dla Wydziału Informatyki AGH wspierający pozyskiwanie firm‑partnerów
na wydarzenia (konferencje, hackatony, dni kariery). Monorepo, branch
roboczy `feature/crm-core`, gałąź główna `main`.

Pełna dokumentacja: `docs/` (`architecture.md`, `install.md`, `api.md`,
`admin.md`, `dev.md`).

## Role (dokładnie trzy — nie dodawać innych)

- `promocja` — Dział promocji
- `koordynator` — Koordynator wydarzenia
- `opiekun` — Opiekun partnerów

Nie wprowadzać `zarzad` ani `merytoryczna` — były świadomie usunięte.

## Stos

- Backend: Python 3.12, FastAPI, SQLAlchemy 2.0, Alembic, Pydantic v2,
  PostgreSQL 16. Uruchamiany przez `uv` w kontenerze `crm-backend`.
- Frontend: React 19 + TypeScript + Vite, React Router 7, TanStack Query,
  axios, @dnd-kit, recharts. **CSS Modules + tokeny z `src/index.css` —
  żadnego tailwinda, żadnego inline-stylowania.**
- Wdrożenie on-premises: docker compose + systemowy nginx (basic-auth).

## Routing / nginx — krytyczne

Systemowy nginx (NIE kontener) strippuje prefix `/api/`:

```
/api/companies/1   →  http://127.0.0.1:8000/companies/1
/                   →  http://127.0.0.1:5173 (Vite dev)
```

FastAPI rejestruje routery **bez** prefixu `/api`, ale uruchamia się z
`FastAPI(root_path="/api")` żeby Swagger UI generował poprawne linki.
Frontend axios używa `baseURL: '/api'`.

## Konwencje

- **Polski w UI, błędach, komunikatach.** Angielski w kodzie, nazwach
  plików, commitach.
- **Brak emoji w plikach.**
- TypeScript: żadnego `any`. Komponenty `PascalCase.tsx`, hooki
  `camelCase.ts`.
- Layer separation: strony nie wołają `lib/api.ts` wprost, zawsze przez
  hook z `hooks/api/`.
- Commitów nie podpisujemy „Generated with…”. Treść trzyma się konwencji
  repo (terse imperative).
- Backend reguły biznesowe żyją w `app/services/`, NIE w routerach.
- `selectinload` dla relacji w routerach (uniknięcie N+1).
- Nie commituj `.env` ani plików w `backend/storage/`.

## Lejek (pipeline)

Pięć etapów seedowanych w `backend/app/db/seeds.py`:
`Kontakt → Oferta wysłana → Negocjacje → Decyzja: TAK (won) → Odrzucony (lost)`.

Reguły przejść w `backend/app/services/pipeline.py`: ustawienie
`first_contact_at`, `offer_sent_at`, `closed_at`, draft
`CompanyRelationship` po WON.

## Częste komendy

```bash
docker compose up -d
docker exec crm-backend uv run alembic upgrade head
docker exec crm-backend uv run python -m app.db.seeds
docker exec crm-backend uv run python -m app.db.seeds_demo

docker exec crm-backend uv run pytest tests -q     # 45 testów
docker exec crm-frontend npm run test               # 29 testów
docker exec crm-frontend npm run build
```

Reset bazy w dev:

```bash
docker exec -it crm-db psql -U postgres -d app_db -c \
  "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
```

## Dev role switcher

Widoczny tylko w `import.meta.env.DEV`, w `TopBar`. Pozwala przełączać
`AuthContext.role` między trzema rolami; dashboard i CTA reagują na
zmianę (`Edytuj dane` w `/companies/:id` tylko dla `opiekun`, `Edytuj`
na `/events/:id` tylko dla `koordynator`).
