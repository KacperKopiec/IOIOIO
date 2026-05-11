# Architektura

## Warstwy

```
┌──────────────────────────────────────────────────────────┐
│  Przeglądarka (React 19 + TS + Vite)                     │
│  - pages/* (widoki) → hooks/api/* (React Query)          │
│  - components/ui/* (Page, PageHeader, Button, Card, …)   │
│  - axios (lib/api.ts) z baseURL "/api"                   │
└────────────────────────┬─────────────────────────────────┘
                         │ HTTP, basic-auth na poziomie nginx
┌────────────────────────▼─────────────────────────────────┐
│  Systemowy nginx (host)                                   │
│  /etc/nginx/sites-enabled/app                             │
│  - /         → 127.0.0.1:5173  (Vite dev)                 │
│  - /api/     → 127.0.0.1:8000/ (FastAPI, prefix strip)    │
│  - basic-auth (/etc/nginx/.htpasswd) chroni całość        │
└────────────────────────┬─────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────┐
│  Backend (FastAPI, Python 3.12)                           │
│  app/main.py             → wiring + CORS + root_path=/api │
│  app/api/*               → routery (Page<T>, Pydantic v2) │
│  app/services/*          → reguły biznesowe               │
│    - pipeline.move_pipeline_entry                          │
│    - kpi.compute_event_kpi                                 │
│    - dashboard.*                                           │
│    - reports.build_reports                                 │
│  app/db/{base,session}.py → SQLAlchemy 2.0                │
│  app/models/*            → ORM + enumy PostgreSQL         │
│  migrations/             → Alembic                        │
└────────────────────────┬─────────────────────────────────┘
                         │ psycopg2
┌────────────────────────▼─────────────────────────────────┐
│  PostgreSQL 16 (kontener crm-db, port 5432)               │
│  - 17 tabel (companies, events, pipeline_entries, tags…)  │
│  - 6 ENUMów (company_size, event_status, stage_outcome,   │
│    activity_type, relationship_status, tag_category)      │
└──────────────────────────────────────────────────────────┘
```

Wszystko działa za jednym proxy nginx z basic-auth — backend nie ma
własnej autoryzacji (rola wybierana w przeglądarce przez dev role
switcher w `TopBar`).

## Schemat bazy danych

Tabele referencyjne:
- `industries(id, name)`
- `roles(id, name)` — `koordynator | opiekun | promocja`
- `tags(id, name, category)` — `category ∈ {technology, interest, relationship, collaboration}`
- `pipeline_stages(id, name, order_number, success_probability, outcome)` — 5 etapów
- `relationship_types(id, name, description)`

Encje główne:
- `users(id, first_name, last_name, email UNIQUE, role_id, is_active)`
- `companies(id, name, legal_name, website, nip, description, industry_id, company_size, country, city, notes)`
- `contacts(id, company_id, first_name, last_name, position, email, phone, linkedin_url, notes)`
- `events(id, name, description, start_date, end_date, owner_user_id, target_budget, target_partners_count, status)`

Pipeline + aktywności:
- `pipeline_entries(id, event_id, company_id, stage_id, owner_user_id, contact_person_id, expected_amount, agreed_amount, first_contact_at, offer_sent_at, closed_at, rejection_reason, notes)`
  — `UNIQUE(event_id, company_id)` pilnuje, że jedna firma nie może być w lejku tego samego wydarzenia dwa razy.
- `activities(id, company_id?, contact_id?, event_id?, pipeline_entry_id?, assigned_user_id?, activity_type, subject, description, activity_date, due_date, completed_at)`

Relacje partnerskie i dokumenty:
- `company_relationships(id, company_id, event_id?, pipeline_entry_id?, relationship_type_id, package_name, amount_net, amount_gross, currency, status, …)`
- `documents(id, company_id?, event_id?, pipeline_entry_id?, activity_id?, company_relationship_id?, uploaded_by_user_id, file_name, file_url, document_type)`

