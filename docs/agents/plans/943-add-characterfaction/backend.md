# Backend Plan: Add CharacterFaction

Main plan: [plan.md](plan.md)

## Shared contracts

Produces the API surface described in [plan.md](plan.md)'s "Shared contracts" section: the renamed `GameFaction`/`GameFactionPhoto`, the new `CharacterFaction`/`CharacterFactionSerializer`/`CharacterFactionAllSerializer`, the character-centric and faction-centric routes, and the `game_pc_faction`/`game_npc_faction` permission tiers.

## Implementation Steps

### Step 1 — Rename `Faction` → `GameFaction`

- Move `backend/games/models/faction/faction.py` → `backend/games/models/game/game_faction.py`, renaming the class `Faction` → `GameFaction`. Move `backend/games/models/faction/faction_photo.py` → `backend/games/models/game/game_faction_photo.py`, renaming `FactionPhoto` → `GameFactionPhoto` (update its `photo` FK's `related_name`/back-reference if any point at the old class name). Delete the now-empty `backend/games/models/faction/` folder.
- Update `backend/games/models/__init__.py`: replace the `Faction`/`FactionPhoto` imports (currently `from games.models.faction.faction import Faction` / `from games.models.faction.faction_photo import FactionPhoto`) with `GameFaction`/`GameFactionPhoto` from their new `models/game/` location, and update `__all__`.
- Rename serializer files/classes: `backend/games/serializers/games/factions/faction_list.py` → `game_faction_list.py` (`FactionListSerializer` → `GameFactionListSerializer`), `faction_update.py` → `game_faction_update.py` (`FactionUpdateSerializer` → `GameFactionUpdateSerializer`), `faction_photo.py` → `game_faction_photo.py` (`FactionPhotoSerializer` → `GameFactionPhotoSerializer`). Update `backend/games/serializers/__init__.py`'s imports/`__all__` accordingly (`GameFactionPermissionsSerializer`'s existing import is untouched, it's already correctly named).
- Rename the factory: `backend/games/tests/factories/faction.py`'s `FactionFactory` → `GameFactionFactory` (update its `model = Faction` → `model = GameFaction`, and its `games.Faction` FK reference).
- Run `poetry run python manage.py makemigrations games` inside the dev container — Django's autodetector should propose `RenameModel(Faction, GameFaction)` and `RenameModel(FactionPhoto, GameFactionPhoto)` since the field set is unchanged; verify the generated migration uses `RenameModel`, not `RemoveField`/`AddField` pairs (which would drop data) — if it doesn't, write it by hand as `migrations.RenameModel('Faction', 'GameFaction')` / `migrations.RenameModel('FactionPhoto', 'GameFactionPhoto')`.
- Run `poetry run python manage.py makemigrations versioning` too — `simple_history` mirrors the rename into `HistoricalFaction` → `HistoricalGameFaction`/`HistoricalFactionPhoto` → `HistoricalGameFactionPhoto`; same `RenameModel`-not-recreate verification applies.
- Grep every remaining `\bFaction\b`/`\bFactionPhoto\b` reference across `backend/games/` and `backend/permissions/` after the rename (views, serializers docstrings, test files, `backend/games/tests/models/faction/` — consider renaming that test folder to `backend/games/tests/models/game_faction/` for consistency, `backend/games/tests/serializers/games/factions/` test files) and update imports/usages. `backend/permissions/config/game_faction/` (the folder) and `backend/games/views/games/game_faction_*.py` (the view file names) already use the target naming and need no renaming — only their internal `Faction`-typed imports change.

### Step 2 — Remove `Character.factions`

In `backend/games/models/character/character.py`, delete the `factions = models.ManyToManyField('games.Faction', related_name='characters', blank=True)` field (line ~52) and its default-value test in `backend/games/tests/models/character/character_test.py` (`test_character_factions_defaults_to_empty`). Fold this into the same `makemigrations games` run as Step 1 (or its own migration if the autodetector separates them) — either way, `RemoveField` here is safe since the field was never populated/exposed.

### Step 3 — `CharacterFaction` model

New file `backend/games/models/character/character_faction.py`, same shape as `character_document.py`:

```python
class CharacterFaction(models.Model):
    character = models.ForeignKey(
        'games.Character', on_delete=models.CASCADE, related_name='character_factions',
    )
    game_faction = models.ForeignKey(
        'games.GameFaction', on_delete=models.CASCADE, related_name='character_factions',
    )
    hidden = models.BooleanField(default=False)
    history = HistoricalRecords(app='versioning', user_db_constraint=False)

    class Meta:
        ordering = ['id']
        unique_together = [('character', 'game_faction')]

    def __str__(self):
        return self.game_faction.name
```

Register in `backend/games/models/__init__.py` (import + `__all__`), and add to the same `makemigrations games`/`makemigrations versioning` runs as Steps 1–2 (creates the table and `HistoricalCharacterFaction`).

### Step 4 — `CharacterFaction` serializers

New file `backend/games/serializers/characters/character_faction.py`, mirroring `character_document.py` with `document`→`faction` substitution and no `description` (`GameFaction` has none):

```python
class CharacterFactionSerializer(serializers.ModelSerializer):
    game_faction_id = serializers.IntegerField(source='game_faction.id', read_only=True)
    name = serializers.CharField(source='game_faction.name', read_only=True)
    photo_path = serializers.CharField(
        source='game_faction.photo.path', default=None, read_only=True,
    )

    class Meta:
        model = CharacterFaction
        fields = ['id', 'game_faction_id', 'name', 'photo_path']


class CharacterFactionAllSerializer(HiddenFieldMixin, CharacterFactionSerializer):
    class Meta(CharacterFactionSerializer.Meta):
        fields = CharacterFactionSerializer.Meta.fields + ['hidden']
```

Register both in `backend/games/serializers/__init__.py`.

### Step 5 — Faction-characters-list serializer

New file `backend/games/serializers/games/factions/faction_characters.py` (or alongside the other faction-side serializers) — `GameFactionCharacterSerializer`, a read-only serializer over `Character` (not `CharacterFaction`) exposing exactly `id`, `name`, `photo_path`, and a computed `type` field (`'pc'` if `character.is_pc` else `'npc'`), sourced from the character's own photo (not the faction's).

