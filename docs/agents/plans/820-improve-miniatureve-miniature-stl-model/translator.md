# Translator Plan: Improve miniature/stl_model

Main plan: [plan.md](plan.md)

## Shared contracts

Consumes the key list [frontend.md](frontend.md) needs for the new `url`/`size`/`races`/`roles` UI. The list below is the best-known set as of planning time; frontend's actual implementation is the source of truth for exact key names (particularly the picker's search-placeholder/remove-badge keys) — reconcile against frontend's finished component before finalizing.

## Implementation Steps

### Step 1 — `stl_model_page.yaml` (show page)

Add to both `frontend/assets/i18n/en/stl_model_page.yaml` and `frontend/assets/i18n/pt/stl_model_page.yaml`:
- `url_label`
- `size_label`, and one `size_<value>` key per `SIZE_VALUES` entry: `size_tiny`, `size_small`, `size_medium`, `size_huge`, `size_gargantuan`, `size_life`
- `races_label`, `roles_label` (plural labels for the show page's array rendering — replacing the current singular `race_label`/`role_label` usage there; keep the existing `race_label`/`role_label` keys only if anything else still references them, otherwise they become dead and can be removed alongside frontend's change)
- 18 new `race_<value>` keys, one per new race value (lowercased, matching the existing `race_<value>` slug convention — e.g. `race_half-elf` already uses a hyphen, so hyphenated/compound values follow the same pattern): `race_turtlefolk`, `race_cthulhufolk`, `race_humanoid`, `race_construct`, `race_monstrosity`, `race_undead`, `race_aberration`, `race_beast`, `race_alien`, `race_fiend`, `race_fey`, `race_giant`, `race_dragon`, `race_celestial`, `race_elemental`, `race_cyborg`, `race_plant`, `race_ooze`

### Step 2 — `stl_model_new_page.yaml` (shared by new + edit forms)

Add to both locale files:
- `url_label`, `url_placeholder`
- `size_select_label`, `size_select_none_option`
- Whatever search-placeholder and remove-badge keys the generalized picker component (frontend.md Step 2/3) ends up needing for its races/roles mode — likely something like `races_search_placeholder`/`roles_search_placeholder`, and either new `remove_race_tooltip`/`remove_role_tooltip` keys or reuse of the existing `remove_tag_tooltip` key, depending on what frontend lands on. Confirm the exact set against the finished frontend component rather than assuming this list is complete.

### Step 3 — Portuguese translations

Provide real Portuguese translations for every new key in Step 1/2's `pt` files — not placeholder copies of the English text — same quality bar as the existing `pt` entries for `race_*`/`role_*`/`type_*`.

### Step 4 — Verify parity

Run the key-parity check locally before considering this done.

## Files to Change

- `frontend/assets/i18n/en/stl_model_page.yaml`
- `frontend/assets/i18n/pt/stl_model_page.yaml`
- `frontend/assets/i18n/en/stl_model_new_page.yaml`
- `frontend/assets/i18n/pt/stl_model_new_page.yaml`

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe npm run check_i18n` (CI job: `frontend-checks`)

## Notes

- This must land in the same PR/branch as the frontend changes (or after them) — the exact key names depend on what frontend actually builds in Step 2/3 of [frontend.md](frontend.md), which may drift from this plan's best guess.
