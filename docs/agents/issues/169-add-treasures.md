# Add Treasures

## Context

The application manages RPG campaigns but has no concept of Treasures yet. Treasures are a global resource (not scoped to any game) that authenticated users can browse, while only superusers can create or edit them. This issue introduces the full stack — Django model, REST endpoints, and React pages — following the existing Game/Character CRUD pattern.

## What needs to be done

**Backend:**
- Add `Treasure` Django model with `name` (string) and `value` (integer) fields
- Serializers: list, detail, and create/update variants
- Views: `GET/POST /treasures.json` (list + create) and `GET/PATCH /treasures/:id.json` (detail + update)
- `TreasureEditPermission` checking `user.is_superuser` on write endpoints
- Access endpoint `GET /treasures/:id/access.json` returning `{ "can_edit": true/false }`

**Frontend:**
- Page components, controllers, helpers, and HTTP client following the Game/Character pattern
- Router entries in `HashRouteResolver.js` and page mappings in `AppHelper.jsx`
- i18n keys for all new pages
- Edit controls hidden when `can_edit` is false; edit/new pages redirect away when `can_edit` is false

**Docs:**
- Update `docs/agents/architecture.md` and API endpoint table if new endpoints are added

## Acceptance criteria

- [ ] `Treasure` model exists with `name` and `value` fields and a migration
- [ ] `GET /treasures.json` returns a list of all treasures for any authenticated user
- [ ] `POST /treasures.json` creates a treasure; returns 403 for non-superusers
- [ ] `GET /treasures/:id.json` returns a single treasure for any authenticated user
- [ ] `PATCH /treasures/:id.json` updates a treasure; returns 403 for non-superusers
- [ ] `GET /treasures/:id/access.json` returns `{ "can_edit": true }` for superusers and `{ "can_edit": false }` for others
- [ ] `/#/treasures` lists all treasures for any authenticated user
- [ ] `/#/treasures/new` shows a create form; redirects non-superusers away
- [ ] `/#/treasures/:id` shows treasure detail for any authenticated user
- [ ] `/#/treasures/:id/edit` shows an edit form; redirects non-superusers away
- [ ] New/edit controls are hidden for non-superusers on the list and detail pages
- [ ] All new pages have i18n keys in every supported language file
- [ ] Backend tests pass; frontend specs pass

Tags: ✏️ :construction:
