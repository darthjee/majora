# Backend Plan: Grow STL model and create and show page

Main plan: [plan.md](plan.md)

## Shared contracts

Produces the field/value contract and API surface documented in [plan.md](plan.md)'s "Shared
contracts" section — `owned`/`type`/`race`/`role` on `StlModel`, and the new
`PATCH /miniatures/stl_models/<id>.json` endpoint. Frontend and translator consume these as-is;
do not rename fields or reorder/rename `db_value`s once this is implemented, since both other
agents' work is keyed to the exact list.

## Implementation Steps

### Step 1 — Add fields to `StlModel`

Edit `backend/miniatures/models/stl_model.py`:

```python
class StlModel(models.Model):
    TYPE_TERRAIN = 'terrain'
    TYPE_PROP = 'prop'
    TYPE_CREATURE = 'creature'
    TYPE_OTHER = 'other'
    TYPE_CHOICES = [
        (TYPE_TERRAIN, 'Terrain'),
        (TYPE_PROP, 'Prop'),
        (TYPE_CREATURE, 'Creature'),
        (TYPE_OTHER, 'Other'),
    ]

    RACE_HUMAN = 'human'
    RACE_ELF = 'elf'
    RACE_DWARF = 'dwarf'
    RACE_HALFLING = 'halfling'
    RACE_GNOME = 'gnome'
    RACE_HALF_ELF = 'half-elf'
    RACE_HALF_ORC = 'half-orc'
    RACE_TIEFLING = 'tiefling'
    RACE_DRAGONBORN = 'dragonborn'
    RACE_ORC = 'orc'
    RACE_GOBLIN = 'goblin'
    RACE_CHOICES = [
        (RACE_HUMAN, 'Human'), (RACE_ELF, 'Elf'), (RACE_DWARF, 'Dwarf'),
        (RACE_HALFLING, 'Halfling'), (RACE_GNOME, 'Gnome'), (RACE_HALF_ELF, 'Half-Elf'),
        (RACE_HALF_ORC, 'Half-Orc'), (RACE_TIEFLING, 'Tiefling'),
        (RACE_DRAGONBORN, 'Dragonborn'), (RACE_ORC, 'Orc'), (RACE_GOBLIN, 'Goblin'),
    ]

    ROLE_BARBARIAN = 'barbarian'
    # ... one constant per value in plan.md's table ...
    ROLE_CHOICES = [...]

    # existing fields (name, photo, sources, collections, tags, history) unchanged, plus:
    owned = models.BooleanField(default=True)
    type = models.CharField(max_length=16, choices=TYPE_CHOICES)
    race = models.CharField(max_length=16, choices=RACE_CHOICES, null=True, blank=True)
    role = models.CharField(max_length=16, choices=ROLE_CHOICES, null=True, blank=True)
```

Follow the `AuthorizationRequest.status`/`Game.GAME_TYPE_CHOICES` convention already used
elsewhere in this codebase (plain class constants + `choices=`) — do not introduce a YAML-loading
mechanism (this was explicitly decided against during issue refinement). `max_length=16` covers
the longest value (`half-elf`/`half-orc`/`sorcerer`/`barbarian`, all ≤ 10; use whatever the
longest actual value needs — double-check against the final constant list).

`type` has no `default` (required on create, matches the issue spec's "nullable: false, no
default"). `race`/`role` are `null=True, blank=True` (nullable, no default — `None`).

### Step 2 — Migration

Generate via `docker-compose run --rm majora_tests python manage.py makemigrations miniatures`
(per `AGENTS.md`, never run tooling on the host). This should produce one `AddField`-only
migration (no `CreateModel`) plus the paired `versioning` app historical-model migration (simple
history), same shape as `backend/versioning/migrations/0026_historicalcollection_...py`.

### Step 3 — Update serializers

`backend/miniatures/serializers/stl_model_create.py` (`StlModelCreateSerializer`): add `owned`
(not required, default `True`), `type` (required), `race`/`role` (not required, default `None`)
to `Meta.fields` and `extra_kwargs`. No custom `validate_*` needed — Django's `choices` validation
on the model field is enough (DRF's `ModelSerializer` auto-generates a `ChoiceField` from
`choices=`, rejecting unknown values with a 400).

`backend/miniatures/serializers/stl_model_detail.py` (`StlModelDetailSerializer`): add `owned`,
`type`, `race`, `role` to `Meta.fields` (plain passthrough, no custom field needed — `race`/`role`
serialize as `null` when unset, matching the "None" contract in plan.md).

### Step 4 — New update serializer

New file `backend/miniatures/serializers/stl_model_update.py` (`StlModelUpdateSerializer`),
mirroring `backend/games/serializers/games/game_update.py`'s shape but simpler (no nested
`links`-style sync needed):

