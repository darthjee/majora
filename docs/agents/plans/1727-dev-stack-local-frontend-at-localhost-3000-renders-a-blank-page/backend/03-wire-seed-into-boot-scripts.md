# Wire the seed into the boot scripts

In `backend/bin/configure_database.sh`, add:

- `seed()`: `echo "Seeding dev domains..."` then `poetry run python manage.py seed_dev_domains`;
- `setup()`: `wait_for_db` + `migrate` + `seed`;
- matching `seed` and `setup` cases, and an updated usage line
  (`{wait|migrate|all|seed|setup}`).

In `backend/bin/server.sh`, after the existing `CREATE_DB` if/else, call
`bin/configure_database.sh seed` unconditionally (the command enforces its own guard, so
production, where `SEED_DEV_DOMAINS` isn't set, only prints the skipped line). It must run
before `runserver`/`gunicorn` starts.

## Files to Change

- `backend/bin/configure_database.sh`: `seed` and `setup` actions.
- `backend/bin/server.sh`: call the `seed` action before the server starts.
