# Add the reusable EnumCharField

Create `backend/common/model_fields.py` (sibling of `serializer_fields.py`) with `EnumCharField(models.CharField)`:

- Requires non-empty `choices`; values must be non-empty strings (no `''` member).
- `db_type(connection)`: when `connection.vendor == 'mysql'`, return `ENUM('a','b',...)` built from the flattened choice values in declaration order, safely quoted; otherwise return `super().db_type(connection)` (the regular `varchar(max_length)`).
- `non_db_attrs`: the parent's tuple minus `'choices'`, so changing the choices produces a real `ALTER TABLE ... MODIFY`.
- Keep `max_length` (still used for Django-side validation and the non-MySQL fallback); `deconstruct` works as inherited from `CharField` (choices and `max_length` already included) — add a test confirming the round-trip.
- Docstring explaining why (hand edits in the DB, issue #1626).

Tests in `backend/common/tests/model_fields_test.py`:
- MySQL `db_type` returns `ENUM(...)` in declaration order with correct quoting (including a value containing `'`).
- Non-MySQL vendor (a stub connection with `vendor='sqlite'`) falls back to `varchar(<max_length>)`.
- `deconstruct()` round-trips (`EnumCharField(*args, **kwargs)` rebuilds an equal field) and includes `choices`.
- `'choices'` is not in `non_db_attrs`.

## Files to Change
- `backend/common/model_fields.py` — new `EnumCharField`.
- `backend/common/tests/model_fields_test.py` — new unit tests.
