# CRM – Plan Implementacji (Wydział Informatyki AGH)

Branch startowy: `feature/crm-core` (od `frontend-development`).
Język UI: **polski**. Stos: FastAPI + SQLAlchemy 2.0 + Alembic + PostgreSQL 16 + React 19 + TS + Vite + CSS Modules. Wdrożenie: on-premises (Docker Compose za istniejącym proxy nginx).

> Ten plan jest mapą drogową. Towarzyszący mu `PROMPT.md` jest samowystarczalnym briefem dla świeżej sesji Claude Code – to on, nie ten plan, powinien być wklejany przy starcie kolejnej iteracji.

---

## Decyzje produktowe (potwierdzone)

| Pytanie | Decyzja |
|---|---|
| Nazwa branch'a | `feature/crm-core` |
| Terminologia | Zmieniamy nazwę tabeli `initiatives` → `events` (i wszystkie referencje); UI mówi „Wydarzenia”. |
| Autoryzacja | **Pomijamy** w tej iteracji – nginx ma basic-auth, frontend trzyma `AuthContext` z przełącznikiem ról. Backend nie wymaga JWT na endpointach (dodamy później). |
| Lejek (pipeline) – seed | 5 etapów: **Kontakt → Oferta wysłana → Negocjacje → Decyzja: TAK (won) → Odrzucony (lost)**. |

---

## Stan zastany

### Infrastruktura
- `docker-compose.yml` – usługi `db` (postgres:16-alpine, port 5432), `backend` (FastAPI, port 8000), `frontend` (Vite, port 5173). Wszystko `--volumes` na `./backend` / `./frontend`.
- Nginx system-level (`/etc/nginx/sites-enabled/app` → `sites-available/app-dev`):
  - `:80` z basic-auth (`/etc/nginx/.htpasswd`).
  - `/api/` → `http://127.0.0.1:8000/` (proxy_pass **z trailing slashem**, więc prefix `/api` jest **strippowany** – backend widzi `GET /companies`, nie `GET /api/companies`).
  - `/` → `http://127.0.0.1:5173` z WebSocket upgrade (Vite HMR).
- `/etc/nginx/sites-available/app-prod` – wariant prod (serwuje `/var/www/html` jako static + `/api/`). Frontend `dist/` jest deployowany do `/var/www/html` (już istnieje `frontend/dist/`).

### Backend (`backend/`)
- `pyproject.toml`: fastapi, uvicorn[standard], sqlalchemy, psycopg2-binary, python-dotenv. Pytest, httpx (dev).
- Dockerfile uruchamia `uvicorn main:app`.
- **Brakuje `main.py`** – backend jeszcze nie startuje.

### Frontend (`frontend/`, React 19 + Vite + TS, CSS Modules)
- Gotowe komponenty:
  - `Layout` (Sidebar + TopBar + container).
  - `Sidebar` (links: Dashboard / Baza Firm / Wydarzenia / Raporty / Ustawienia).
  - `TopBar` (search „Szukaj firm, inicjatyw...”, info o użytkowniku).
  - `Stats`, `ActiveEvents`, `UpcomingEvents`, `RecentActivity` – wszystkie z **mock danymi**.
  - `Firms/`: `FilterSidebar`, `ActionBar`, `FirmsTable`, `FirmRow`, `StatusBadge`, `TagBadge`, `TypeBadge`.
  - `Events/`: `EventsFilterSidebar`, `EventsTable`, `EventRow`.
- Konstanty: `firmStatus.ts`, `firmTags.ts`, `firmTypes.ts`, `eventTypes.ts`, `eventStatuses.ts` – każda z obiektem konfiguracji i kolorami.
- Strony: `Dashboard.tsx` (deleguje do `DashboardManagement` – jedyny zaimplementowany; pozostałe role to stuby), `Firms.tsx`, `Events.tsx`.
- `AuthContext`: trzyma `role: 'koordynator' | 'opiekun' | 'promocja' | 'zarzad'`, hard-coded `'zarzad'`. **Brakuje** wariantu `merytoryczna` (osoba merytoryczna z Figmy).
- Routing: `/dashboard`, `/firms`, `/events`. Brak `/pipeline`, `/companies/:id`, `/events/:id`, `/reports`.

