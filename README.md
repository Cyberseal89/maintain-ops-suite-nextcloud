# Maintain Ops Suite — Nextcloud App

**Configuration Tracker · Preventive Maintenance · Deficiency Tracking**

The server-side Nextcloud application for Maintain Ops Suite. Provides the REST API consumed by the Android and iOS mobile clients.

## Modules

| Module | Description |
|---|---|
| Configuration Tracker | Hardware, software, and firmware digital twin with cross-linking |
| Preventive Maintenance | PM procedures with periodicity, SOP documents, and scheduling |
| Deficiency Tracking | Condition reports with severity, cost estimates, and history |

## Requirements

- Nextcloud 27–32
- PostgreSQL (recommended) or MySQL/MariaDB
- PHP 8.1+

## Installation (Nextcloud AIO + Docker)

```bash
# 1. Copy zip to container
sudo docker cp ops_suite.zip nextcloud-aio-nextcloud:/tmp/ops_suite.zip

# 2. Extract into custom_apps
sudo docker exec nextcloud-aio-nextcloud bash -c \
  "cd /var/www/html/custom_apps && unzip -o /tmp/ops_suite.zip"

# 3. Fix ownership
sudo docker exec nextcloud-aio-nextcloud chown -R 33:0 /var/www/html/custom_apps/ops_suite
sudo docker exec nextcloud-aio-nextcloud chmod -R 750 /var/www/html/custom_apps/ops_suite

# 4. Enable and migrate
sudo docker exec --user www-data nextcloud-aio-nextcloud \
  php /var/www/html/occ app:enable ops_suite
```

## API Endpoints

All endpoints are prefixed with `/apps/ops_suite`.

| Method | Path | Description |
|---|---|---|
| GET | `/api/dashboard/stats` | Dashboard summary stats |
| GET/POST | `/api/assets` | List / create assets |
| GET/PUT/DELETE | `/api/assets/{id}` | Get / update / delete asset |
| GET/POST | `/api/procedures` | List / create PM procedures |
| POST | `/api/procedures/{id}/complete` | Mark procedure complete |
| GET/POST | `/api/deficiencies` | List / create deficiencies |
| POST | `/api/deficiencies/{id}/history` | Add troubleshooting note |
| GET/POST | `/api/settings` | Get / save app settings |
| GET | `/api/users` | List Nextcloud users |
| GET | `/api/groups` | List Nextcloud groups |
| GET | `/api/files/sop` | SOP folder info + create |
| GET | `/api/files/list` | List files in a folder |

## Authentication

The mobile app uses **Nextcloud Login Flow v2**. All API requests include:
- `requesttoken` header: Nextcloud CSRF token
- `OCS-APIREQUEST: true` header
- Session cookie or app password via Basic Auth

## Development

```bash
git clone https://github.com/cyberseal89/maintain-ops-suite-nextcloud
cd maintain-ops-suite-nextcloud

# Make changes to ops_suite/
# Zip and deploy to test instance:
zip -r ops_suite.zip ops_suite/
sudo docker cp ops_suite.zip nextcloud-aio-nextcloud:/tmp/ops_suite.zip
sudo docker exec nextcloud-aio-nextcloud bash -c \
  "cd /var/www/html/custom_apps && unzip -o /tmp/ops_suite.zip"
sudo docker exec nextcloud-aio-nextcloud chown -R 33:0 /var/www/html/custom_apps/ops_suite
sudo docker exec --user www-data nextcloud-aio-nextcloud \
  php /var/www/html/occ upgrade
```

## Branching Strategy

| Branch | Purpose |
|---|---|
| `main` | Production releases only |
| `develop` | Integration branch — PRs merge here first |
| `feature/*` | Individual feature branches |
| `hotfix/*` | Emergency production fixes |

## License

AGPL-3.0 — see [LICENSE](LICENSE)
