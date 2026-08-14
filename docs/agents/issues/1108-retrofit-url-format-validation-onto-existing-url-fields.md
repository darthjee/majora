# Issue: Retrofit URL format validation onto existing URL fields

## Description
Issue #820 added strict URL format validation (Django `URLField` + `URLValidator(schemes=['http', 'https'])`) to the new `StlModel.url` field, to prevent a stored `javascript:` URI from being rendered as a clickable link (stored XSS) on the show page. `Collection.url` and `Source.url` remain plain `CharField`s at the model level and don't use Django's `URLField`/`URLValidator` mechanism.

Investigation for this issue found that `Collection.url`/`Source.url` are **not currently an open XSS hole** — issue #1053 already added a custom `validate_url` method to `CollectionCreateSerializer`/`SourceCreateSerializer` that rejects any value with a disallowed scheme (only `http`/`https` pass), while deliberately still accepting scheme-less values (bare domains like `example.com`, relative paths like `/some/path`), with tests locking in that behavior. What's actually missing relative to `StlModel.url` is Django's `URLField`/`URLValidator` mechanism itself and its stricter format checking (rejecting malformed values, not just disallowed schemes) — not the underlying security protection.

The retrofit was discussed and, despite the above, the decision is to proceed with a **full** `URLField`/`URLValidator` conversion for consistency with `StlModel.url`, understanding this is a **behavior change**: bare domains and relative paths currently accepted by `Collection.url`/`Source.url` will no longer be accepted going forward.

Additionally, `BaseLink.url` (`backend/games/models/base_link.py`, inherited by `StlModelLink`, `CharacterLink`, and `GameLink`) shares the same "rendered as a clickable link" shape but has no explicit scheme restriction — it relies only on Django's default `URLField` schemes (`http`, `https`, `ftp`, `ftps`). It isn't an active XSS vector (`javascript:` already fails Django's default `URLField` syntax validation), but is included in this issue's scope for consistency.

## Problem
- `Collection.url` (`backend/miniatures/models/collection.py`) and `Source.url` (`backend/miniatures/models/source.py`) are plain `CharField`s with no model-level format validators, unlike `StlModel.url`.
- `BaseLink.url` (`backend/games/models/base_link.py`), inherited by `StlModelLink`, `CharacterLink`, and `GameLink`, is a plain `URLField()` without an explicit `schemes=['http', 'https']` restriction, unlike `StlModel.url`.
- The existing `#1053` custom scheme-allowlist validation in `CollectionCreateSerializer`/`SourceCreateSerializer` (`validate_url`, with its control-character-stripping and scheme-extraction regexes) is inconsistent with a stricter `URLField`-based approach and needs to be superseded.

## Expected Behavior
- `Collection.url`, `Source.url`, and `BaseLink.url` (and its subclasses `StlModelLink.url`, `CharacterLink.url`, `GameLink.url`) all use Django's `URLField` with `validators=[URLValidator(schemes=['http', 'https'])]`, matching the pattern established for `StlModel.url` in #820.
- Only well-formed `http`/`https` URLs are accepted on write (create/update) for all of these fields going forward. Bare domains, relative paths, and non-http(s) schemes are rejected at the serializer level (validation flows automatically from the model field, same as #820 — no custom `validate_url` needed).
- Existing stored values are left untouched by the migration itself (no backfill/data migration) — validation applies only to new writes going forward, matching how `AlterField` migrations behave (they don't re-validate existing rows).
- The now-redundant `#1053` custom `validate_url` methods (and their control-char-stripping/scheme-extraction regexes) are removed from `CollectionCreateSerializer`/`SourceCreateSerializer`, since the model-level `URLValidator` supersedes them.

## Solution
**Backend**:
- Convert `Collection.url` and `Source.url` from `CharField` to `URLField(max_length=200, validators=[URLValidator(schemes=['http', 'https'])], ...)`, preserving each field's existing `null`/`blank`/`unique`/`default` semantics.
- Convert `BaseLink.url` from `URLField()` to `URLField(validators=[URLValidator(schemes=['http', 'https'])])`, narrowing its default schemes (currently `http`/`https`/`ftp`/`ftps`) to `http`/`https` only. This applies to `StlModelLink`, `CharacterLink`, and `GameLink` via inheritance.
- Add the corresponding `AlterField` migrations for `Collection`, `Source`, and `BaseLink`'s concrete subclasses (`StlModelLink`, `CharacterLink`, `GameLink`), plus matching `Historical*` migrations under `backend/versioning/migrations/` for any of these that are tracked by django-simple-history (mirroring migration `0031` from #820 for `HistoricalStlModel`). No data migration/backfill is needed — existing rows are left as-is.
- Remove the `#1053` custom `validate_url` methods (and their supporting control-char-stripping/scheme regexes) from `CollectionCreateSerializer` and `SourceCreateSerializer`, since DRF's `ModelSerializer` auto-derives the equivalent (and now stricter) validation from the model field's `validators=[...]`, same as `StlModelCreateSerializer`/`StlModelUpdateSerializer` already do.
- Update the `#1053` tests in `backend/miniatures/tests/serializers/collection_create_test.py` and `source_create_test.py` that currently assert bare domains/relative paths are accepted — that behavior is intentionally being dropped, so those cases should now assert rejection (or be removed if no longer applicable), and new tests should cover rejection of non-http(s) schemes and malformed URLs for `Collection.url`, `Source.url`, and the `BaseLink` subclasses.

## Benefits
- Consistent, Django-native URL format validation (`URLField`/`URLValidator`) across all URL-shaped, link-rendered fields (`StlModel.url`, `Collection.url`, `Source.url`, `StlModelLink.url`, `CharacterLink.url`, `GameLink.url`), closing the format-validation gap relative to #820 and removing bespoke, harder-to-maintain scheme-allowlist logic.
- Defense-in-depth against stored XSS via disallowed URL schemes, applied uniformly rather than field-by-field.
