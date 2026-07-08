# Backend Plan: Add create/edit links API

Main plan: [plan.md](plan.md)

## Shared contracts

See "Links payload shape" in [plan.md](plan.md#shared-contracts) — this agent implements the
server side of that contract: accept a `links` array on `CharacterUpdateSerializer` (PC/NPC
update) and `CharacterCreateSerializer` (NPC create), and process create/update/delete
semantics per entry. The response continues to use the existing, unchanged
`CharacterDetailSerializer` (its read-only `links` field already reflects persisted state).

## Implementation Steps

### Step 1 — Add a writable `CharacterLinkWriteSerializer`

Add a new serializer (e.g. `source/games/serializers/character_link_write.py`,
`CharacterLinkWriteSerializer`) distinct from the existing read-only `CharacterLinkSerializer`
(`source/games/serializers/character_link.py`, which stays read-only and keeps being used by
`CharacterDetailSerializer`). This new serializer:
- fields: `id` (optional, `required=False`), `text` (optional), `url` (required unless
  `delete` is true), `link_type` (optional, blank allowed), `delete` (a plain
  `serializers.BooleanField(required=False, default=False)`, not a model field — do not add a
  `delete` column to `CharacterLink`).
- is used as `many=True` inside the character serializers below, not registered as a
  standalone endpoint.

### Step 2 — Make `links` writable on `CharacterUpdateSerializer`

In `source/games/serializers/character_update.py`:
- add `links = CharacterLinkWriteSerializer(many=True, required=False)` to the serializer.
- add `'links'` to `Meta.fields`.
- override `update(self, instance, validated_data)`: pop `links` from `validated_data` (default
  `[]`), call `super().update(...)` for the scalar fields, then process the links list:
  - for each entry with `delete=True`: fetch `instance.links.get(id=entry['id'])` and delete it
    (skip/ignore if the id doesn't belong to this character, or raise a validation error —
    prefer raising a `serializers.ValidationError` for an unknown/foreign id, consistent with
    fail-fast behavior elsewhere in this codebase).
  - for each entry without `id` (and not being deleted): create a new `CharacterLink` with
    `character=instance`.
  - for each entry with `id` and not being deleted: fetch and update `text`/`url`/`link_type`
    on the existing `CharacterLink` (scoped to `instance.links`, so a link `id` belonging to a
    different character cannot be edited/deleted this way).
  - return `instance`.

### Step 3 — Make `links` writable on `CharacterCreateSerializer` (NPC create)

In `source/games/serializers/character_create.py`, mirror Step 2 for `create`: add the same
`links` field, add to `Meta.fields`, override `create(self, validated_data)` to pop `links`,
call `super().create(...)` (or `Character.objects.create(...)` as currently done via
`serializer.save(game=game, npc=True)` in the view — check how `save()` forwards `game`/`npc`
kwargs into `create()` before assuming; keep the existing `game`/`npc` kwarg-forwarding
behavior intact), then create a `CharacterLink` for each entry in `links` (ignore `id`/`delete`
on create — a freshly created character cannot have persisted links yet).

### Step 4 — Tests

- `source/games/tests/serializers/test_character_update.py` (create if it doesn't exist, check
  first) and/or extend `source/games/tests/serializers/test_character_link.py`: cover creating a
  new link via update, updating an existing link's fields, deleting a link via `delete: true`,
  and rejecting a `url`-less non-delete entry.
- `source/games/tests/serializers/test_character_create.py` (check if it exists): cover NPC
  creation with an initial `links` array.
- `source/games/tests/views/characters/`: extend the existing PATCH (`pcs`/`npcs` detail) and
  NPC-create view tests to exercise the new `links` payload end-to-end (status codes, DB state,
  and that the returned `CharacterDetailSerializer.links` reflects the change).
- Confirm a link `id` belonging to another character cannot be updated/deleted through this
  payload (permission/ownership check at the serializer level, per Step 2/3).

## Files to Change

- `source/games/serializers/character_link_write.py` — new writable link serializer.
- `source/games/serializers/character_update.py` — add writable `links` field + `update()`.
- `source/games/serializers/character_create.py` — add writable `links` field + `create()`.
- `source/games/serializers/__init__.py` — export `CharacterLinkWriteSerializer` if other
  modules need to import it directly (likely not required outside the two files above).
- `source/games/tests/serializers/test_character_link.py` / new serializer test files as needed.
- `source/games/tests/views/characters/` — extend relevant PATCH/POST view tests.

## CI Checks

- `source/`: `docker-compose run --rm majora_tests pytest games/tests/views/characters/ --cov` (CI job: `pytest_views_characters`)
- `source/`: `docker-compose run --rm majora_tests pytest games/tests/serializers/ --cov` (part of CI job: `pytest_all`)
- `source/`: `docker-compose run --rm majora_tests ruff check .` (lint, part of CI job: `checks`/`pytest_all` pipeline — confirm exact ruff invocation in `.circleci/config.yml` if it differs)

## Notes

- Do not add a `delete` model field to `CharacterLink` — `delete` in the write serializer is a
  transient, write-only signal, not persisted state.
- Keep views thin per `AGENTS.md` conventions — all of the create/update/delete branching
  belongs in the serializers (Steps 2–3), not in `views/characters/_detail.py` or
  `views/characters/game_npcs.py`.
- `url` being required for non-delete entries should produce a normal DRF field-level 400
  validation error (consistent with existing `CharacterUpdateSerializer`/`CharacterCreateSerializer`
  behavior), so the frontend's existing `fieldErrors` handling can surface it — coordinate the
  exact error key shape (`links` as a list of per-item error dicts) with the frontend agent if
  the frontend plans to surface per-link errors; if not, a generic top-level failure is
  acceptable for v1.
