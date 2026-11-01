# Accept `localhost` in the domain validator

`validate_domain` (`backend/domains/models.py`) requires at least one dot, so it rejects
`localhost`. Widen it to also accept the exact host `localhost` (case-insensitive, since
`Domain.save()` lowercases), and keep rejecting every other dotless name (e.g. `majora_proxy`,
`foo`). The simplest way is an alternation in the regex, `\A(localhost|<existing pattern>)\Z`;
keep the error message accurate.

Check whether the regex is copied into a migration's `validators=[...]`. If the field
definition changes, run `makemigrations domains` and commit the (validator-only) migration.

## Files to Change

- `backend/domains/models.py`: widen `validate_domain`.
- `backend/domains/migrations/00xx_*.py`: only if Django detects a field change.
- `backend/domains/tests/models/domain_test.py`: `localhost` and `LOCALHOST` pass
  `full_clean`; `127.0.0.1` passes; `majora_proxy`, `foo` and `local host` still fail.