### Figma (`1OBvTrBmTXd0BL5FpPT1ZX`, canvas `105:3608` – 11 ekranów 1920×1080)
| # | nodeId | Nazwa | Stan UI |
|---|---|---|---|
| 1 | `105:3609` | Dashboard – Kadra Zarządzająca | **w UI**, ale z mockami |
| 2 | `105:3978` | Baza Firm – All | **w UI**, mock |
| 3 | `105:4451` | Lejek (pipeline kanban) | **brak** |
| 4 | `105:4792` | Osoba merytoryczna – dashboard | **brak** (rola też brak) |
| 5 | `105:5107` | Widok firmy w kontekście wydarzenia | **brak** |
| 6 | `105:5431` | Opiekun relacji – Dashboard | stub |
| 7 | `105:5721` | Kadra zarządzająca – raporty | **brak** |
| 8 | `105:6030` | Wydarzenia – lista | **w UI**, mock |
| 9 | `105:6344` | Szczegóły firmy (taby: Dane Kontaktowe / Historia Współpracy / Notatki) | **brak** |
| 10 | `105:6590` | Dashboard – Dział promocji | stub |
| 11 | `105:6851` | Koordynator inicjatywy – widok wydarzenia (event detail) | **brak** |

---

## Plan fazowy

### Faza 0 – Konfiguracja repo (≈0,5 dnia)
1. Branch `feature/crm-core` (✓ utworzony).
2. Dodać `backend/alembic.ini` + katalog `migrations/`.
3. W `backend/pyproject.toml` doinstalować: `alembic`, `pydantic-settings`, `passlib[bcrypt]`, `python-jose[cryptography]` (na przyszłość), `email-validator`, `python-multipart`.
4. W `frontend/package.json` doinstalować: `@tanstack/react-query`, `axios`, `zustand` (do filtrów), `@dnd-kit/core` + `@dnd-kit/sortable` (kanban), `date-fns`.
5. Dodać `.env.example` (z `POSTGRES_*`, `BACKEND_PORT=8000`, `FRONTEND_PORT=5173`).
6. Vite: ustawić proxy dev na nginx-style ścieżki `/api` (lub używać bezpośrednio `:8000` – patrz „Routing API”).

### Faza 1 – Backend: model + migracje (≈1 dzień)
1. Stworzyć layout:
   ```
   backend/
     app/
       __init__.py
       main.py
       core/{config.py,logging.py}
       db/{base.py,session.py,seeds.py}
       models/{__init__.py, company.py, contact.py, event.py, pipeline.py,
               activity.py, tag.py, user.py, role.py, industry.py,
               relationship.py, document.py}
       schemas/  (Pydantic v2)
       api/      (routery)
       services/ (logika biznesowa)
     migrations/
       env.py
       versions/
   ```
2. **Schemat** zgodny z `PROMPT.md` (sekcja „Schemat bazy”) z `initiatives` zamienionym na `events` (i `initiative_id`→`event_id`, `initiative_tags`→`event_tags`).
3. Alembic init + pierwsza migracja `0001_init`.
4. Seedy (`db/seeds.py` wywoływany przez `python -m app.db.seeds`):
   - `pipeline_stages`: 5 etapów (patrz wyżej; `success_probability`: 10/40/65/100/0; `outcome`: open/open/open/won/lost).
   - `roles`: `koordynator`, `opiekun`, `promocja`, `zarzad`, `merytoryczna`.
   - `relationship_types`: `sponsor`, `partner`, `recruitment`, `r_and_d`, `media_partner`.
   - `industries`: IT, Fintech, Automotive, Energy, E-commerce, Telco, R&D.
   - `tags`: wszystkie z `firmTags.ts` (+ kategorie z enum `tag_category`).
   - 3–5 użytkowników demo (po jednym na rolę).
5. Dane testowe (osobny seed `db/seeds_demo.py`): ~20 firm z kontaktami, 3 eventy, ~30 pipeline_entries rozsianych po etapach, ~50 activities.

### Faza 2 – Backend: REST API (≈2 dni)
Wszystkie endpointy bez auth (TODO: dodać `Depends(get_current_user)` w przyszłości).

