# Backend Plan: Add incognito for NPC

Main plan: [plan.md](plan.md)

## Shared contracts

See [plan.md](plan.md)'s "Shared contracts" section for the full field/endpoint contract this
agent must produce. In short: a new `Character.incognito` field, private-only exposure on the
NPC full/all-list endpoints, write access via the same full-editor serializers `hidden` uses,
and a `profile_photo_path`-nulling side effect on the two public NPC serializers only.

## Implementation Steps

### Step 1 — Model field

Add `incognito = models.BooleanField(default=False)` to `Character`
(`backend/games/models/character/character.py:38`), directly under the existing `hidden` field.

### Step 2 — Migrations

Generate migrations for both apps that must pick up the new field:

- `games` app: a plain `AddField` migration, exactly like
  `backend/games/migrations/0020_character_hidden.py` (`AddField(model_name='character',
  name='incognito', field=models.BooleanField(default=False))`).
- `versioning` app: `Character` is tracked via `HistoricalRecords(app='versioning', ...)`
  (`backend/games/models/character/character.py`), so `HistoricalCharacter` also needs the new
  column — run `makemigrations` for `versioning` too (there is no precedent migration for adding
  a field to an already-tracked historical model here, but the mechanism is standard Django
  `HistoricalRecords` behavior — confirm the generated migration only adds the one field to
  `historicalcharacter`).

Run migrations through the project's Docker tooling, not directly on the host (see
`AGENTS.md`): `docker-compose run --rm majora_tests python manage.py makemigrations` (or the
project's usual `make setup` flow), then verify with `--check --dry-run` that nothing else is
pending.

### Step 3 — Private serializers (expose `incognito`, mirroring `hidden`)

- `backend/games/serializers/characters/character_full.py`
  (`CharacterFullSerializer`): add `incognito = serializers.BooleanField(read_only=True)` and
  `'incognito'` to `Meta.fields`, same line pattern as `hidden`.
- `backend/games/serializers/characters/character_full_list.py`
  (`CharacterFullListSerializer`): same treatment.
- `backend/games/serializers/characters/character_create.py`
  (`CharacterCreateSerializer`, backs `POST /games/<slug>/npcs/full.json`): add `'incognito'` to
  `Meta.fields` and to `extra_kwargs` (`{'required': False}`), same as `hidden`.
- `backend/games/serializers/characters/character_update.py`
  (`CharacterUpdateSerializer`, backs `PATCH /games/<slug>/npcs/<id>/full.json` and
  `pcs/<id>/full.json`): add `'incognito'` to `Meta.fields` — `extra_kwargs` here is already a
  comprehension over `fields`, so no separate edit needed.
- Do **not** touch `backend/games/serializers/characters/npcs/npc_player_create.py`
  (`NpcPlayerCreateSerializer`) or `.../npcs/npc_player_update.py`
  (`NpcPlayerUpdateSerializer`) — `incognito` must stay absent from both, exactly like `hidden`
  is absent today, so a player payload can never read or write it.

### Step 4 — Public serializers (`profile_photo_path` nulling — new mechanic)

`backend/games/serializers/characters/character_detail.py` (`CharacterDetailSerializer`) and
`character_list.py` (`CharacterListSerializer`) currently declare
`profile_photo_path = serializers.CharField(source='profile_photo.path', default=None,
read_only=True)`. There is no existing "null a field based on a boolean" precedent in this
codebase (the `hidden` field instead excludes/404s the whole character) — implement this as:

- In both serializers, replace the plain `CharField` with a `SerializerMethodField` (e.g.
  `get_profile_photo_path(self, obj)`) that returns `None` when `obj.incognito` is truthy,
  otherwise the existing `obj.profile_photo.path if obj.profile_photo else None` value.
- `CharacterFullSerializer`/`CharacterFullListSerializer` inherit `profile_photo_path` from these
  two base classes without redeclaring it today — since private/full endpoints must keep
  returning the real photo regardless of `incognito` (see `plan.md`'s "Private endpoints are
  unaffected" contract), explicitly redeclare `profile_photo_path` back to the original plain
  `CharField(source='profile_photo.path', default=None, read_only=True)` in both
  `CharacterFullSerializer` and `CharacterFullListSerializer`, overriding the method-field
  behavior they'd otherwise inherit.
- `incognito` itself is never added to `CharacterDetailSerializer`/`CharacterListSerializer`'s
  `Meta.fields` — the public payload never carries the boolean, only its side effect.

### Step 5 — Docs

Update `docs/agents/access-control/character.md`: add an "Incognito field" section modeled on
the existing "Hidden field" section — read exposure (private-only, DM/admin endpoints), write
access (same `CharacterEdit`-gated routes, absent from the narrow player-writable serializers),
and the public-side `profile_photo_path`-nulling effect (cross-reference "Photo path fields" in
`docs/agents/access-control/common-rules.md` and briefly note the exception there too).

### Step 6 — Tests

Backend tests live under `backend/games/tests/`, mirroring the source tree 1:1.

- `tests/models/character/character_test.py` — cover the new field's default (`False`).
- `tests/serializers/characters/character_full_test.py`,
  `character_full_list_test.py` — assert `incognito` is present and round-trips.
- `tests/serializers/characters/character_detail_test.py`,
  `character_list_test.py` — assert `profile_photo_path` is `null` when `incognito=True` and the
  real path otherwise; assert the `incognito` key itself is never present in the payload.
- `tests/serializers/characters/npcs/npc_player_create_test.py`,
  `npc_player_update_test.py` — assert a player payload including `incognito` is silently
  ignored (same convention as the existing `hidden`-exclusion coverage there, if present).
- `tests/views/game/npcs/game_npcs_full_test.py` (`POST .../npcs/full.json`) — accepts
  `incognito` at creation.
- `tests/views/game/npcs/detail/game_npc_full_test.py` (`GET`/`PATCH .../npcs/<id>/full.json`) —
  read/write `incognito`.
- `tests/views/game/npcs/game_npcs_all_test.py` (`GET .../npcs/all.json`) — `incognito` present,
  filterless (no `?incognito=` filter is requested by this issue — do not add one).
- `tests/views/game/npcs/game_npcs_test.py` (`GET .../npcs.json`) and
  `game_npc_detail_test.py` (`GET .../npcs/<id>.json`) — `profile_photo_path` null behavior,
  `incognito` absent from the response, and confirm a `hidden=True, incognito=True` NPC still
  behaves exactly like `hidden=True, incognito=False` (hidden precedence, no new branch needed
  since the existing hidden-gate runs unconditionally before serialization).

## CI Checks

- `backend`: `docker-compose run --rm majora_tests pytest` (CI jobs: `pytest_views_characters`,
  `pytest_all`)
- `backend`: `docker-compose run --rm majora_tests poetry run ruff check .` (CI job: `checks`)

## Notes

- No new permission class or view changes are needed — every route already gates on
  `CharacterEditPermission`/`GameEditPermission` generically; only the serializers' field lists
  change.
- `npcs/all.json` already supports `?hidden=true|false` filtering — this issue does not ask for
  an equivalent `?incognito=` filter (see the issue's "What this issue is not about" — no new
  endpoints), so skip adding one.
