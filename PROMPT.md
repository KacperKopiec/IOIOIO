# PROMPT – Pełny brief implementacyjny dla świeżej sesji Claude Code

> Wklej całość poniższego tekstu jako pierwsze zlecenie w nowej sesji w katalogu `/home/ubuntu/IOIOIO` na branchu `feature/crm-core`. Brief jest samowystarczalny – nie wymaga referencji do poprzednich konwersacji.

---

## Kontekst

Buduję lekki CRM dla **Wydziału Informatyki AGH** wspierający pozyskiwanie firm‑partnerów na wydarzenia (konferencje, hackatony, dni kariery). Klient nazywa to „CRM do zarządzania partnerami i sponsoringiem wydarzeń”. Główni użytkownicy (3 role): **Dział promocji** (`promocja`), **Koordynator wydarzenia** (`koordynator`), **Opiekun partnerów** (`opiekun`).

**Język całego UI: polski.** Dokumentacja i komunikaty błędów też po polsku. Kod, nazwy plików, identyfikatory – po angielsku.

Repo: monorepo, branch roboczy **`feature/crm-core`**, gałąź główna `main`.

---

## Stos technologiczny – wymagania klienta (skrótem)

- **Backend**: Python 3.12, **FastAPI**, OOP + SOLID + Clean Code, warstwowa architektura. SQLAlchemy 2.0 + Alembic. **Pydantic v2** dla schematów.
- **Frontend**: **React 19 + TypeScript + Vite**, React Router, **React Query** do danych. CSS Modules (nie tailwind). Komponentowość, responsywność, obsługa błędów po stronie klienta.
- **Baza**: **PostgreSQL 16** (już w docker compose).
- Wdrożenie **on‑premises**, Docker Compose. Brak SaaS‑only zależności.
- **Autoryzacja: pomijamy w tej iteracji.** Nginx ma już basic-auth na poziomie systemu (`/etc/nginx/.htpasswd`). Backend nie waliduje JWT. Frontend trzyma rolę w `AuthContext` z dev-mode role switcherem.
- Git, code review, testy jednostkowe + integracyjne, kontenery, dokumentacja techniczna.

---

## Routing i nginx – uwaga krytyczna

Na hoście działa **systemowy nginx** (NIE kontener) z aktywną konfiguracją `/etc/nginx/sites-enabled/app` (która jest symlinkiem do `sites-available/app-dev`):

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:8000/;   # ← TRAILING SLASH = strip prefixu /api
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 60s;
}
location / {
    proxy_pass http://127.0.0.1:5173;    # Vite dev
    # WebSocket upgrade for HMR …
}
```

Wniosek: **FastAPI rejestruje routery bez prefixu `/api`** – np. `@app.include_router(companies_router, prefix="/companies")`. Żądanie z przeglądarki `GET /api/companies/42` po stripie staje się `GET /companies/42` w backendzie.

Aby Swagger UI generował poprawne URL‑e przez nginxa, uruchamiamy FastAPI z `root_path="/api"`:

```python
app = FastAPI(title="AGH CRM", root_path="/api")
```

`http://localhost:8000/...` (bez nginxa) nadal działa – `root_path` zmienia tylko link w `/docs` i OpenAPI servers.

Frontend Vite na dev: `axios` z `baseURL: "/api"`; Vite serwowany jest przez ten sam nginx, więc relative URL działa od ręki. Brak potrzeby konfigurowania `vite.config.ts proxy` (idzie przez nginx).

---

## Stan kodu (Mai 2026)

### `docker-compose.yml`
- `db` postgres:16-alpine, port 5432, volume `postgres_data`, healthcheck.
- `backend` FastAPI, port 8000, mount `./backend:/app`, `DATABASE_URL=postgresql://...@db:5432/...`.
- `frontend` Vite, port 5173, mount `./frontend:/app`.
- `.env`: `POSTGRES_USER=postgres`, `POSTGRES_PASSWORD=password`, `POSTGRES_DB=app_db`.

### `backend/`
- `pyproject.toml` ma: fastapi, uvicorn[standard], sqlalchemy>=2.0, psycopg2-binary, python-dotenv (+ dev: pytest, httpx). **Brakuje**: alembic, pydantic-settings, passlib (zaplanowane na potem), python-multipart.
- **Brakuje `main.py`** – Dockerfile uruchamia `uvicorn main:app`, więc trzeba stworzyć.
- `.venv/` istnieje (uv).

