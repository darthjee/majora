# Backend Plan: Make model status columns database-level enums

Main plan: [plan.md](plan.md)

## Overview
Introduce `common.model_fields.EnumCharField`, a `CharField` subclass whose column type on MySQL is `ENUM(<choices in declaration order>)`, and migrate the four `status` columns (`AuthorizationRequest`, `UserProfile`, `Upload`, `Poll`) to it. The `AuthorizationRequest` historical model (`versioning` app) must keep a plain `CharField`. No change to views, serializers or the API.

## Context
- MySQL everywhere: `mysql:9.3.0` locally, `cimg/mysql:8.0` in CI (`.circleci/config.yml`); tests use `majora_project.settings_test`, which inherits the MySQL `DATABASES`.
- Django `^5.0`, `django-simple-history ^3.12`.
- `simple_history` builds the historical model by `copy.copy`-ing each concrete field, so an `EnumCharField` would propagate to `versioning.HistoricalAuthorizationRequest` unless handled explicitly.
- Since Django 4.1, `Field.non_db_attrs` includes `choices`, so the schema editor skips `ALTER TABLE` when only `choices` change. The enum field's column type depends on `choices`, so it must remove `choices` from `non_db_attrs` — otherwise adding a status would generate a migration that does nothing to the column.
- `UserProfile.status` has `db_default=STATUS_PENDING`, relied on by frozen-state migration tests (`games/tests/migration_state.py`, `accounts/tests/models/user_profile_status_migration_test.py`).
- There are no rows with invalid statuses, so no data migration is needed.

## Steps

- [01 — Add the reusable EnumCharField](backend/01-add-enum-char-field.md)
- [02 — Keep the history table's status as varchar](backend/02-history-keeps-varchar.md)
- [03 — Convert the accounts status columns](backend/03-convert-accounts-models.md)
- [04 — Convert Upload and Poll status columns](backend/04-convert-upload-and-poll.md)
- [05 — Database-level tests and migration check](backend/05-db-level-tests.md)

## CI Checks
- `backend`: `cd backend && poetry run pytest --cov` and `poetry run ruff check .`, run through `make tests` / `docker-compose` (CI jobs: `pytest_views_characters`, `pytest_views_rest`, `pytest_all`, `checks`)
- `backend`: `poetry run python manage.py makemigrations --check --dry-run` must report no changes.

## Notes
- Production MySQL must run with strict mode (`STRICT_TRANS_TABLES` in the global `sql_mode`); otherwise invalid values are stored as `''` instead of being rejected. This is a server requirement, documented in the issue; no Django `init_command` is added.
- Enum values must be quoted/escaped safely when building `ENUM(...)` (use the connection's quoting, e.g. `connection.ops.quote_value` / `schema_editor.quote_value`, or a strict escape of `'` and `\`), even though current values are simple lowercase identifiers.
- `ENUM` sorts by declaration order; nothing currently orders by `status`.
- Reverse migrations (`ENUM` → `varchar(16)`) must work: migration tests roll the schema back and forward.
