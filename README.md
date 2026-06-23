# IOIOIO — AGH CRM

Lekki CRM dla Wydziału Informatyki AGH wspierający pozyskiwanie firm-partnerów
na wydarzenia (konferencje, hackatony, dni kariery).

Monorepo: backend (FastAPI + PostgreSQL) + frontend (React + Vite), uruchamiane
przez `docker compose`. Wdrożenie on-premises za systemowym nginx z basic-auth.

- Backend: Python 3.12, FastAPI, SQLAlchemy 2.0, Alembic, Pydantic v2, PostgreSQL 16.
- Frontend: React 19 + TypeScript + Vite, React Router 7, TanStack Query.
- Pełna dokumentacja: `docs/` (`install.md`, `architecture.md`, `api.md`,
  `admin.md`, `dev.md`). Wskazówki dla AI/agentów: `CLAUDE.md`.

## Wymagania

- Linux z Dockerem i `docker compose` (testowane na Ubuntu 24.04).
- Wolne porty lokalne: `5173` (frontend), `8000` (backend), `5432` (PostgreSQL).

## Szybki start (development)

### 1. Plik `.env`

`docker-compose.yml` wymaga pliku `.env` w katalogu repo (nie jest commitowany).
Bez niego `docker compose` nie wystartuje — zmienne są zaciągane przez kontenery
`db` i `backend` (który buduje z nich `DATABASE_URL`):

```ini
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=app_db
```

W dev wystarczy hasło `postgres`. Na produkcji ustaw silne hasło — patrz
`docs/install.md`.

### 2. Uruchomienie

```bash
docker compose up -d --build
```

Powinny wstać trzy kontenery: `crm-db`, `crm-backend`, `crm-frontend`.
PostgreSQL musi być `healthy` zanim wystartuje backend.

Migracje i seedy odpalają się automatycznie przy starcie backendu
(`backend/docker-entrypoint.sh`): `alembic upgrade head`, następnie
`app.db.seeds` (dane referencyjne) i `app.db.seeds_demo` (dane demo).
Można je wyłączyć zmiennymi `RUN_SEEDS=0` / `RUN_DEMO_SEED=0`.

Frontend serwuje **produkcyjny build** (`npm run build` wykonywany w obrazie,
serwowany przez `vite preview`) — nie ma hot-reloadu. Po zmianach w kodzie
frontu przebuduj obraz:

```bash
docker compose up -d --build frontend
```

### 3. Weryfikacja

```bash
curl http://localhost:8000/health        # {"status":"ok"}
curl http://localhost:8000/companies      # lista firm (dane z seedów)
```

- Frontend (produkcyjny build, `vite preview`): http://localhost:5173
- Backend API + Swagger UI: http://localhost:8000/docs

### Ręczne migracje / seedy (jeśli wyłączysz automatyczne)

```bash
docker exec crm-backend uv run alembic upgrade head
docker exec crm-backend uv run python -m app.db.seeds        # idempotentny
docker exec crm-backend uv run python -m app.db.seeds_demo   # opcjonalny
```

## Testy i build

```bash
docker exec crm-backend uv run pytest tests -q     # backend
docker exec crm-frontend npm run test               # frontend
```

Produkcyjny build frontu (`tsc -b && vite build`) wykonuje się automatycznie
podczas budowania obrazu `crm-frontend` — `docker compose up -d --build`
zatrzyma się, jeśli build lub typecheck się nie powiedzie.

## Rozwiązywanie problemów (setup)

### Backend kończy się z `Exited (1)` zaraz po starcie

Sprawdź logi:

```bash
docker compose ps -a
docker logs crm-backend | tail -50
```

Najczęstsze przyczyny przy pierwszym uruchomieniu:

**1. Brak pliku `.env`.** `docker compose` nie wystartuje lub kontenery nie
dostaną zmiennych `POSTGRES_*`. Utwórz `.env` jak w kroku 1.

**2. `FATAL: password authentication failed for user "postgres"`.**
Wolumen `postgres_data` został zainicjalizowany wcześniej z innym hasłem.
PostgreSQL ustawia dane logowania (`POSTGRES_USER`/`POSTGRES_PASSWORD`)
**tylko** przy pierwszej inicjalizacji pustego katalogu danych — późniejsza
zmiana w `.env` nie aktualizuje istniejącego wolumenu. W dev najprościej
wyczyścić wolumen i pozwolić bazie zainicjalizować się od nowa
(**uwaga: kasuje wszystkie dane**):

```bash
docker compose down
docker volume rm ioioio_postgres_data
docker compose up -d
```

Alternatywnie zmień hasło istniejącego użytkownika w działającej bazie:

```bash
docker exec -it crm-db psql -U postgres -c "ALTER USER postgres PASSWORD 'postgres';"
```

### Reset bazy w dev (czysty schemat, bez kasowania wolumenu)

```bash
docker exec -it crm-db psql -U postgres -d app_db -c \
  "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
docker compose restart backend   # ponowne migracje + seedy
```

### Zajęty port (`bind: address already in use`)

Zwolnij port `5173`, `8000` lub `5432` (np. lokalny PostgreSQL na `5432`),
albo zmień mapowanie portów w `docker-compose.yml`.

## Produkcja

Pełna instrukcja wdrożenia (nginx jako reverse-proxy ze strippowaniem prefiksu
`/api/`, basic-auth, build statyczny frontu, backup/restore) — `docs/install.md`.