| Router | Endpoints | Notatki |
|---|---|---|
| `/companies` | `GET ?q&industry_id&tag_ids&size&relation_status&page&page_size`, `GET /{id}`, `POST`, `PATCH /{id}`, `DELETE /{id}`, `GET /{id}/contacts`, `GET /{id}/events` (kontekst wszystkich uczestnictw firmy w eventach), `GET /{id}/activities` | filtrowanie + paginacja |
| `/contacts` | CRUD + `GET ?company_id` | |
| `/events` | `GET ?status&owner_user_id&q&page`, `GET /{id}` (z agregatami KPI), `POST`, `PATCH`, `DELETE`, `GET /{id}/pipeline` (lejek), `GET /{id}/kpi` (liczba partnerów, suma kwot, konwersja, średnia wartość, czas zamknięcia) | |
| `/pipeline-stages` | `GET` (do kanbana) | bez modyfikacji w MVP |
| `/pipeline-entries` | `GET ?event_id&stage_id`, `POST` (przypisanie firmy do eventu), `PATCH /{id}` (zmiana etapu, kwoty, notatek), `DELETE /{id}`, `POST /{id}/move` (zmiana etapu + zapis `closed_at`/`offer_sent_at`/`first_contact_at` zgodnie z biznesem) | |
| `/activities` | CRUD + `GET ?company_id&event_id&pipeline_entry_id&assigned_user_id&due_before` | |
| `/company-relationships` | CRUD | „engagementy” podpisane |
| `/tags`, `/industries`, `/relationship-types` | `GET` (referencyjne) | |
| `/users`, `/roles` | `GET` | |
| `/documents` | `POST` (multipart, zapis na dysku w `backend/storage/`), `GET ?company_id&event_id&...`, `GET /{id}/download`, `DELETE /{id}` | |
| `/dashboard/management` | snapshot KPI dla kadry zarządzającej | |
| `/dashboard/coordinator?event_id=` | dla koordynatora konkretnego wydarzenia | |
| `/dashboard/promotion` | listy do mailingu masowego | |
| `/dashboard/relationship-manager?user_id=` | „moje firmy / zaległe” | |
| `/dashboard/merytoryczna?user_id=` | inicjatywy do zaopiniowania | |
| `/reports` | endpointy raportowe – zasięg, nowi sponsorzy, top firmy, konwersja w czasie | |

Reguły biznesowe (services/):
- Przy `POST /pipeline-entries/{id}/move` ustawiamy `closed_at` gdy nowy stage ma `outcome != 'open'`; ustawiamy `first_contact_at` przy pierwszym wyjściu z „Kontakt”; `offer_sent_at` przy wejściu w „Oferta wysłana”.
- Po wygranej (`Decyzja: TAK`) tworzymy automatycznie szkic `company_relationship` (status=draft, link do pipeline_entry).
- Unikalność (event_id, company_id) jest pilnowana indeksem; API zwraca 409.
- KPI eventu: `partnerzy = COUNT(pipeline_entries WHERE stage.outcome='won')`, `kwota = SUM(agreed_amount where won)`, `konwersja = won / total entries`, `średnia = kwota / partnerzy`.

### Faza 3 – Frontend: warstwa danych (≈1 dzień)
1. `src/lib/api.ts` – axios instance z `baseURL: '/api'` (przez nginx) lub `'http://localhost:8000'` (dev fallback przez `import.meta.env.VITE_API_URL`).
2. `src/lib/queryClient.ts` – React Query z domyślnymi opcjami.
3. `src/hooks/api/` – po jednym pliku per zasób (`useCompanies`, `useEvent`, `usePipeline`, …).
4. Refaktor istniejących stron żeby ciągnęły dane przez hooki zamiast mocków. Mocki zostają w `firmTags.ts` itd. jako referencja do kolorów.
5. Rozszerzyć `AuthContext` o `merytoryczna` + dodać dev-mode role switcher (np. dropdown w TopBar widoczny tylko gdy `import.meta.env.DEV`).

### Faza 4 – Frontend: nowe ekrany
Każdy ekran = osobny commit. Kolejność wg priorytetu produktowego:

1. **Wydarzenie – szczegóły (`/events/:id`)** – Figma `105:6851`. Najważniejszy ekran koordynatora. Zawiera: nagłówek z KPI, listę zadań, pasek „Postęp do celu”, ostatnia aktywność, nadchodzące działania, link do pipeline. Komponenty:
   - `EventDetailPage`, `EventKpiHeader`, `EventTasks`, `EventGoalProgress`, `EventActivityFeed`, `EventQuickActions`.