### `frontend/`
- React 19 + Vite + TS + CSS Modules.
- Zależności: `react-router-dom 7`, `lucide-react`. **Brakuje**: `@tanstack/react-query`, `axios`, `@dnd-kit/core`, `@dnd-kit/sortable`, `recharts`, `date-fns`.
- Gotowe komponenty (w `src/components`):
  - `Layout/Layout.tsx` – Sidebar + TopBar + Outlet.
  - `Sidebar/Sidebar.tsx` – nav z linkami Dashboard / Baza Firm / Wydarzenia / Raporty / Ustawienia.
  - `TopBar/TopBar.tsx` – pole szukaj „Szukaj firm, inicjatyw…”, user info.
  - `Stats`, `ActiveEvents`, `UpcomingEvents`, `RecentActivity` – z **mock danymi** (do podłączenia API).
  - `Firms/`: `FilterSidebar`, `ActionBar`, `FirmsTable`, `FirmRow`, `StatusBadge`, `TagBadge`, `TypeBadge`.
  - `Events/`: `EventsFilterSidebar`, `EventsTable`, `EventRow`.
- Konstanty z konfiguracją (id + label + bgColor + textColor) w `src/constants/`:
  - `firmStatus.ts` – `active_partner | contact | prospect | umowa`.
  - `firmTags.ts` – `cloud | saas | startup | enterprise | partner | research | ai_ml | blockchain`.
  - `firmTypes.ts` – `tech_startup | corporation | sme | government | ngo | university | research_institute | consultant`.
  - `eventTypes.ts` – `workshop | conference | hackathon | networking`.
  - `eventStatuses.ts` – `planned | ongoing | completed | cancelled`.
- `src/context/AuthContext.tsx`: trzyma `role: 'koordynator' | 'opiekun' | 'promocja'`, na sztywno `'koordynator'`. Trzeba dodać dev role switcher.
- Strony: `pages/Dashboard.tsx` (deleguje wg roli do `DashboardCoordinator/DashboardPromotion/DashboardRelationshipManager` – wszystkie 3 są na razie stubami), `pages/Firms.tsx`, `pages/Events.tsx`.
- Routing (`App.tsx`): `/dashboard`, `/firms`, `/events` pod `Layout`.
- Tokens w `src/index.css`:
  ```css
  --color-bg:#F8FBFF; --color-white:#FFFFFF; --color-primary:#00458E;
  --color-primary-dark:#1E3A8A; --color-primary-bg:#EFF6FF;
  --color-border:#F3F4F6; --color-text-secondary:#6B7280;
  --font-heading:'Manrope',sans-serif; --font-body:'Inter',sans-serif;
  ```

### Figma
File `1OBvTrBmTXd0BL5FpPT1ZX`, canvas `105:3608`. 11 ekranów 1920×1080. **Inspiracja, nie kopia 1:1** – mamy zrobić „podobne”, dopasowane do naszego designu (tokeny powyżej).

| Cel | nodeId | Stan |
|---|---|---|
| Baza Firm (lista) | `105:3978` | UI gotowe (mock) – podpiąć do API |
| Pipeline kanban | `105:4451` | **do zrobienia** |
| Firma w kontekście wydarzenia | `105:5107` | **do zrobienia** |
| Dashboard – Opiekun partnerów | `105:5431` | stub do wymiany |
| Raporty | `105:5721` | **do zrobienia** (widok dla koordynatorów, nie zarządu) |
| Wydarzenia (lista) | `105:6030` | UI gotowe (mock) – podpiąć do API |
| Szczegóły firmy (taby) | `105:6344` | **do zrobienia** |
| Dashboard – Dział promocji | `105:6590` | stub do wymiany |
| Wydarzenie – widok koordynatora (szczegóły, pełni rolę „dashboardu koordynatora”) | `105:6851` | **do zrobienia** |

Uwaga: ekrany Figma 105:3609 (Kadra zarządzająca) i 105:4792 (Osoba merytoryczna) zostały świadomie pominięte – te role nie są częścią produktu.

