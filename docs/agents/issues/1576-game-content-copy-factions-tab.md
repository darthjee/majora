# Game content copy: Factions tab

## Context

Part of "copy content between games" (epic #1550): this issue adds the **Factions** tab to the
staff copy page. Faction names are unique per game, so the list flags `name_taken_in_target`
and the copy answers `422` on a name clash.

Design source of truth: the specs under `docs/agents/specs/game-content-copy/` (index
`docs/agents/specs/game-content-copy.md`) and `docs/agents/access-control/staff-copy.md`. If this
issue and the specs disagree, the specs win. It implements `factions.md` on top of the global
pages (`copy-flow.md`, `hard-links.md`, `permissions.md`, `page.md`).

Depends on the Items tab sub-issue of #1550 (the reference per-tab pattern), already merged,
alongside the Common items, Recipes and Possessions tabs.

## What needs to be done

**Backend:**

- Register the `factions` type in the generic `staff/copies` dispatch.
- `GET staff/copies/factions.json?from=&to=` returning the spec's row fields, including the
  `name_taken_in_target` flag.
- `POST staff/copies/factions/<id>.json {target}` copying the faction and its associated rows
  in one transaction, setting `copied_from`, and returning `{id, links}` per the spec.
- Answer `422` when the faction name is already taken in the target game.
- Copy-link handling: one copy-origin `Upload` per ready source photo/file, the
  `CopyLinkFinalizer` hook for this type, and the pending-links query reach for this type.
- `X-Cache-Clear` on the copy `201` and on link finalize with the paths listed in the spec
  (including every target character's `available.json` list where the spec says so), cleared on
  every domain.

**Frontend:**

- The Factions tab row component with the spec's columns.
- Show a `422` name clash as "name already used" on the page.
- Any new i18n keys (via `translator`, keeping key parity across languages).

**Reviews:** `data-access`, `security`; `cache` confirms the `X-Cache-Clear` paths and that no
Navi resource is needed.

## Acceptance criteria

- [ ] `factions` is registered in the `staff/copies` dispatch.
- [ ] `GET staff/copies/factions.json?from=&to=` returns the spec's row fields with `name_taken_in_target`.
- [ ] `POST staff/copies/factions/<id>.json` copies the faction and associated rows in one transaction, sets `copied_from`, and returns `{id, links}`.
- [ ] A name clash in the target game returns `422`, displayed as "name already used".
- [ ] Copy-origin `Upload`s, the `CopyLinkFinalizer` hook and the pending-links query cover factions.
- [ ] `X-Cache-Clear` headers on copy `201` and link finalize match the spec's paths, on every domain.
- [ ] Frontend Factions tab row renders the spec's columns; i18n keys are in sync.
- [ ] The per-type test cases from the spec's "Testing" section are implemented and pass.
