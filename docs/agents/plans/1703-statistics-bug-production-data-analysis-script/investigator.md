# Plan: Statistics bug: production data analysis script (investigator)

Main plan: [plan.md](plan.md)

Issue: [1703-statistics-bug-production-data-analysis-script.md](../../issues/1703-statistics-bug-production-data-analysis-script.md)

## Overview

`analyse.py` goes next to `emulate.py` (#1702, merged) in `investigations/statistics-bug/`:

- standard library only;
- run through the folder's standalone `docker-compose.yml`;
- reports written to the git-ignored `reports/` folder.

The work covers the command line and target safety, the authorized export reader, grouping and
classification, the report, and the validation mode. It ends with a passing local validation
run.

## Context

**What `emulate.py` already provides:**

- `SelfClient`, `DeviceAuthorization`, `ExportReader`, `Window`, the `reports/` writer, and
  the JSON report. `analyse.py --validate` consumes that JSON report: per scenario it holds
  `window.filtered_from` / `filtered_to`, `expected.exact` / `at_most`, `actual` and
  `sessions`.
- It refuses anything that is not local and always sends `X-Statistics-Skip-Secret`.
- Its compose service runs `python -I -B`, so the script's folder is **not** on `sys.path`.

**Production differs from local:**

- The skip secret never leaves the server, so `analyse.py` cannot send it.
- The export route is untracked, but the device-authorization create and poll requests **are**
  tracked (`docs/agents/specs/statistics-bug/export-endpoint.md`). That bounded side effect
  is filtered out and reported.

**Export facts:**

- `from` / `to` are local days with `tz`, and `per_page` is at most 100.
- The page count comes from the `pages` header.
- Timestamps are whole seconds.
- Sessions carry `id`, `ip`, `domain`, `user_id`, `created_at`, `last_seen_at`,
  `creation_reason`, `first_path`, `first_seen_logged` and `visits`. Each visit carries
  `started_at`, `last_seen_at`, `hits`, `first_path` and `last_path`.
- A revoked or expired token gets 401 `token_invalid`.

**Authorization request:** it expires 1 hour after creation (`EXPIRATION` in
`backend/accounts/models/authorization_request.py`). The script waits until then, with no
timeout of its own.

## Steps

- [01 — Compose services, command line and target safety](investigator/01-cli-and-safety.md)
- [02 — Authorized, read-only export reader](investigator/02-export-reader.md)
- [03 — Grouping and classification](investigator/03-grouping-and-classification.md)
- [04 — Report](investigator/04-report.md)
- [05 — Validation mode and local run](investigator/05-validation-and-run.md)

## Notes

- **Self-contained:** `analyse.py` re-implements the small HTTP, device-authorization and
  export helpers it needs rather than importing `emulate.py`:
  - `-I` keeps the folder off `sys.path`;
  - `emulate.py` is merged and validated, so it is left untouched;
  - the production behaviour differs (no skip header, a different allowlist).

  Keep the shapes the same so the two scripts read alike.
- **CI:** `investigations/**` is already excluded (markdownlint, Codacy, and the CircleCI
  `checks` `Set folder` step). No CI change and no tests in CI.
- **Privacy (public repo):**
  - no real IP, user id, session id, token or production URL in committed content;
  - the PR description's validation summary is aggregated;
  - the token, `STATISTICS_SKIP_SECRET` and `STATISTICS_PROD_URL` are never printed or logged.
- **The production run is out of scope (#1704).** Do not run `analyse.py` against production
  in this issue.
