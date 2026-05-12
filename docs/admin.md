# Administracja

## Dodawanie użytkowników CRM

Tabela `users` wiąże się z `roles` przez `role_id`. Dostępne role:
`koordynator`, `opiekun`, `promocja` (patrz [[architecture]] i `seeds.py`).

### Wariant 1 — przez seedy

Najprościej — edytuj `backend/app/db/seeds.py` (sekcja `DEMO_USERS`),
dodaj krotki `(first_name, last_name, email, role_name)` i puść:

```bash
docker exec crm-backend uv run python -m app.db.seeds
```

Skrypt jest idempotentny — nie dubluje istniejących e-maili.

### Wariant 2 — bezpośrednio w bazie

```bash
docker exec -it crm-db psql -U postgres -d app_db
```

```sql
-- ID roli, do której chcemy podpiąć użytkownika
SELECT id, name FROM roles;

INSERT INTO users (first_name, last_name, email, role_id, is_active,
                   created_at, updated_at)
VALUES ('Imię', 'Nazwisko', 'imie.nazwisko@agh.edu.pl', <role_id>,
        TRUE, NOW(), NOW());
```

## Zarządzanie tagami

Tagi można tworzyć z poziomu UI (każdy modal z `TagSelector` ma sekcję
"Utwórz nowy tag"), ale można też wprost po HTTP:

```bash
curl -u admin:pass -X POST -H "Content-Type: application/json" \
  -d '{"name":"cybersecurity","category":"technology"}' \
  http://localhost/api/tags
```

Kategorie: `technology`, `interest`, `relationship`, `collaboration`.

Usuwania tagów nie ma w API — to świadoma decyzja (m2m powiązania
mogłyby wymagać kaskady). Jeśli koniecznie:

```sql
DELETE FROM company_tags WHERE tag_id = <id>;
DELETE FROM event_tags WHERE tag_id = <id>;
DELETE FROM tags WHERE id = <id>;
```

## Etapy lejka

Lista etapów (`pipeline_stages`) jest seedowana i nie można ich
dodawać przez API w tej iteracji. Zmiany robi się migracją + edycją
`seeds.py`.

## Reguły biznesowe — gdzie żyją

Wszystkie reguły są w `backend/app/services/`:
- `pipeline.py` — przejścia między etapami (`closed_at`,
  `offer_sent_at`, `first_contact_at`, draft `CompanyRelationship` po
  WON).
- `kpi.py` — agregaty KPI per event.
- `dashboard.py` — payloady dashboardów ról.
- `reports.py` — wszystkie tabele i agregaty raportów.

Jeśli klient prosi o zmianę „wymagamy pierwszego kontaktu zanim
pozwolimy wysłać ofertę”, dodaje się ją w tych plikach (a nie w
routerach API).

## Backup i restore

Patrz `install.md`. Krótko:

```bash
# Backup
docker exec crm-db pg_dump -U postgres -d app_db -F c -f /tmp/backup.dump
docker cp crm-db:/tmp/backup.dump ./backups/$(date +%F).dump

# Restore
docker cp ./backups/<plik>.dump crm-db:/tmp/restore.dump
docker exec crm-db dropdb   -U postgres app_db
docker exec crm-db createdb -U postgres app_db
docker exec crm-db pg_restore -U postgres -d app_db /tmp/restore.dump
```

## Logi i retencja

- Logi backendu: `docker logs crm-backend` (rotowane przez Docker
  daemon — `docker-compose.yml` można rozszerzyć o
  `logging: { driver: json-file, options: { max-size: 50m, max-file: 5 } }`
  jeśli storage jest ciasny).
- Logi nginx: `/var/log/nginx/access.log`, `/var/log/nginx/error.log`
  (logrotate systemowy — domyślnie 14 dni).
- DB: surowych logów Postgresa nie zbieramy. Statystyki długich
  zapytań warto włączyć w `postgresql.conf`
  (`log_min_duration_statement = 500`).

## Reset bazy w środowisku dev

```bash
docker exec -it crm-db psql -U postgres -d app_db -c \
  "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
docker exec crm-backend uv run alembic upgrade head
docker exec crm-backend uv run python -m app.db.seeds
docker exec crm-backend uv run python -m app.db.seeds_demo
```

Niszczy WSZYSTKO. Nie używać na produkcji.

## Najczęstsze incydenty

| Symptom                                  | Diagnoza                                   |
|------------------------------------------|--------------------------------------------|
| `/api/health` zwraca 502                 | Backend stoi — `docker logs crm-backend`.  |
| 401 z nginx                              | Brak / złe basic-auth — sprawdź `.htpasswd`. |
| 409 "Firma jest już przypisana…"        | Wpis (event_id, company_id) już istnieje — to celowe. |
| Migracja `0001` nie aplikuje się         | DB nie jest pusta. Reset jak wyżej.        |
| Long query / spowolnienie                | Sprawdź czy `selectinload` zostało użyte w nowym routerze (N+1). |
