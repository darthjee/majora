# Tests

Cover, following this app's existing test conventions (`backend/domains/tests/models/`, `backend/domains/tests/factories/domain.py`):

- **Model/merge logic**: a `DomainConfiguration` factory; direct tests of the merge behavior (`null` → default, `""` → shown empty, real value → used) — either as unit tests of the merge helper itself, or folded into the endpoint tests below if the merge logic isn't split into an independently-testable function.
- **Endpoint** (`GET /domain/config.json`):
  - A `Domain` with a `DomainGroup` that has a `DomainConfiguration` with all fields set — response reflects the configured values.
  - A `Domain` whose `DomainGroup` has no `DomainConfiguration` row — response is full defaults.
  - A `Host` header with no matching `Domain` at all — response is still full defaults (not a 404).
  - `""` on `title`/`sub_title` is returned as `""`, not coerced to the default.
- **Data migration**: a migration test (following this repo's existing pattern for data migrations, if any precedent exists under `backend/*/migrations/` or `backend/*/tests/migrations/`) verifying that, for a `DomainGroup` with multiple `Domain` rows with mixed `title` values, the created `DomainConfiguration.title` is the first non-empty one found (deterministic ordering), and that a group with no titled domains ends up with `title=None`.

## Files to Change

- `backend/domains/tests/factories/domain_configuration.py` — new factory
- `backend/domains/tests/models/domain_configuration_test.py` — model tests
- `backend/domains/tests/views/config_test.py` (or wherever this repo's endpoint tests for similarly-shaped public views live) — endpoint tests
- `backend/domains/tests/migrations/...` — data migration test, if this repo has a precedent for testing data migrations; otherwise fold the backfill assertion into a regular test that runs the migration's logic directly