Aby pobrać design konkretnego ekranu użyj MCP `mcp__claude_ai_Figma__get_design_context` z `fileKey="1OBvTrBmTXd0BL5FpPT1ZX"` i odpowiednim `nodeId`. Wynik to React + Tailwind – **przeanalizuj jak referencję** i przetłumacz na nasze CSS Modules + tokeny. Screenshot pobieraj jeśli potrzebny: `mcp__claude_ai_Figma__get_screenshot`.

---

## Schemat bazy (PostgreSQL) – **finalna wersja**

Zmiany vs pierwotny szkic: tabela `initiatives` została **przemianowana na `events`** (oraz `initiative_id`→`event_id`, `initiative_tags`→`event_tags`, `target_partners_count` zostaje, ale `target_budget` zostaje). Wszędzie tam gdzie wystąpiło „initiative” w kolumnach, używamy „event”.

### ENUMy (PostgreSQL ENUM, mapowane na SQLAlchemy Enum)
- `company_size`: `startup | sme | corporation | public_institution`
- `event_status`: `draft | active | closed | cancelled`
- `activity_type`: `note | meeting | email | phone_call | follow_up | task`
- `stage_outcome`: `open | won | lost`
- `relationship_status`: `draft | active | completed | cancelled | on_hold`
- `tag_category`: `technology | interest | relationship | collaboration`

### Tabele

```text
industries(id PK, name)
roles(id PK, name)
users(id PK, first_name, last_name, email UNIQUE, role_id FK→roles, is_active, created_at, updated_at)

companies(id PK, name, legal_name, website, nip, description,
          industry_id FK→industries, company_size company_size,
          country, city, created_at, updated_at)
contacts(id PK, company_id FK→companies, first_name, last_name,
         position, email, phone, linkedin_url, notes, created_at, updated_at)

events(id PK, name, description, start_date, end_date,
       owner_user_id FK→users, target_budget numeric, target_partners_count int,
       status event_status, created_at, updated_at)

pipeline_stages(id PK, name, order_number int, success_probability int,
                outcome stage_outcome NOT NULL DEFAULT 'open')

pipeline_entries(id PK,
                 event_id FK→events NOT NULL,
                 company_id FK→companies NOT NULL,
                 stage_id FK→pipeline_stages NOT NULL,
                 owner_user_id FK→users,
                 contact_person_id FK→contacts,
                 expected_amount numeric,
                 agreed_amount numeric,
                 probability_override int,
                 first_contact_at timestamp,
                 offer_sent_at timestamp,
                 closed_at timestamp,
                 rejection_reason text,
                 notes text,
                 created_at, updated_at,
                 UNIQUE(event_id, company_id))

activities(id PK, company_id?, contact_id?, event_id?, pipeline_entry_id?,
           assigned_user_id?, activity_type activity_type, subject, description,
           activity_date timestamp, due_date timestamp, completed_at timestamp,
           created_at)

tags(id PK, name, category tag_category NOT NULL, created_at)
company_tags(company_id, tag_id, PK(company_id, tag_id))
event_tags(event_id, tag_id, PK(event_id, tag_id))
company_relationship_tags(company_relationship_id, tag_id, PK(...))

relationship_types(id PK, name, description)
company_relationships(id PK, company_id FK NOT NULL, event_id?, pipeline_entry_id?,
                      relationship_type_id FK NOT NULL, package_name,
                      amount_net numeric, amount_gross numeric, currency,
                      start_date, end_date, contract_signed_at timestamp,
                      owner_user_id FK, status relationship_status, notes,
                      created_at, updated_at)

documents(id PK, company_id?, event_id?, pipeline_entry_id?, activity_id?,
          company_relationship_id?, uploaded_by_user_id FK,
          file_name NOT NULL, file_url NOT NULL, document_type,
          created_at, updated_at)
```

Wszystkie FK NULL‑owalne dopuszczają wartości `NULL` (pola opisane jako „?”).

### Seedy obowiązkowe

- **`pipeline_stages`** (5 etapów):
  | order | name | success_probability | outcome |
  |---|---|---|---|
  | 1 | Kontakt | 15 | open |
  | 2 | Oferta wysłana | 40 | open |
  | 3 | Negocjacje | 70 | open |
  | 4 | Decyzja: TAK | 100 | won |
  | 5 | Odrzucony | 0 | lost |
