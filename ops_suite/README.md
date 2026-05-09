# Ops Suite — Nextcloud App

Integrated operations management: **Configuration Tracker**, **Preventive Maintenance**, and **Deficiency Tracking**.

## Installation (Nextcloud AIO + Docker)

```bash
# 1. Copy the zip into the container
sudo docker cp ops_suite.zip nextcloud-aio-nextcloud:/tmp/ops_suite.zip

# 2. Extract into custom_apps/ (correct location for AIO)
sudo docker exec nextcloud-aio-nextcloud bash -c \
  "cd /var/www/html/custom_apps && unzip -o /tmp/ops_suite.zip"

# 3. Fix ownership (www-data = 33:0 in AIO)
sudo docker exec nextcloud-aio-nextcloud chown -R 33:0 /var/www/html/custom_apps/ops_suite
sudo docker exec nextcloud-aio-nextcloud chmod -R 750 /var/www/html/custom_apps/ops_suite

# 4. Enable the app and run the DB migration (creates 4 Postgres tables)
sudo docker exec --user www-data nextcloud-aio-nextcloud \
  php /var/www/html/occ app:enable ops_suite

sudo docker exec --user www-data nextcloud-aio-nextcloud \
  php /var/www/html/occ migrations:migrate ops_suite

# 5. Get your actual DB name and user, then verify tables
sudo docker exec --user www-data nextcloud-aio-nextcloud \
  php /var/www/html/occ config:system:get dbname

sudo docker exec --user www-data nextcloud-aio-nextcloud \
  php /var/www/html/occ config:system:get dbuser

# Then check tables (substitute <dbname> and <dbuser> from above):
sudo docker exec nextcloud-aio-database \
  psql -U <dbuser> -d <dbname> -c "\dt ops_*"
```

## Database Tables

| Table | Purpose |
|---|---|
| `ops_assets` | Hardware, software, firmware records (digital twin) |
| `ops_procedures` | PM tasks linked to assets with periodicity + next-due |
| `ops_deficiencies` | Deficiency reports with severity, cost estimates, assignment |
| `ops_deficiency_history` | Append-only troubleshooting log for each deficiency |

## Features

**Configuration Tracker**
- Register hardware, software, and firmware assets with full details
- Cross-link assets (e.g., which software runs on which server, which firmware version)
- Track status, location, serial number, warranty expiry
- Digital twin view shows all three layers linked per asset

**Preventive Maintenance**
- PM procedures linked to configuration assets (required)
- Periodicity: daily / weekly / monthly / quarterly / semi-annual / annual
- Auto-calculates next due date on completion
- Overdue and due-soon dashboards
- Links to SOP documents in Nextcloud Files or external URLs
- Mark complete with one click

**Deficiency Tracking**
- SEV-1 through SEV-5 severity codes
- Discovery method: walkdown / PM procedure / CVE scan / alert / incident
- Full troubleshooting history (append-only, timestamped, attributed)
- Cost breakdown: parts + labor + contractor + total
- Man-days: internal + external
- Scheduled outage hours
- Outside entity / contractor requirements
- Assign to any Nextcloud user
- Status workflow: open → in_work → waiting_parts → scheduled → closed

## Upgrading

To apply a new version:
```bash
sudo docker cp ops_suite.zip nextcloud-aio-nextcloud:/tmp/ops_suite.zip
sudo docker exec nextcloud-aio-nextcloud bash -c \
  "cd /var/www/html/custom_apps && unzip -o /tmp/ops_suite.zip"
sudo docker exec nextcloud-aio-nextcloud chown -R 33:0 /var/www/html/custom_apps/ops_suite
sudo docker exec --user www-data nextcloud-aio-nextcloud \
  php /var/www/html/occ migrations:migrate ops_suite
```

## Troubleshooting

**App not visible after enable:**
```bash
sudo docker exec --user www-data nextcloud-aio-nextcloud php /var/www/html/occ app:list | grep ops
sudo docker exec --user www-data nextcloud-aio-nextcloud php /var/www/html/occ maintenance:repair
```

**Check NC logs for PHP errors:**
```bash
sudo docker exec nextcloud-aio-nextcloud tail -50 /var/www/html/data/nextcloud.log
```

**Reset / reinstall:**
```bash
sudo docker exec --user www-data nextcloud-aio-nextcloud php /var/www/html/occ app:disable ops_suite
sudo docker exec nextcloud-aio-nextcloud rm -rf /var/www/html/custom_apps/ops_suite
# Re-run install steps above
```
