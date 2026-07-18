# Plan: Add more link types

Issue: [656-add-more-link-types.md](../../issues/656-add-more-link-types.md)

## Overview

Add five new `link_type` values (`diary`, `music`, `stl`, `background`, `reference`) to both the `Link` and `CharacterLink` models, each rendered with a Bootstrap Icon in the frontend (the existing `lootstudio` type keeps its PNG icon, unchanged). This spans a backend migration/model change, new Bootstrap Icon wiring + dropdown support in the frontend, and new translation labels.

## Agents involved

- [backend](backend.md)
- [translator](translator.md)
- [frontend](frontend.md)

## Shared contracts

**Type values and order** — identical across all three agents, everywhere a list of link types is enumerated (Django choices, the frontend type dropdown, translation keys):

```
diary, music, stl, background, reference
```

These are appended after the existing `lootstudio` entry, so the full ordered value list (including the blank "none" option used by the frontend dropdown) is:

```
'', 'lootstudio', 'diary', 'music', 'stl', 'background', 'reference'
```

**Django choice labels** (`backend/games/models/link.py` and `backend/games/models/character/character_link.py`, second element of each `LINK_TYPE_CHOICES` tuple — admin-only display, not shown in the React UI):

| value | label |
| --- | --- |
| `diary` | `Diary` |
| `music` | `Music` |
| `stl` | `STL` |
| `background` | `Background` |
| `reference` | `Reference` |

**Translation keys** (added by translator to `frontend/assets/i18n/en.yaml` and `pt.yaml`, under the existing `links_edit_modal:` block, consumed by `LinksEditModalHelper.jsx` via `` `links_edit_modal.link_type_${type}` ``):

```
link_type_diary
link_type_music
link_type_stl
link_type_background
link_type_reference
```

**Bootstrap Icon classes** (added by frontend to `frontend/assets/js/utils/ui/Icons.js`, then mapped per link type in `frontend/assets/js/components/common/LinkIcon.jsx`):

| type | Icons.js key | class |
| --- | --- | --- |
| `diary` | `feather` | `bi-feather` |
| `music` | `musicNoteList` | `bi-music-note-list` |
| `stl` | `box` | `bi-box` |
| `background` | `bookHalf` | `bi-book-half` |
| `reference` | `bookmarkStarFill` | `bi-bookmark-star-fill` |

Backend has no dependency on the other two agents and can be implemented first. Frontend depends on the translation keys existing (for the dropdown labels) and reuses the same type-value list backend defines in its choices — but does not read backend code directly, so frontend and translator work can proceed in parallel once the shared contract above is fixed.