- **`roles`**: `koordynator`, `opiekun`, `promocja`.
- **`relationship_types`**: `sponsor`, `partner`, `recruitment`, `r_and_d`, `media_partner`.
- **`industries`**: IT, Fintech, Automotive, Energy, E‑commerce, Telco, R&D, Cybersecurity.
- **`tags`** (po category z enum):
  - technology: cloud, saas, ai_ml, blockchain, cybersecurity, embedded, enterprise,
  - interest: recruitment, branding, technology,
  - relationship: partner, sponsor, alumni,
  - collaboration: workshop, hackathon, mentoring.
- **3 użytkowników demo**, po jednym na rolę (`marek.koordynator@agh.edu.pl`, `katarzyna.opiekun@agh.edu.pl`, `tomasz.promocja@agh.edu.pl`).
- **`db/seeds_demo.py`**: ~20 firm z kontaktami, 3 eventy (np. „SFI 2024”, „KrakHack 2025”, „AGH Career Fair 2025”), ~30 `pipeline_entries`, ~50 `activities`.

---

## Reguły biznesowe (services/)

1. **Pipeline transitions** – endpoint `POST /pipeline-entries/{id}/move` przyjmuje `{stage_id, agreed_amount?, rejection_reason?}`. Logika:
   - jeśli `new_stage.outcome != 'open'` i `closed_at IS NULL` → ustaw `closed_at = now()`,
   - jeśli `new_stage.name == 'Oferta wysłana'` i `offer_sent_at IS NULL` → ustaw `offer_sent_at = now()`,
   - jeśli wychodzimy z „Kontakt” (czyli aktualny etap to „Kontakt”) i `first_contact_at IS NULL` → ustaw `first_contact_at = now()`,
   - jeśli `new_stage.outcome == 'won'` → utwórz `company_relationship` z `status='draft'` linkujące do `pipeline_entry_id` (jeśli jeszcze nie istnieje).
2. **Unikalność `(event_id, company_id)`** – API zwraca 409 z polskim komunikatem „Firma jest już przypisana do tego wydarzenia”.
3. **KPI eventu** (`GET /events/{id}/kpi`):
   - `partners_count = count(entries.stage.outcome='won')`
   - `total_value = SUM(coalesce(agreed_amount, 0)) WHERE outcome='won'`
   - `pipeline_count = count(all entries)`
   - `conversion_rate = partners_count / count(entries with outcome IN ('won','lost'))` (jeśli mianownik > 0)
   - `avg_partner_value = total_value / partners_count` (jeśli > 0)
   - `avg_close_days = AVG(closed_at - first_contact_at) WHERE outcome='won'`
4. **Filtry firm** (`GET /companies`):
   - `q` szuka po `name`, `legal_name`, `nip`, `city`,
   - `industry_id`, `company_size`, `tag_ids` (CSV) – AND,
   - `relation_status` (active/inactive – obecność active relationship),
   - `page` (1-based), `page_size` (default 25, max 100).
5. **Aktywność „ZALEGŁE”** dla opiekuna relacji: `activities WHERE assigned_user_id=:me AND due_date < now() AND completed_at IS NULL`.

---

## Plan działań w tej sesji (kolejność commitów)

1. **Faza 0 – uzupełnienie zależności**
   - `backend/pyproject.toml`: dodać `alembic`, `pydantic-settings`, `python-multipart`, `email-validator`. `uv sync`.
   - `frontend/package.json`: `@tanstack/react-query`, `axios`, `@dnd-kit/core`, `@dnd-kit/sortable`, `recharts`, `date-fns`. `npm install`.
