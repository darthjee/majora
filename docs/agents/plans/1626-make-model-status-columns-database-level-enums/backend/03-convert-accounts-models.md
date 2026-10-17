# Convert the accounts status columns

Switch `status` to `EnumCharField` in:
- `AuthorizationRequest` (`open`, `approved`, `denied`, `expired`, `logged`; default `open`).
- `UserProfile` (`pending`, `approved`, `denied`; keep both `default` and `db_default=STATUS_PENDING`, so the column is `ENUM(...) NOT NULL DEFAULT 'pending'`).

Keep `max_length=16`, the `STATUS_*` constants and `STATUS_CHOICES` unchanged. Generate a single `accounts` migration (`0010_...`) with `AlterField` for both fields, and confirm with `sqlmigrate` that it emits `MODIFY ... ENUM(...)` (with `DEFAULT 'pending'` for `UserProfile`), and that the reverse migration restores `varchar(16)`.

`try_transition_approved_to_logged`'s guarded `UPDATE ... WHERE status='approved'` needs no change; its existing tests must still pass.

## Files to Change
- `backend/accounts/models/authorization_request.py` — `status` → `EnumCharField`.
- `backend/accounts/models/user_profile.py` — `status` → `EnumCharField` (keep `db_default`).
- `backend/accounts/migrations/0010_<name>.py` — new `AlterField` migration.