Tabele asocjacyjne (M2M):
- `company_tags(company_id, tag_id)`
- `event_tags(event_id, tag_id)`
- `company_relationship_tags(company_relationship_id, tag_id)`

## Sekwencja: ruch firmy w lejku (POST /pipeline-entries/{id}/move)

```
Frontend (KanbanBoard.handleDragEnd)
  ├─ snapshot = queryClient.getQueryData(eventKeys.pipeline(eventId))
  ├─ queryClient.setQueryData(...) → optymistyczne UI
  └─ useMovePipelineEntry.mutate({ id, payload: { stage_id } })
        │
        ▼
Backend (api/pipeline_entries.move_entry)
  ├─ _load_entry — selectinload stage, company, owner
  └─ services/pipeline.move_pipeline_entry
        ├─ jeśli current_stage == "Kontakt" → first_contact_at = now()
        ├─ jeśli new_stage == "Oferta wysłana" → offer_sent_at = now()
        ├─ jeśli new_stage.outcome != "open" → closed_at = now()
        ├─ jeśli new_stage.outcome == "open" → wyczyść closed_at, rejection_reason
        ├─ jeśli new_stage.outcome == "won" →
        │     utwórz draft CompanyRelationship (jeśli nie ma)
        └─ db.flush()
  └─ db.commit() + reload → response
        │
        ▼
Frontend
  └─ onSuccess → invalidate eventKeys.pipeline + eventKeys.kpi
  └─ onError → setQueryData(snapshot) + banner z detail
```

## Sekwencja: filtr po tagach na /events lub /companies

CSV `tag_ids` z URL → `_parse_csv_int` (422 jeśli token nie jest intem)
→ dla każdego tag id dodajemy `.where(Event.tags.any(Tag.id == tid))`
(AND semantics; firma/wydarzenie musi mieć **wszystkie** wskazane
tagi).

## React Query keys

- `companies | ['companies', 'list', filters] | ['companies', 'detail', id] | ['companies', id, 'contacts'|'events'|'activities']`
- `events    | ['events', 'list', filters] | ['events', 'detail', id] | ['events', id, 'pipeline'|'kpi']`
- `pipeline-entries | ['pipeline-entries', 'list', filters]`
- `reference | ['reference', 'industries'|'roles'|'tags'|'pipeline-stages'|'relationship-types'|'users']`
- `dashboard | ['dashboard', 'coordinator', eventId] | ['dashboard', 'promotion'] | ['dashboard', 'relationship-manager', userId]`

Mutacje (`useCreate*`, `useUpdate*`, `useMovePipelineEntry`, …)
unieważniają odpowiednie klucze tak, żeby listy i KPI odświeżały
się raz po zatwierdzeniu zmiany.

## Code splitting

`App.tsx` używa `React.lazy` + `<Suspense>` dla cięższych ekranów:

| Chunk         | Co tam jest                            |
|---------------|----------------------------------------|
| `index`       | Dashboard, Firms, Events, AuthContext  |
| `EventDetail` | strona szczegółów wydarzenia           |
| `EventPipeline` | kanban + `@dnd-kit`                  |
| `EventCompany` | firma w kontekście wydarzenia         |
| `CompanyDetail` | dossier firmy                        |
| `Reports`     | strona raportów + `recharts`           |
| `format`      | wspólne ciężkie zależności (axios itp.)|

Recharts (≈110 KB gz) i dnd-kit (≈17 KB gz) ładują się dopiero przy
wejściu na konkretne ścieżki.

## Decyzje produktowe

- **3 role** (`koordynator`, `opiekun`, `promocja`). Brak ról `zarzad` i `merytoryczna` — patrz `MEMORY.md`.
- **Pipeline 5-etapowy**: `Kontakt → Oferta wysłana → Negocjacje → Decyzja: TAK (won) → Odrzucony (lost)`.
- **Polski w UI i komunikatach błędów**. Kod, identyfikatory, commits — angielski.
- **Brak autoryzacji w backendzie** w obecnej iteracji — basic-auth nginxa wystarczy. JWT do dodania w przyszłych iteracjach.