2. **Faza 1 – backend skeleton + DB**
   - Stwórz strukturę `backend/app/{core,db,models,schemas,api,services}` + `main.py`.
   - `app/core/config.py` (`Settings` z env): `database_url`, `app_env`, `cors_origins`.
   - `app/db/session.py` (engine + SessionLocal). `app/db/base.py` (`DeclarativeBase`).
   - Wszystkie modele wg schematu powyżej (z enumami, indexem unique na pipeline_entries).
   - Alembic init (`alembic init migrations`), `env.py` czyta `database_url` z `Settings`, autogenerate.
   - Pierwsza migracja `0001_init.py`.
   - `app/db/seeds.py` + `app/db/seeds_demo.py` jako `python -m app.db.seeds` / `python -m app.db.seeds_demo`.
   - Healthcheck `GET /health` zwraca `{"status":"ok"}`.
   - **Smoke test**: `docker compose up`, `curl http://localhost/api/health`.
3. **Faza 2 – backend API**
   - Pydantic schemas + routers wg tabelki w `PLAN.md` (Faza 2).
   - Services dla pipeline transitions i KPI.
   - Dashboardy: `/dashboard/coordinator?event_id=`, `/dashboard/promotion`, `/dashboard/relationship-manager?user_id=`. Brak globalnego `/dashboard/management` – nie ma takiej roli.
   - Pisz pytesty per router (przynajmniej happy path + 1 błąd walidacji).
4. **Faza 3 – frontend warstwa API**
   - `src/lib/api.ts`, `src/lib/queryClient.ts`, `src/hooks/api/*`.
   - Refaktor istniejących 3 stron z mocków na hooki.
   - Dodaj dev role switcher w `TopBar` (przełącznik między 3 rolami: `promocja`, `koordynator`, `opiekun`).
5. **Faza 4 – nowe ekrany** (kolejność z PLAN.md, sekcja „Faza 4”):
   1. Wydarzenie – szczegóły (`/events/:id`).
   2. Pipeline kanban (`/events/:id/pipeline`) z `@dnd-kit`.
   3. Szczegóły firmy (`/companies/:id`) z tabami.
   4. Firma w kontekście wydarzenia (`/events/:id/companies/:companyId`).
   5. Dashboardy: `Coordinator`, `RelationshipManager`, `Promotion` (po jednym na każdą z 3 ról).
   6. Raporty (`/reports`) z `recharts`.
   7. Modale formularzowe: `AddCompany`, `AddEvent`, `AddActivity`, `AddPipelineEntry`, `AddContact`.
6. **Faza 5 – design system** (równolegle): wydzielić `src/components/ui/` (Button, Card, Input, Select, Checkbox, Slider, Badge, Tabs, Modal, Drawer, Table, Pagination, Avatar, Tooltip, EmptyState, Toast). Rozszerzyć tokeny w `index.css`.
7. **Faza 6 – testy i dokumentacja**: `docs/architecture.md`, `docs/install.md`, `docs/api.md`, `docs/admin.md`, `docs/dev.md`. Vitest na frontendzie.

---

## Zasady pracy

- **Polski w UI i komunikatach**. Kod, identyfikatory, nazwy plików, commits – po angielsku.
- **Brak emoji w plikach**.
- **CSS Modules** – żadnego tailwinda, żadnego inline‑stylowania (poza dynamicznymi kolorami z `firmTags`/`firmStatus`).
- **Mała blast radius** – każdy ekran w osobnym commicie.
- Przed implementacją nowego ekranu pobierz `get_design_context` dla odpowiedniego `nodeId` (lista wyżej) i potraktuj wynik jako referencję, nie kopię.
- Nie commituj `.env`. Nie commituj plików w `backend/storage/`.
- Testuj golden path każdej zmiany w przeglądarce (lub przez curl/test) przed oznaczeniem jako gotowe.
- Po stworzeniu schematu i seedów daj się odpalić `docker compose up` i sprawdź że `http://<host>/api/health` zwraca 200, a `http://<host>/api/docs` pokazuje Swaggera.

---

## Pierwsze kroki dla nowej sesji

1. `git status` – upewnij się, że jesteś na `feature/crm-core`.
2. Przeczytaj `PLAN.md` (mapa drogowa) i `frontend/src/App.tsx` (aktualny routing).
3. Zacznij od Fazy 0 (zależności) i Fazy 1 (backend skeleton + DB + migracja + seedy). Skończ tę fazę jednym commitem (lub serią logicznych).
4. Po zakończeniu Fazy 1 sprawdź `curl http://localhost/api/health` i `curl http://localhost/api/companies` – musi działać przez nginx.

Powodzenia.