```python
class StlModelUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = StlModel
        fields = ['name', 'owned', 'type', 'race', 'role']
        extra_kwargs = {field: {'required': False} for field in fields}
```

Register it in `backend/miniatures/serializers/__init__.py` (import + `__all__`, alphabetical,
matching the existing convention).

### Step 5 — New update endpoint

Edit `backend/miniatures/views/stl_model_detail.py` to handle `GET` and `PATCH` via
`games.views.common.detail_or_update` (the same shared helper `game_detail.py`/
`treasure_detail.py` use):

```python
from games.views.common import detail_or_update, require_staff

def _check_stl_model_edit(request, _stl_model):
    """Adapt `require_staff`'s `(request)` signature to `detail_or_update`'s `(request, obj)`."""
    return require_staff(request)

@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def stl_model_detail(request, stl_model_id):
    try:
        stl_model = StlModel.objects.get(pk=stl_model_id)
    except StlModel.DoesNotExist:
        return skip_cache(Response(NOT_FOUND_RESPONSE_DATA, status=404))
    return skip_cache(detail_or_update(
        request, stl_model, _check_stl_model_edit,
        StlModelUpdateSerializer, StlModelDetailSerializer,
    ))
```

This is the first non-game-scoped resource to use `detail_or_update` with a plain
`require_staff` check rather than `EndpointPermission`/`check_game_edit` — the `_check_stl_model_edit`
adapter is a new, small, one-off shim (not a new shared helper; `Source`/`Collection` still have
no update endpoint, so there's nothing yet to generalize this into).

Update `backend/miniatures/urls/stl_models.py`'s docstring/comment if it references "detail" as
GET-only (it currently doesn't restrict by method in the URL, so no path change needed — `path()`
already routes both GET and PATCH to the same view function).

### Step 6 — Access-control doc

Update `docs/agents/access-control/stl-model.md`:
- The `| Update/Delete |` table row currently says "None — still no update/delete endpoints" —
  change to document the new `PATCH /miniatures/stl_models/<id>.json` (staff-or-superuser,
  `require_staff`, same tier as create), and note Delete is still unsupported.
- Update the "Fields" section to list `owned`, `type`, `race`, `role` in the Detail/Create shapes.
- Add a "Update endpoint" section (mirroring "Create endpoint"'s shape) documenting accepted
  fields, response codes (200 on success, 400/401/403/404).

## Files to Change

- `backend/miniatures/models/stl_model.py` — add `owned`/`type`/`race`/`role` fields + choices.
- `backend/miniatures/migrations/000N_*.py` — generated migration.
- `backend/versioning/migrations/000N_*.py` — generated historical-model migration.
- `backend/miniatures/serializers/stl_model_create.py` — accept new fields.
- `backend/miniatures/serializers/stl_model_detail.py` — expose new fields.
- `backend/miniatures/serializers/stl_model_update.py` — new file.
- `backend/miniatures/serializers/__init__.py` — register `StlModelUpdateSerializer`.
- `backend/miniatures/views/stl_model_detail.py` — add `PATCH` handling via `detail_or_update`.
- `docs/agents/access-control/stl-model.md` — document new fields + update endpoint.
- Tests (see below).

## Tests

- `backend/miniatures/tests/models/stl_model_test.py` — `owned` defaults to `True`; `type`
  required; `race`/`role` default to `None`; invalid choice raises on `full_clean()`.
- `backend/miniatures/tests/serializers/stl_model_create_test.py` — new fields accepted; unknown
  `type`/`race`/`role` value → validation error; `type` omitted → validation error; `owned`
  omitted → defaults `True`.
- `backend/miniatures/tests/serializers/stl_model_detail_test.py` — new fields serialize
  (including `race`/`role` as `null` when unset).
- New `backend/miniatures/tests/serializers/stl_model_update_test.py`.
- `backend/miniatures/tests/views/stl_model_detail_test.py` — extend for `PATCH`: 200 for
  staff/superuser with a valid partial payload, 400 for an invalid choice, 401 unauthenticated,
  403 authenticated-non-staff, 404 unknown id (same as existing `GET` 404 case).

## CI Checks

- `backend`: `docker-compose run --rm majora_tests pytest` (CI job `pytest_all`)
- `backend`: `docker-compose run --rm majora_tests ruff check .` (CI job `checks`)

## Notes

- `max_length` for the three choice fields: pick a value that comfortably fits the longest
  `db_value` in each list (e.g. 16 covers everything in plan.md's table) — confirm against the
  final constant list once written, per this codebase's existing `CharField(max_length=...,
  choices=...)` convention (no fixed project-wide standard length for choice fields).
- The update endpoint intentionally excludes `photo`/`tags`/`sources`/`collections` — those already
  have their own flows (photo upload endpoint; tags/sources/collections have no edit UI in scope
  per the issue's discussion). If a future issue wants to edit those too, extend
  `StlModelUpdateSerializer` then.
