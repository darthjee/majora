# Migrations (accounts + versioning)

Two migration files, generated with `docker-compose run --rm majora_app poetry run python manage.py makemigrations` after Step 1's model change, then hand-edited where noted.

## `accounts` migration — `0009_passwordresettoken_expires_at_invalidated_at.py`

Since `expires_at` gets a `default=` callable (Step 1), Django's autodetector will likely produce a single `AddField` for each column with that default applied to existing rows — **not** what we want, because it would stamp every pre-existing token with a freshly-computed `expires_at` (`now + configured minutes`), silently extending already-expired tokens. Hand-edit the generated migration into three explicit operations, following the `accounts/0004_backfill_userprofile_status_approved.py` pattern:

1. `migrations.AddField('passwordresettoken', 'expires_at', models.DateTimeField(null=True))` — nullable for this step only.
2. `migrations.AddField('passwordresettoken', 'invalidated_at', models.DateTimeField(null=True, blank=True))`.
3. `migrations.RunPython(_backfill_expires_at, _noop_reverse)` where `_backfill_expires_at` sets, for every existing row, `expires_at = created_at + timedelta(minutes=Settings.password_reset_token_expiration_minutes())` — **`Settings.password_reset_token_expiration_minutes()` read once at migration run time**, not hardcoded 30, via `apps.get_model(...)` for the historical model plus a direct import of `games.settings.Settings` (data migrations can import ordinary Python modules, just not app models). `invalidated_at` stays `NULL`, untouched.
4. `migrations.AlterField('passwordresettoken', 'expires_at', models.DateTimeField())` — back to `NOT NULL` (with the `default=` callable preserved in the field state, matching the model).

Reverse: dropping to before step 1 just drops both columns (Django's default reversal for `AddField`); `_noop_reverse` for the `RunPython` step, mirroring `0004`'s `_noop_reverse`.

## `versioning` migration — auto-generated `HistoricalPasswordResetToken`

Adding `HistoricalRecords(app='versioning', ...)` in Step 1 makes `makemigrations` also propose a new migration in `backend/versioning/migrations/`, creating `versioning_historicalpasswordresettoken` — follow `0010_historicalauthorizationrequest.py`'s shape (should need no hand-editing, it's a fresh table). Ensure this migration's `dependencies` correctly reference the `accounts` migration above (Django wires this automatically since the historical model's fields mirror the new columns).

## Files to Change

- `backend/accounts/migrations/0009_passwordresettoken_expires_at_invalidated_at.py` — new, hand-edited per above.
- `backend/versioning/migrations/00XX_historicalpasswordresettoken.py` — new, auto-generated (exact number follows the next free sequence in `backend/versioning/migrations/`).
