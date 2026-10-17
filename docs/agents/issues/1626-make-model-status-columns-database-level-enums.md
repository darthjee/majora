# Issue: Make model status columns database-level enums

## Description

Several models store a `status` as a plain `CharField(max_length=16, choices=...)`. The allowed values are only enforced by Django; in MySQL the column is a free-text `varchar`. The motivating case is the login-through-request feature (`AuthorizationRequest`, `backend/accounts/models/authorization_request.py`), whose status is sometimes edited directly in the database (e.g. to approve a request by hand). These columns should become database-level enums.

Context:
- Database: MySQL (`backend/majora_project/settings.py`; `mysql:9.3.0` locally), which supports a native `ENUM(...)` column type.
- No model in the project uses a DB-level enum yet.
- `AuthorizationRequest` has `HistoricalRecords`, so its historical table (`versioning` app) also carries a `status` column.

## Problem

Because the columns accept any string, a typo made while editing a status by hand in the database silently produces an invalid value. The application doesn't recognize it (e.g. the `authorize`, `deny`, `poll` and `list` authorization-request views), and nothing at the database level prevents it or shows which values are allowed.

## Expected Behavior

- Each in-scope `status` column is a MySQL `ENUM` of exactly its model's choices, so the database rejects any other value and MySQL clients show the allowed values when editing by hand.
- Application, API and frontend behavior is unchanged.
- The `AuthorizationRequest` history table keeps a plain `varchar` `status`.

## Solution

### Scope

In scope: convert every `status` column that follows the `CharField` + `choices` pattern to a database-level enum:

| Model | File | Values |
|---|---|---|
| `AuthorizationRequest` | `backend/accounts/models/authorization_request.py` | `open`, `approved`, `denied`, `expired`, `logged` |
| `UserProfile` | `backend/accounts/models/user_profile.py` | `pending`, `approved`, `denied` (keeps its `db_default`) |
| `Upload` | `backend/uploads/models.py` | `pending`, `uploading`, `uploaded`, `failed` |
| `Poll` | `backend/games/models/poll/poll.py` | `open`, `inactive`, `closed` |

Approach: add a small **reusable enum field** (e.g. a `CharField` subclass whose `db_type` emits `ENUM(...)` from its `choices` on MySQL) instead of one-off raw-SQL migrations, so any future status column can adopt it. Each model then switches its `status` field to it, with a migration per app.

Out of scope:
- The `AuthorizationRequest` history table (`versioning` app, via `HistoricalRecords`) keeps its `status` as a plain `varchar`. Since `simple_history` copies model fields into the historical model, the implementation must make sure the historical model's `status` stays a regular `CharField` (no `ENUM` there). None of the other three models have a history table.
- No change to the views, serializers or API behavior — the set of values is unchanged.

### Alternative solutions

**Chosen: native MySQL `ENUM` via a reusable field.** The allowed values are part of the column type, so MySQL clients (Workbench, DBeaver, `mysql` CLI, `SHOW CREATE TABLE`) expose them when editing by hand — the main use case. Notes for the implementation:
- The field's `deconstruct` must include the choices so that adding/removing/reordering a value makes Django generate the `ALTER TABLE ... MODIFY` migration automatically.
- On non-MySQL backends the field should fall back to a regular `varchar`.
- `ENUM` columns sort by declaration order, not alphabetically — no code currently orders by `status`, so this is not a concern today.

Rejected:
- **`CheckConstraint` (`status IN (...)`) on the existing `varchar`** — portable and plain Django, but DB tools don't surface the allowed values (you still have to remember them), and MySQL only enforces `CHECK` from 8.0.16.
- **Lookup table + foreign key** — far larger refactor (every view/query changes) and hand edits would use opaque ids instead of readable values.
- **`ENUM` + `CheckConstraint`** — redundant; `ENUM` already restricts values in strict mode.

### Backward compatibility

- The set of allowed values is unchanged for every model, so no application, API or frontend behavior changes.
- No data migration is needed: there are no existing rows holding invalid status values, so the `ALTER TABLE` to `ENUM` can be applied directly.

### Edge cases

- **Strict mode** — MySQL only rejects invalid `ENUM` values when strict mode is on; otherwise it silently stores `''`. The production MySQL server must run with strict mode (`STRICT_TRANS_TABLES` in the global `sql_mode`, the default since 5.7 and in the `mysql:9.3.0` image used locally). This is a server-level requirement, not a Django `init_command`, because hand edits from a MySQL client use the server's global mode.
- **Case-insensitive matching** — with the default collation, a hand-typed `'Approved'`/`'APPROVED'` is accepted and stored as the declared `approved`. Acceptable; no action needed.
- **`UserProfile.status` `db_default`** — the enum field must still emit a valid `DEFAULT 'pending'` on the column; the frozen migration-era tests (`games/tests/migration_state.py`) insert `UserProfile` rows without `status` and rely on it.
- **Guarded update** — `AuthorizationRequest.try_transition_approved_to_logged` (`UPDATE ... WHERE status='approved'`) must keep working unchanged on the enum column.
- **`NULL` / empty** — all four columns stay `NOT NULL`, and the enum must not include an empty `''` member.

### Testing strategy

Run through `make` / `docker-compose` against the MySQL container.

1. **Field unit tests** — on MySQL, `db_type` returns `ENUM('...')` built from `choices` in declaration order with correct quoting; on other vendors it falls back to `varchar`; `deconstruct` round-trips the choices (changing them yields a new migration).
2. **DB rejection tests** — one per model (`AuthorizationRequest`, `UserProfile`, `Upload`, `Poll`): a raw `UPDATE ... SET status='bogus'` raises a database error.
3. **Default** — a `UserProfile` inserted without `status` gets `pending` from the DB default.
4. **History table** — the `AuthorizationRequest` historical model's `status` is still a plain `CharField`, not the enum field.
5. **Migrations** — `makemigrations --check` is clean after the change.
6. **Regression** — existing authorization-request, user-profile, upload and poll tests pass unchanged, including the `approved` → `logged` race test.

## Benefits

- Hand edits in the database can no longer store invalid statuses.
- The allowed values are visible directly in the schema and in MySQL clients.
- A reusable enum field that future status columns can adopt.