2. **Pipeline / kanban (`/events/:id/pipeline`)** – Figma `105:4451`. Implementacja `@dnd-kit` z 5 kolumnami. Każda karta = `PipelineCard` (nazwa firmy, kwota, koordynator, ostatni kontakt). Reaguje na drop wywołaniem `POST /pipeline-entries/{id}/move`.
3. **Szczegóły firmy (`/companies/:id`)** – Figma `105:6344`. Taby: Dane Kontaktowe / Historia Współpracy / Notatki. Komponenty: `CompanyHeader`, `CompanyContactsTab`, `CompanyHistoryTab`, `CompanyNotesTab`, `CompanyMetaSidebar`.
4. **Widok firmy w kontekście wydarzenia (`/events/:id/companies/:companyId`)** – Figma `105:5107`. Reużywa większości komponentów z (3), ale dokleja `EventContextPanel` (status w lejku, kwota, historia w ramach tego konkretnego eventu, notatki).
5. **Dashboardy ról**:
   - `DashboardCoordinator` – Figma `105:6851` zaadaptowany do widoku „wybierz inicjatywę”.
   - `DashboardRelationshipManager` – Figma `105:5431` (Potencjalni nowi partnerzy, Ostatnie Aktywności moje, ZALEGŁE).
   - `DashboardPromotion` – Figma `105:6590` (siatka kart eventów).
   - `DashboardMerytoryczna` – Figma `105:4792` (nowy plik + nowa rola).
   - `DashboardManagement` – dopiąć do realnego API (już jest UI).
6. **Raporty (`/reports`)** – Figma `105:5721`. Wykresy: `recharts` (`npm i recharts`). Sekcje: CAŁKOWITY ZASIĘG, NOWI SPONSORZY, Zasięg Uczestników (linia), Szczegóły Wydarzeń (tabela).
7. **Formularze**: modale `AddCompany`, `AddEvent`, `AddActivity`, `AddPipelineEntry`, `AddContact`. Nie ma osobnych ekranów w Figmie – modale wystarczą; styl spójny z resztą.

### Faza 5 – Design system (równolegle z Fazą 4)
Wydzielić z `index.css` warstwę tokenów + zbudować bazowe komponenty:
- `src/components/ui/`: `Button`, `IconButton`, `Card`, `Input`, `Select`, `Checkbox`, `Slider`, `Badge`, `Tabs`, `Modal`, `Drawer`, `Table` (generic), `Pagination`, `Avatar`, `Tooltip`, `EmptyState`, `Toast`.
- Tokeny: kolory (już są `--color-primary` itd. – rozbudować), spacing scale (4-8-12-16-24-32), shadow (3 poziomy), radius (4/8/12), font sizes (12/14/16/20/24/32/40).
- Nie wprowadzać tailwinda / styled-components – zostajemy przy CSS Modules + tokenach.

### Faza 6 – Testy + dokumentacja + finalizacja
- Backend: pytest – co najmniej smoke per router + testy reguł stage transitions.
- Frontend: vitest + @testing-library/react – snapshoty komponentów badge'y, testy hooków API z mockowanym axios.
- Dokumentacja w `docs/`:
  - `architecture.md` (warstwy, schemat, sekwencje),
  - `install.md` (on-premises, docker compose, nginx, backup, restore),
  - `api.md` (odsyłacz do `/api/docs` Swagger + przykłady curl),
  - `admin.md` (jak dodawać użytkowników/role, backup PG, log retencja),
  - `dev.md` (jak uruchomić lokalnie, gdzie są seedy, jak resetować DB).

---

## Routing API – uwaga krytyczna

Nginx ma `proxy_pass http://127.0.0.1:8000/;` (z trailing slashem). To znaczy, że żądanie do `GET /api/companies` trafia do backendu jako `GET /companies`.

Zatem FastAPI **nie powinien** mieć globalnego prefixu `/api`. Powinien jednak być uruchomiony z `root_path="/api"`, żeby Swagger UI (dostępny pod `https://host/api/docs`) generował poprawne URL'e.

```python
app = FastAPI(title="AGH CRM", root_path="/api")
```

Bezpośredni dostęp do `http://localhost:8000/companies` (z pominięciem nginxa) nadal działa – `root_path` wpływa tylko na linki w Swaggerze.

---

## Kryteria akceptacji iteracji

- [ ] `docker compose up` startuje DB + backend + frontend; nginx serwuje całość pod `http://<host>/`.
- [ ] `GET /api/health` zwraca 200.
- [ ] `GET /api/docs` pokazuje pełne Swagger UI.
- [ ] Wszystkie 11 ekranów z Figmy mają routing + UI + zaciągają realne dane (jeden ekran może mieć stub jeśli wymaga decyzji produktowej – odznaczyć w PR).
- [ ] Dashboard kadry zarządzającej pokazuje **realne KPI** (liczba partnerów / suma sponsoringu / konwersja) zamiast stałych.
- [ ] Pipeline obsługuje drag & drop z zapisem do DB.
- [ ] Filtry w „Baza Firm” faktycznie filtrują (po stronie API).
- [ ] Dokumentacja w `docs/` kompletna.
- [ ] CI: lint + testy zielone.
