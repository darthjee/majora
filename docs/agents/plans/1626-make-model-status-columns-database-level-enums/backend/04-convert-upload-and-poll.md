# Convert Upload and Poll status columns

Switch `status` to `EnumCharField` in:
- `Upload` (`backend/uploads/models.py`, table `games_upload`): `pending`, `uploading`, `uploaded`, `failed`; default `pending`.
- `Poll` (`backend/games/models/poll/poll.py`): `open`, `inactive`, `closed`; default `inactive`.

Keep `max_length=16`, constants and choices unchanged. Generate one migration per app (`uploads/migrations/0004_...`, `games/migrations/0106_...`) and confirm with `sqlmigrate` that each emits `MODIFY ... ENUM(...)`.

## Files to Change
- `backend/uploads/models.py` — `status` → `EnumCharField`.
- `backend/uploads/migrations/0004_<name>.py` — new `AlterField` migration.
- `backend/games/models/poll/poll.py` — `status` → `EnumCharField`.
- `backend/games/migrations/0106_<name>.py` — new `AlterField` migration.
