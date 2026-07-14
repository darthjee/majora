# Plan: Add more info badges for npcs

Issue: [480-add-more-info-badges-for-npcs.md](../issues/480-add-more-info-badges-for-npcs.md)

## Overview

Add two new always-visible, tooltip-carrying badges to the NPC photo info bar
(`InfoBar`), each flagging a staff-only "deception" case — real `allegiance` vs.
`public_allegiance` differing, and real `slain` vs. `public_slain` differing — plus a
legibility fix for the existing tooltip's neutral-variant text. This is a frontend-only
change: the backend already exposes both the real and public fields together only on
the DM/superuser NPC-list endpoint, so presence of the `public_*` fields is itself the
permission signal the frontend needs.

## Context

- Backend confirmation (no backend changes needed): `backend/games/serializers/character_full_list.py`
  (used by the DM-only `game_npcs_all` view, `backend/games/views/characters/game_npcs_all.py`,
  gated by `GameEditPermission`) exposes all four fields — `allegiance`, `public_allegiance`,
  `slain`, `public_slain` — as non-nullable (`allegiance`/`public_allegiance` default
  `'neutral'`, `slain`/`public_slain` default `False`, see `backend/games/models/character.py`).
  The regular NPC list/detail path (`CharacterListSerializer`/`CharacterDetailSerializer`,
  used by `game_npcs.py`) only exposes `slain`/`allegiance` aliased to the public values —
  `public_allegiance`/`public_slain` are simply **absent** from that payload, not `null`.
  So on the frontend, "is `public_allegiance`/`public_slain` present" is exactly "does this
  viewer have permission to see it" — confirmed with the user, this is the intended
  semantics of the issue's "neither is null" condition, since the underlying values are
  never actually `null`.
- Current info-bar architecture: `InfoBarRules.build()` (`frontend/assets/js/components/common/helpers/InfoBarRules.js`)
  returns an array of `{key, label}` items rendered by `InfoBar.jsx`. Today it always
  returns at most **one** entry: a single `TooltipBadge` (icon: `Icons.infoCircleFill`)
  whose tooltip lists every status item built by `CharacterStatusBadges.build()` (real/public
  slain, and for NPCs real/public allegiance) via `InfoBadgeList`. The two new badges are
  **additional, separate** `{key, label}` entries in that same array, each its own
  `TooltipBadge` with its own icon and a short, purpose-built tooltip item list (not the
  full `CharacterStatusBadges` list).
