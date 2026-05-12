# Instalacja (on-premises)

## Wymagania

- Linux z Dockerem i `docker compose` (testowane na Ubuntu 24.04).
- Systemowy `nginx` (nie kontener) — używamy go jako reverse-proxy z
  basic-auth.
- Otwarte porty: 80 (publicznie), 5173 i 8000 i 5432 wystawiane lokalnie
  przez kontenery.

## 1. Klon repozytorium

```bash
git clone <repo-url> /opt/agh-crm
cd /opt/agh-crm
```

## 2. Plik `.env`

W katalogu repo:

```ini
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<silne-haslo>
POSTGRES_DB=app_db
```

`docker-compose.yml` zaciąga te zmienne dla kontenerów `db` i
`backend` (które buduje `DATABASE_URL`).

## 3. Uruchomienie usług

```bash
docker compose up -d --build
```

Powinniśmy zobaczyć trzy zdrowe kontenery: `crm-db`, `crm-backend`,
`crm-frontend`. Healthcheck PostgreSQL musi się zazielenić przed
startem backendu.

## 4. Migracje + seedy

```bash
docker exec crm-backend uv run alembic upgrade head
docker exec crm-backend uv run python -m app.db.seeds        # reference
docker exec crm-backend uv run python -m app.db.seeds_demo   # opcjonalnie
```

`seeds.py` jest idempotentny — można puścić wielokrotnie.

## 5. Konfiguracja nginx

`/etc/nginx/sites-available/app` (lub `app-prod`):

```nginx
server {
    listen 80 default_server;
    server_name _;

    auth_basic           "AGH CRM";
    auth_basic_user_file /etc/nginx/.htpasswd;

    location /api/ {
        proxy_pass http://127.0.0.1:8000/;   # trailing slash → strip /api
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }

    location / {
        proxy_pass http://127.0.0.1:5173;   # Vite dev
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

Aktywacja:

```bash
sudo ln -sf /etc/nginx/sites-available/app /etc/nginx/sites-enabled/app
sudo nginx -t && sudo systemctl reload nginx
```

### Basic-auth

```bash
sudo htpasswd -c /etc/nginx/.htpasswd admin
```

Dodatkowi użytkownicy: `sudo htpasswd /etc/nginx/.htpasswd <login>`
(bez flagi `-c`, żeby nie nadpisać pliku).

### Wariant produkcyjny (statyk z dist/)

Zamiast proxy na Vite dev w `location /`:

```nginx
root /var/www/html;
try_files $uri /index.html;
```

I deployment frontendu:

```bash
docker exec crm-frontend npm run build
sudo rsync -a frontend/dist/ /var/www/html/
```

## 6. Test końcowy

```bash
curl -u admin:<haslo> http://localhost/api/health    # {"status":"ok"}
curl -u admin:<haslo> http://localhost/api/docs      # Swagger UI
```

W przeglądarce `http://<host>/` → modal basic-auth → CRM.

## Backup i restore

### Backup PostgreSQL

```bash
docker exec crm-db pg_dump -U postgres -d app_db -F c -f /tmp/backup.dump
docker cp crm-db:/tmp/backup.dump ./backups/$(date +%F).dump
```

Cron co dobę (`/etc/cron.daily/agh-crm-backup`):

```bash
#!/usr/bin/env bash
set -euo pipefail
TS=$(date +%F-%H%M)
DEST=/var/backups/agh-crm
mkdir -p "$DEST"
docker exec crm-db pg_dump -U postgres -d app_db -F c -f /tmp/backup.dump
docker cp crm-db:/tmp/backup.dump "$DEST/$TS.dump"
find "$DEST" -type f -mtime +30 -delete
```

### Restore

```bash
docker cp ./backups/2026-05-11.dump crm-db:/tmp/restore.dump
docker exec crm-db dropdb -U postgres app_db
docker exec crm-db createdb -U postgres app_db
docker exec crm-db pg_restore -U postgres -d app_db /tmp/restore.dump
```

## Aktualizacje

```bash
git pull
docker compose up -d --build
docker exec crm-backend uv run alembic upgrade head
```
