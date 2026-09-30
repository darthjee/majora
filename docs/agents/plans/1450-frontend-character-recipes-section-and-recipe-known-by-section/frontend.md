# Frontend Plan: Frontend: character recipes section and recipe 'Known by' section

Main plan: [plan.md](plan.md)

## Shared contracts

- Consumes the merged CharacterRecipe / recipe-characters API and `can_exchange_recipe` exactly
  as listed in [plan.md](plan.md#api-surface-already-merged-consumed-by-frontend).
- Consumes the i18n keys listed in [plan.md](plan.md#i18n-keys-produced-by-translator-consumed-by-frontend),
  produced by the translator agent. No hard-coded user-facing strings.

## Steps

- [01 — Request wiring and permissions](frontend/01-request-wiring-and-permissions.md)
- [02 — Routes and PC/NPC nav entry](frontend/02-routes-and-nav.md)
- [03 — Full list page](frontend/03-full-list-page.md)
- [04 — Detail page and hidden toggle](frontend/04-detail-page-and-hidden-toggle.md)
- [05 — Exchange modal (acquire / remove)](frontend/05-exchange-modal.md)
- [06 — Shortlists: PC/NPC "Recipes" and recipe "Known by"](frontend/06-shortlists.md)

## CI Checks
- `frontend`: `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`).
- `frontend`: `docker-compose run --rm majora_fe npm run coverage` (CI job: `jasmine`).
- Docs: `yarn lint_md` (CI job: `markdownlint`) if any doc under `docs/` is touched.

## Notes
- Follow the spec `docs/agents/specs/recipes/frontend.md` (*Character recipes*, *Shortlists*,
  *Request wiring → characterRecipeConfig.js*). Where the spec and the merged code disagree, the
  merged code wins. For example, `ShortListController` defaults to `<slot key>.collection`, so the
  `recipe` / `recipeCharacter` shortlist entries **must** declare `requestResource` /
  `quantityType`.
- Mirror the Character Documents implementation (#725, #892, #920) file for file wherever
  possible: pages, controllers, helpers, tabs and list types. Keep files under the ESLint
  max-lines limit by splitting new list types into their own config file (as
  `documentListTypes.js` does).
- Every new or changed module gets a Jasmine spec next to its peers' specs.
- `CardRecipeImage` / `RecipePreviewCard` already exist (#1449). Reuse them; don't recreate them.
- Out of scope: game recipe pages, the "Recipes that produce it" shortlist, and a full
  "Known by" page.
