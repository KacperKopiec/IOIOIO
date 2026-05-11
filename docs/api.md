# API

Pełna interaktywna dokumentacja Swagger UI: `http://<host>/api/docs`.

Wszystkie ścieżki w przeglądarce/cURL żyją pod prefiksem `/api/` (np.
`GET /api/companies`). Wewnątrz FastAPI prefix jest stripowany przez
nginx, więc kod operuje na ścieżkach bez `/api/`. `root_path="/api"`
sprawia, że Swagger UI generuje poprawne linki.

## Najczęściej używane endpointy

### Zdrowie

```bash
curl -u admin:pass http://localhost/api/health
# → {"status":"ok"}
```

### Firmy

```bash
# Lista z filtrami
curl -u admin:pass "http://localhost/api/companies?q=comarch&page=1&page_size=10"
curl -u admin:pass "http://localhost/api/companies?tag_ids=2,12&company_size=corporation"
curl -u admin:pass "http://localhost/api/companies?relation_status=active"

# Szczegóły
curl -u admin:pass http://localhost/api/companies/1

# Stworzenie
curl -u admin:pass -X POST -H "Content-Type: application/json" \
  -d '{"name":"Acme Sp. z o.o.","nip":"123-456-78-90","city":"Kraków","tag_ids":[1,2]}' \
  http://localhost/api/companies

# Edycja (PATCH przyjmuje pola częściowe; tag_ids zastępuje listę)
curl -u admin:pass -X PATCH -H "Content-Type: application/json" \
  -d '{"notes":"Wymaga follow-upu po targach"}' \
  http://localhost/api/companies/1

# Powiązane
curl -u admin:pass http://localhost/api/companies/1/contacts
curl -u admin:pass http://localhost/api/companies/1/events
curl -u admin:pass http://localhost/api/companies/1/activities
```

### Wydarzenia

```bash
# Lista z filtrami
curl -u admin:pass "http://localhost/api/events?status=active&owner_user_id=2"
curl -u admin:pass "http://localhost/api/events?tag_ids=8,12"

# KPI
curl -u admin:pass http://localhost/api/events/1/kpi

# Lejek (pełne wpisy z firmą, etapem, opiekunem)
curl -u admin:pass http://localhost/api/events/1/pipeline
```

### Lejek

```bash
# Wpisy z filtrami
curl -u admin:pass "http://localhost/api/pipeline-entries?event_id=1&stage_id=3"

# Dodanie firmy do lejka wydarzenia (409 jeśli już jest)
curl -u admin:pass -X POST -H "Content-Type: application/json" \
  -d '{"event_id":1,"company_id":5,"expected_amount":"15000"}' \
  http://localhost/api/pipeline-entries

# Przesunięcie wpisu między etapami (uruchamia reguły biznesowe)
curl -u admin:pass -X POST -H "Content-Type: application/json" \
  -d '{"stage_id":4,"agreed_amount":"15000"}' \
  http://localhost/api/pipeline-entries/42/move
```

### Tagi (od fazy 6 są tworzone z poziomu UI)

```bash
curl -u admin:pass http://localhost/api/tags
curl -u admin:pass -X POST -H "Content-Type: application/json" \
  -d '{"name":"cybersecurity","category":"technology"}' \
  http://localhost/api/tags
# 201 z nowym TagOut, 409 jeśli nazwa się powtarza, 422 dla pustej / błędnej kategorii
```

### Dashboardy

```bash
curl -u admin:pass "http://localhost/api/dashboard/coordinator?event_id=1"
curl -u admin:pass http://localhost/api/dashboard/promotion
curl -u admin:pass "http://localhost/api/dashboard/relationship-manager?user_id=3"
```

### Raporty

```bash
curl -u admin:pass http://localhost/api/reports
```

Zwraca `totals`, `new_sponsors`, `events` (per-event KPI), `top_companies`.

## Konwencje błędów

| Kod | Kiedy                                                       | Format detail                                |
|-----|-------------------------------------------------------------|----------------------------------------------|
| 404 | Brak zasobu                                                 | "Firma nie istnieje", "Wydarzenie nie istnieje" itp. |
| 409 | Konflikt unikalności                                        | "Firma jest już przypisana do tego wydarzenia", "Tag o tej nazwie już istnieje" |
| 422 | Walidacja Pydantic lub niezdrowy parametr                   | szczegóły z pydantic albo "Nieprawidłowy identyfikator w liście: …" |

Wszystkie komunikaty `detail` są po polsku — frontend wyciąga je przez
`toApiError` z `lib/api.ts` i pokazuje użytkownikowi 1:1.

## Filtry CSV (`tag_ids`)

- `tag_ids=4` — wszystkie wpisy oznaczone tagiem #4.
- `tag_ids=4,7,12` — semantyka **AND**: wpis musi mieć wszystkie trzy
  tagi naraz. Każdy tag dodaje osobne `WHERE tags.any(Tag.id = X)`.

## Paginacja

`Page[T]` przy listach:

```json
{
  "items": [...],
  "meta": {"total": 21, "page": 1, "page_size": 25, "pages": 1}
}
```

Parametry: `page` (>=1), `page_size` (>=1, <=100, default 25).
