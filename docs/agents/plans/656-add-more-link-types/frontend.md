# Frontend Plan: Add more link types

Main plan: [plan.md](plan.md)

## Shared contracts

Relies on:
- Backend defining `link_type` values `diary`, `music`, `stl`, `background`, `reference` (string values only — no frontend code reads backend Python directly).
- Translator adding `link_type_diary`, `link_type_music`, `link_type_stl`, `link_type_background`, `link_type_reference` keys to `en.yaml`/`pt.yaml`.

Produces: the Bootstrap Icon class mapping below, consumed only within the frontend.

| type | Icons.js key | class |
| --- | --- | --- |
| `diary` | `feather` | `bi-feather` |
| `music` | `musicNoteList` | `bi-music-note-list` |
| `stl` | `box` | `bi-box` |
| `background` | `bookHalf` | `bi-book-half` |
| `reference` | `bookmarkStarFill` | `bi-bookmark-star-fill` |

Full ordered type-value list the dropdown must render (blank first, then existing, then new, in this order):
`'', 'lootstudio', 'diary', 'music', 'stl', 'background', 'reference'`

## Implementation Steps

### Step 1 — Add new icon classes to `Icons.js`

In `frontend/assets/js/utils/ui/Icons.js`, add the 5 new entries from the table above to the exported object (any location, grouped logically is fine — no ordering requirement in this file).

### Step 2 — Extend `LinkIcon.jsx` to support Bootstrap-icon types alongside image types

In `frontend/assets/js/components/common/LinkIcon.jsx`:
- Keep `LINK_TYPE_ICONS` (image map) exactly as-is for `lootstudio`.
- Add a new exported map, e.g. `LINK_TYPE_BOOTSTRAP_ICONS`, keyed by the 5 new type values to the `Icons.js` classes from Step 1 (import `Icons` from `../../../utils/ui/Icons.js`).
- Export a combined ordered list of all recognized type values (e.g. `LINK_TYPES = [...Object.keys(LINK_TYPE_ICONS), ...Object.keys(LINK_TYPE_BOOTSTRAP_ICONS)]`) — this becomes the new source of truth for the dropdown instead of `Object.keys(LINK_TYPE_ICONS)` alone.
- Update `resolveLinkIcon`/`LinkIcon` rendering logic: for a recognized image type, render the `<img>` as today; for a recognized Bootstrap-icon type, render `<i className={`bi ${LINK_TYPE_BOOTSTRAP_ICONS[linkType]}`}></i>`; otherwise fall back to the existing generic `bi-link-45deg` icon. Keep the same falsy/unrecognized-type fallback behavior.

### Step 3 — Update the type dropdown source

In `frontend/assets/js/components/resources/character/pages/elements/helpers/LinksEditModalHelper.jsx`, change the `LINK_TYPE_VALUES` derivation to use the new combined `LINK_TYPES` export from `LinkIcon.jsx` instead of `Object.keys(LINK_TYPE_ICONS)`, so all 6 non-blank types (not just `lootstudio`) appear as `<option>`s. No other change needed in this file — it already looks up `` links_edit_modal.link_type_${type} `` per option, which now resolves via the translator's new keys.

### Step 4 — Update/add specs

- `frontend/specs/assets/js/components/common/LinkIconSpec.js` — add cases mirroring the existing `lootstudio` test for at least one Bootstrap-icon type (e.g. `diary` → expect the rendered markup to contain `bi-feather` and not `bi-link-45deg`), keeping the existing undefined/empty/unrecognized cases intact.
- `frontend/specs/assets/js/components/resources/character/pages/elements/helpers/LinksEditModalHelperSpec.js` — update the assertion at line ~144 (`expect(options.map(...)).toEqual(['', 'lootstudio'])`) to the full expected list `['', 'lootstudio', 'diary', 'music', 'stl', 'background', 'reference']`.

## Files to Change

- `frontend/assets/js/utils/ui/Icons.js` — add 5 Bootstrap icon class entries.
- `frontend/assets/js/components/common/LinkIcon.jsx` — add Bootstrap-icon type map, combined type list export, and rendering branch.
- `frontend/assets/js/components/resources/character/pages/elements/helpers/LinksEditModalHelper.jsx` — source dropdown values from the combined type list.
- `frontend/specs/assets/js/components/common/LinkIconSpec.js` — new coverage for Bootstrap-icon types.
- `frontend/specs/assets/js/components/resources/character/pages/elements/helpers/LinksEditModalHelperSpec.js` — updated expected dropdown values.

## CI Checks

- `frontend`: `npm run coverage` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)

## Notes

- Do not change how `lootstudio` renders — it must keep using its PNG image, unchanged, per the issue's confirmed scope.
- This work depends on the translator's keys existing for the dropdown labels to display correctly, but does not block on backend — the frontend only needs the agreed-upon string values, not the backend code itself.