- `TooltipBadge.jsx` renders a colorless (`variant`-less) visible `Badge` today ("the
  visible badge itself carries no color"); `Badge.jsx` already accepts a `variant` prop
  (default `'secondary'`) but `TooltipBadge` doesn't forward one. The issue wants the two
  new badges visibly colored (warning/orange), so `TooltipBadge` needs an optional
  `variant` prop threaded to its inner `Badge`, defaulting to today's behavior so the
  existing status badge is unaffected.
- `InfoBadgeList.jsx:24` falls back to Bootstrap's `text-muted` (gray, ~`#6c757d`) for any
  item with a `null` variant (currently only the neutral-allegiance case). No custom color
  variables exist in `frontend/assets/css/main.scss` — the project already uses Bootstrap's
  built-in `warning` variant elsewhere (`ResilienceIndicatorHelper.jsx`), so the new badges
  should use `bg-warning`/`text-warning` rather than introducing a new SCSS variable.
- Icons: `frontend/assets/js/utils/ui/Icons.js` centralizes `bi-emoji-*` class names; add
  `emojiGrimace: 'bi-emoji-grimace'` and `emojiDizzy: 'bi-emoji-dizzy'` (plain, non-fill,
  matching the issue's own icon names and the user's confirmed preference).
- Translations: `frontend/assets/i18n/en.yaml`/`pt.yaml` already have a `character_status_badges:`
  block (`en.yaml:93-103`) with per-value keys (`enemy`, `ally`, `neutral`, `public_enemy`,
  etc.) — add new keys under the same block for the "Players deceived" tooltip heading text.
- Confirmed with the user: these two badges must only ever appear where the real vs.
  public fields are both present (staff/editor views), never on player-facing pages — which
  falls out naturally from the "both fields present" check above, since the public-facing
  endpoints never send `public_allegiance`/`public_slain` at all.
- Confirmed with the user: the slain-deception badge tooltip shows **both** `slain` and
  `public_slain` values (matching the allegiance badge's "both values" pattern), not just
  the public one.

## Implementation Steps

### Step 1 — Thread a `variant` prop through `TooltipBadge`

Add an optional `variant` prop to `TooltipBadge.jsx`, forwarded to the inner `Badge`,
defaulting to `undefined`/`Badge`'s own default so the existing status badge (no `variant`
passed today) keeps its current colorless look.

### Step 2 — Add the two new icons and translation keys

- `Icons.js`: add `emojiGrimace: 'bi-emoji-grimace'` and `emojiDizzy: 'bi-emoji-dizzy'`.
- `en.yaml`/`pt.yaml`: add a "Players deceived" heading key (and any other copy needed for
  the tooltip, e.g. reusing the existing per-value allegiance/slain keys for the two listed
  values) under `character_status_badges:`.

### Step 3 — Build the two "deception" badge items

Add two new builder methods, either alongside `CharacterStatusBadges` or as a small sibling
helper (whichever keeps `CharacterStatusBadges` — which builds *tooltip line items* — separate
from the *new badge* concept, since these are full `{icon, items}` badges, not single tooltip
lines):

- **Allegiance deception**: show only when both `character.allegiance` and
  `character.public_allegiance` are present (not `undefined`) and differ. Badge icon:
  `Icons.emojiGrimace`, `variant="warning"`. Tooltip content: "Players deceived" heading,
  then both allegiance values (reusing the existing per-value translation keys/icons from
  `CharacterStatusBadges`'s allegiance item builders where practical).
- **Slain deception**: show only when both `character.slain` and `character.public_slain`
  are present and differ. Badge icon: `Icons.emojiDizzy`, `variant="warning"`. Tooltip
  content: "Players deceived" heading, then both slain values.

### Step 4 — Wire the new badges into `InfoBarRules`

Extend `InfoBarRules.build()` to push the two new badge entries (each its own `{key, label}`
with a distinct `key`, e.g. `'allegiance-deception'`/`'slain-deception'`) onto the returned
array, only for NPCs (mirroring the existing `!character.is_pc` guard used for the allegiance
status items), independent of whether the existing single status badge is present.

### Step 5 — Fix the neutral-variant tooltip text color

In `InfoBadgeList.jsx:24`, replace the `text-muted` fallback (used when `item.variant` is
`null`) with a near-white color, scoped to this component only (does not affect `text-muted`
usage elsewhere in the app, if any). Since no custom color variable exists yet, add one
narrowly-scoped class (e.g. `.info-badge-list-item-neutral { color: #dedede; }`) in
`frontend/assets/css/main.scss` and use it in place of `text-muted` for the `null`-variant
case.

### Step 6 — Tests

- `CharacterStatusBadgesSpec.js` / new spec file for the deception-badge builders: cover
  both-present-and-differ (shows), both-present-and-equal (hidden), one-or-both-absent
  (hidden) for both allegiance and slain.
- `InfoBarRulesSpec.js`: cover the two new entries appearing for NPCs only, and only under
  the above conditions, alongside the existing single status badge.
- `InfoBadgeList` spec: cover the new near-white class replacing `text-muted` for
  `null`-variant items.
- `TooltipBadge`/`badgeSpec.js`: cover the new optional `variant` prop being forwarded to
  `Badge`, and the default (no `variant`) case staying unchanged.

## Files to Change

- `frontend/assets/js/components/common/TooltipBadge.jsx` — accept/forward optional `variant` prop
- `frontend/assets/js/utils/ui/Icons.js` — add `emojiGrimace`, `emojiDizzy`
- `frontend/assets/i18n/en.yaml`, `frontend/assets/i18n/pt.yaml` — add "Players deceived" (and related) keys under `character_status_badges:`
- `frontend/assets/js/components/common/helpers/CharacterStatusBadges.js` (or a new sibling helper) — build the two deception badge items
- `frontend/assets/js/components/common/helpers/InfoBarRules.js` — wire the two new badges into the info bar's item list, NPC-only
- `frontend/assets/js/components/common/InfoBadgeList.jsx` — replace `text-muted` fallback with a near-white color
- `frontend/assets/css/main.scss` — add the near-white text color class
- `frontend/specs/assets/js/components/common/helpers/CharacterStatusBadgesSpec.js`, `InfoBarRulesSpec.js`, `frontend/specs/assets/js/components/common/InfoBadgeList/*`, `frontend/specs/assets/js/components/common/TooltipBadge/badgeSpec.js` — spec coverage for all of the above

## CI Checks

- `frontend`: `npm test` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)

## Notes

- No backend or API changes — all four fields already exist and are already correctly
  scoped to the DM/superuser-only endpoint.
- Confirmed with the user during discussion: the "neither is null" condition in the issue
  maps to "both the real and public fields are present in the payload", which doubles as
  the permission check, since the underlying model fields are never actually nullable.
- Confirmed with the user during discussion: the slain-deception tooltip shows both real
  and public values, matching the allegiance-deception badge's pattern (the issue's own text
  literally only mentioned the public value for this one).
- Confirmed with the user during discussion: plain (non-`-fill`) Bootstrap icon variants
  for both new badges, matching the issue's literal icon names.
