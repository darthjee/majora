# Architect Plan: Remove the game content copy specs

Main plan: [plan.md](plan.md)

## Shared contracts

Create the paths and anchors listed in [plan.md](plan.md#shared-contracts): the feature doc
`docs/agents/game-content-copy.md` with a `## Cache` section, and one page per tab under
`docs/agents/game-content-copy/`, each with a `## Cache` section. `recipes.md` also has
`## Common item` and `factions.md` also has `## Names`. Backend docstrings and the proxy
`staff_copies.php` rules link to these.

## Steps

- [01 — Write the feature doc](architect/01-write-feature-doc.md)
- [02 — Write the per-tab pages](architect/02-write-tab-pages.md)
- [03 — Move proxy and cache knowledge](architect/03-move-proxy-and-cache-knowledge.md)
- [04 — Repoint and de-stale access-control and product docs](architect/04-repoint-access-control.md)
- [05 — Delete the specs and their hub entry](architect/05-delete-specs.md)

## Notes

- Precedent: #1490 (access statistics specs to `docs/agents/statistics.md`, squashed in
  `e3170166`). Follow its tone: the feature doc holds lasting knowledge, never planning
  language ("planned", "will", "each issue writes").
- **Document the code, not the spec.** Every statement copied from a spec must be checked
  against the merged code (`backend/staff/copy_*.py`, `backend/staff/views*`,
  `proxy/extension/lib/handlers/LinkHandler.php`, `proxy/*/rules/staff_copies.php`,
  `proxy/*/rules/uploads.php`, `frontend/assets/js/components/resources/staff_copy/`,
  `frontend/assets/js/utils/requests/config/staffCopyConfig.js`). Drop or correct whatever
  diverged.
- Drop the specs' `## Testing` sections and the API proposals that duplicate
  `access-control/staff-copy.md`. Link to that page for the endpoints instead.
- Follow `docs/agents/documentation.md`: blank lines around headings and lists (Codacy
  markdownlint). There is no local markdownlint run.
- `AGENTS.md` is not touched: it links only to the `specs.md` hub.
