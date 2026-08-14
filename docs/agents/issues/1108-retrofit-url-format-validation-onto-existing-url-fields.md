# Retrofit URL format validation onto existing URL fields

## Context

Issue #820 adds format validation (Django `URLField`/`URLValidator`, restricted to `http`/`https`) to the new `StlModel.url` field, to prevent a stored `javascript:` URI from being rendered as a clickable link (stored XSS) on the show page. The existing URL-shaped fields elsewhere in the codebase — `Collection.url` and `Source.url` — remain plain, unvalidated `CharField`s and don't get this protection. This issue tracks retrofitting the same validation onto them, split off from #820 to keep that issue scoped to the new field only.

## What needs to be done

**Backend**:
- Audit the codebase for existing "url"-shaped fields that are rendered as clickable links but lack format validation — at minimum `Collection.url` (`backend/miniatures/models/collection.py`) and `Source.url` (`backend/miniatures/models/source.py`).
- Convert each to use Django's `URLField`/`URLValidator`, restricted to `http`/`https` schemes, matching the approach used for `StlModel.url` in #820.
- Add the corresponding migrations (and matching `Historical*` migrations under `backend/versioning/migrations/`), being mindful of any existing stored values that might not pass the new validation (decide per-field whether to backfill/null out invalid data or validate only going forward).
- Update/extend serializer and model tests to cover rejection of invalid URLs (non-`http`/`https` schemes, malformed values).

## Acceptance criteria

- [ ] `Collection.url` and `Source.url` validate format (http/https only) at the model/serializer level
- [ ] Migrations apply cleanly against existing data (no crash on invalid legacy values)
- [ ] Tests cover rejection of invalid URLs for each retrofitted field
