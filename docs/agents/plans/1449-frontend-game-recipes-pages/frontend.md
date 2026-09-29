# Frontend Plan: Frontend: game Recipes pages

Main plan: [plan.md](plan.md)

## Shared contracts

- **Consumes** the recipe API and the common-item `?name=` filter exactly as described in
  [plan.md](plan.md#shared-contracts).
- **Uses** only the i18n keys listed in [plan.md](plan.md#i18n-keys-frontend--translator); any
  extra key must be reported so the translator adds it.
- **Out of scope (#1450):** the recipe show page's "Known by" shortlist, the `recipe.characters`
  quantity type, and all character-recipe pages / PC-NPC entries.

Paths below are relative to `frontend/assets/js/`. New recipe pages live in
`components/resources/recipe/pages/` (same layout as `components/resources/common_item/pages/`:
`controllers/`, `elements/show/`, `helpers/`, `hooks/`).

## Steps

- [01 — Request wiring and permissions](frontend/01-request-wiring-and-permissions.md)
- [02 — Nav entry and routes](frontend/02-nav-and-routes.md)
- [03 — Recipes list page](frontend/03-list-page.md)
- [04 — Recipe show page](frontend/04-show-page.md)
- [05 — Recipe new / edit pages](frontend/05-new-edit-pages.md)
- [06 — "Recipes that produce it" shortlist on the common item page](frontend/06-common-item-shortlist.md)

## CI Checks
- `frontend`: `docker-compose run --rm majora_fe yarn lint` (CI step `npm run lint`) and the
  Jasmine suite (`docker-compose run --rm majora_fe yarn test`, or the repo's equivalent spec
  target — see `AGENTS.md`).
- `frontend`: `docker-compose run --rm majora_fe yarn check_i18n` once the translator's files land.

## Notes
- `docs/agents/specs/recipes/frontend.md` still assigns "Known by" to #1449; it is intentionally
  left to #1450 (decided while refining the issue). Do not implement it here.
- Every new component / controller / helper gets a Jasmine spec, following the specs of the
  common-item counterpart it is modeled on.
- Keep the photo-less design: no upload buttons, no photo modal, no `PhotoUploadModal` on recipe
  pages.