### Step 6 — Character-side exchange (enlist/quit)

New file `backend/games/views/game/_faction_exchange.py`, a straight mirror of `_document_exchange.py` with `document`→`faction` substitution throughout: `_check_faction_create(request, game, character, tier)` (resource `'game_pc_faction'`/`'game_npc_faction'`), `_FactionAcquireSerializer` (`game_faction_id`, `hidden`), `_FactionRemoveSerializer` (`game_faction_id`), `character_factions_available`, `character_faction_acquire` (checks membership via `character.character_factions`, returns `422` `{'game_faction_id': ['game_faction_already_enlisted']}` on duplicate), `character_faction_remove` (404 on non-membership), and `_find_game_faction(game, game_faction_id, allow_hidden)` — since `GameFaction` has no `hidden` field (per the issue's "Hidden concept for Faction" decision), this helper drops the `hidden`-gate branch entirely and just does `game.factions.filter(id=game_faction_id).first()` or 404; the `allow_hidden` parameter can be dropped from this one function's signature (unlike the document equivalent) since there's nothing for it to gate.

New file `backend/games/views/game/_faction_summary.py`, mirroring `_document_summary.py`: `character_faction_summary(request, game, character_id, faction_id, npc, check_hidden, allow_hidden=False)` returns `{'enlisted': <bool>}` (not `{'owned': ...}` — matches the issue's specified response shape), and `check_faction_summary_all_permission` reusing the `restricted`/`create` tier on `game_pc_faction`/`game_npc_faction`, mirroring `check_document_summary_all_permission`.

In `backend/games/views/game/_character_shared.py`, add `_character_faction_resource(character)` (returns `'game_pc_faction'`/`'game_npc_faction'`) alongside the existing `_character_document_resource` etc., and the following `build_*` functions, each a direct mirror of its `build_document_*` counterpart (same file, added near the document builders): `build_factions_view`, `build_factions_all_view`, `build_faction_detail_view` (default `serializer_class=CharacterFactionSerializer`), `build_faction_detail_full_view`, `build_factions_available_view` (using `GameFactionListSerializer`/`GameFactionAllListSerializer` — confirm these detail/all-list serializer names exist post-rename, matching `GameDocumentListSerializer`/`GameDocumentAllListSerializer`'s pair), `build_factions_available_all_view`, `build_faction_acquire_view`, `build_faction_acquire_all_view`, `build_faction_remove_view`, `build_faction_remove_all_view`.

### Step 7 — Character-side view files and URL wiring

New folders `backend/games/views/game/pcs/detail/factions/` and `backend/games/views/game/npcs/detail/factions/`, each with one thin file per view (mirroring `pcs/detail/documents/`'s file-per-view convention, `document`→`faction`, dropping the files/photos-specific ones since factions have no attached files/photos):

| File | Builder called |
|---|---|
| `game_pc_factions.py` | `build_factions_view(npc=False)` |
| `game_pc_factions_all.py` | `build_factions_all_view(npc=False, serializer_class=CharacterFactionAllSerializer)` |
| `game_pc_faction_detail.py` | `build_faction_detail_view(npc=False)` |
| `game_pc_faction_detail_full.py` | `build_faction_detail_full_view(npc=False, serializer_class=CharacterFactionAllSerializer)` |
| `game_pc_factions_available.py` | `build_factions_available_view(npc=False)` |
| `game_pc_factions_available_all.py` | `build_factions_available_all_view(npc=False)` |
| `game_pc_faction_acquire.py` | `build_faction_acquire_view(npc=False)` |
| `game_pc_faction_acquire_all.py` | `build_faction_acquire_all_view(npc=False)` |
| `game_pc_faction_remove.py` | `build_faction_remove_view(npc=False)` |
| `game_pc_faction_remove_all.py` | `build_faction_remove_all_view(npc=False)` |

...and the `npc=True` equivalents under `npcs/detail/factions/` with `game_npc_*` names. Register every one of these in `backend/games/views/game/pcs/__init__.py` / `npcs/__init__.py` (imports + `__all__`), same pattern as the existing document entries.

In `backend/games/urls/_character_routes.py`'s `_CHARACTER_ROUTES` list, add (right after the `documents`/`items` blocks, before `possessions` or wherever reads best):

```python
('/factions.json', 'factions'),
('/factions/all.json', 'factions_all'),
('/factions/<int:faction_id>.json', 'faction_detail'),
('/factions/<int:faction_id>/full.json', 'faction_detail_full'),
('/factions/available.json', 'factions_available'),
('/factions/available/all.json', 'factions_available_all'),
('/factions/acquire.json', 'faction_acquire'),
('/factions/acquire/all.json', 'faction_acquire_all'),
('/factions/remove.json', 'faction_remove'),
('/factions/remove/all.json', 'faction_remove_all'),
```

### Step 8 — Faction-side summary and characters-list endpoints

New view files under `backend/games/views/game/pcs/detail/factions/` (`game_pc_faction_summary.py`, `game_pc_faction_summary_all.py`) and the `npcs` equivalents, mirroring `game_pc_document_summary.py`/`game_pc_document_summary_all.py` exactly (`document`→`faction`, `owned`→`enlisted`), calling into `_faction_summary.py` (Step 6).

New shared helper `backend/games/views/games/_faction_characters.py` (mirroring `_document_summary.py`'s shape, but for a paginated character listing scoped to a faction rather than a single character's summary): a `faction_characters(request, game, faction, allow_hidden)` function returning a `paginated_list_response` over `faction.character_factions.select_related('character')` (excluding hidden characters when not `allow_hidden`, via `character__hidden=False`), serialized with `GameFactionCharacterSerializer` (Step 5) applied to each row's `.character`.

New view files `backend/games/views/games/game_faction_characters.py` (regular — `AllowAny`, no `X-Skip-Cache`) and `backend/games/views/games/game_faction_characters_all.py` (restricted — gated by `check_game_edit`, always sets `X-Skip-Cache: true`), mirroring `game_documents.py`/`game_documents_all.py`'s regular/restricted split.

In `backend/games/urls/games.py`, add near the existing `game-faction-detail`/`game-faction-photo-upload` entries:

```python
path(
    'games/<slug:game_slug>/factions/<int:faction_id>/characters.json',
    views.game_faction_characters,
    name='game-faction-characters',
),
path(
    'games/<slug:game_slug>/factions/<int:faction_id>/characters/all.json',
    views.game_faction_characters_all,
    name='game-faction-characters-all',
),
path(
    'games/<slug:game_slug>/factions/<int:faction_id>/pcs/<int:character_id>/summary.json',
    views.game_pc_faction_summary,
    name='game-faction-pc-summary',
),
path(
    'games/<slug:game_slug>/factions/<int:faction_id>/pcs/<int:character_id>/summary/all.json',
    views.game_pc_faction_summary_all,
    name='game-faction-pc-summary-all',
),
# ...and the npcs equivalents, mirroring the documents block exactly.
```

### Step 9 — Permission config

New folders `backend/permissions/config/game_pc_faction/` and `backend/permissions/config/game_npc_faction/`, each with an `endpoints.yml` identical in shape to `game_pc_document`/`game_npc_document`'s:

```yaml
restricted:
  create:
    - staff
    - owner
regular:
  create:
    - staff
    - player
```

(NPC's `owner` tier resolves the same way `game_npc_document`'s already does — no `owner` concept for NPCs, confirm by reading that file's exact tier list rather than assuming PC/NPC are identical here.)

### Step 10 — Tests

- Model tests: `backend/games/tests/models/character/character_faction_test.py` (mirrors `character_document_test.py`), plus updates to `backend/games/tests/models/game_faction/` (renamed from `faction/`, Step 1) and `character_test.py` (removed `factions` field test).
- Serializer tests: `backend/games/tests/serializers/characters/character_faction_test.py`, `character_faction_all_test.py` (mirrors the two `character_document_*_test.py` files), plus the renamed `game_faction_list_test.py`/`game_faction_update_test.py` (Step 1).
- View tests, under `backend/games/tests/views/game/pcs/detail/factions/` and `npcs/.../factions/` (mirrors the documents test tree): acquire/remove happy path, double-enlist → 422, quit-non-member → 404, hidden-character gate, cross-game faction id → 404, restricted-vs-regular tier enforcement.
- `backend/games/tests/views/games/game_faction_characters_test.py` / `game_faction_characters_all_test.py`: pagination, hidden-character exclusion, slain characters included by default, `X-Skip-Cache` header presence/absence per the regular/restricted split, faction with zero characters.
- `backend/games/tests/views/games/game_pc_faction_summary_test.py` (+ `_all`, + `npc` equivalents).
- Permission config tests mirroring `backend/games/tests/views/permissions/` coverage for `game_pc_document`/`game_npc_document`, adapted for `game_pc_faction`/`game_npc_faction`.

## Files to Change

- `backend/games/models/game/game_faction.py`, `game_faction_photo.py` — new (moved+renamed from `models/faction/`).
- `backend/games/models/faction/` — deleted.
- `backend/games/models/character/character_faction.py` — new.
- `backend/games/models/character/character.py` — remove `factions` field.
- `backend/games/models/__init__.py` — registration updates.
- `backend/games/migrations/00XX_...py` (rename + `CharacterFaction` create), `backend/versioning/migrations/00XX_...py` (historical mirror) — new.
- `backend/games/serializers/games/factions/game_faction_list.py`, `game_faction_update.py`, `game_faction_photo.py` — renamed from `faction_*.py`.
- `backend/games/serializers/games/factions/faction_characters.py` — new.
- `backend/games/serializers/characters/character_faction.py` — new.
- `backend/games/serializers/__init__.py` — registration updates.
- `backend/games/tests/factories/faction.py` — `FactionFactory` → `GameFactionFactory`.
- `backend/games/views/game/_faction_exchange.py`, `_faction_summary.py` — new.
- `backend/games/views/game/_character_shared.py` — new `build_faction_*` functions.
- `backend/games/views/game/pcs/detail/factions/*.py`, `backend/games/views/game/npcs/detail/factions/*.py` — new (10 files each, per Step 7/8).
- `backend/games/views/game/pcs/__init__.py`, `npcs/__init__.py` — registration updates.
- `backend/games/views/games/_faction_characters.py`, `game_faction_characters.py`, `game_faction_characters_all.py` — new.
- `backend/games/urls/_character_routes.py` — new `factions` route block.
- `backend/games/urls/games.py` — new faction-characters and faction-summary routes.
- `backend/permissions/config/game_pc_faction/endpoints.yml`, `backend/permissions/config/game_npc_faction/endpoints.yml` — new.
- Test files per Step 10.

## CI Checks

- `docker-compose run --rm majora_tests pytest games/tests/views/game/ --cov` (CI job: `pytest_views_characters`) — covers the new `pcs/detail/factions/`, `npcs/detail/factions/` view tests.
- `docker-compose run --rm majora_tests pytest games/tests/views/ --ignore=games/tests/views/game/ --cov` (CI job: `pytest_views_rest`) — covers `game_faction_characters*`/`game_*_faction_summary*` view tests.
- `docker-compose run --rm majora_tests pytest --ignore=games/tests/views/ --cov` (CI job: `pytest_all`) — covers model/serializer tests.
- `docker-compose run --rm majora_tests poetry run ruff check .` (CI job: `checks`).

## Notes

- Confirm the exact `owner`-tier resolution for `game_npc_faction` by reading `game_npc_document/endpoints.yml` directly rather than assuming it's identical to the PC version — NPCs have no player-owner concept, so that file's `restricted.create` list may already read differently from `game_pc_document`'s.
- Migration numbers depend on what else has landed on `main` by implementation time — verify against the current `migrations/` directory rather than assuming specific numbers.
- Double-check whether `GameFactionListSerializer`/a `GameFactionAllListSerializer` pair actually needs creating (documents have both a plain and an "all" list serializer for the `available`/`available/all` catalog endpoints) — the current single `FactionListSerializer` may need splitting the same way, or may already suffice if it has no hidden-dependent fields to add in an "all" variant. `GameFaction` having no `hidden` field means there may be nothing an "all" variant would add — verify before assuming a split is needed.
