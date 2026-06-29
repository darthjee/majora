# Plan: Add Treasures

Issue: [169-add-treasures.md](../issues/169-add-treasures.md)

## Overview

The Treasure model, its serializers, views, and all frontend page components already exist on the current branch (from a prior partial implementation). What remains is wiring everything together: exporting the model and serializers from their `__init__.py` files, registering the views in `urls.py`, adding `TreasureEditPermission` to `permissions.py`, registering the model in admin, adding treasure routes to the frontend router and page map, adding i18n keys, and adding the treasure endpoints to the Navi warm-up config.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [translator](translator.md)
- [infra](infra.md)

## Shared contracts

### API endpoints

| Method | URL | Description | Auth |
|--------|-----|-------------|------|
| `GET` | `/treasures.json` | List treasures (paginated) | None required |
| `POST` | `/treasures.json` | Create treasure | Superuser only (401/403 otherwise) |
| `GET` | `/treasures/<id>.json` | Treasure detail | None required |
| `PATCH` | `/treasures/<id>.json` | Update treasure | Superuser only (401/403 otherwise) |
| `GET` | `/treasures/<id>/access.json` | Access check | None required; returns `X-Skip-Cache: true` |

### Response shapes

**List item / Detail:** `{ "id": <int>, "name": <str>, "value": <int> }`

**Access:** `{ "can_edit": <bool> }`

### URL names (Django `reverse`)

- `treasures-list`
- `treasure-detail` (kwarg: `treasure_id`)
- `treasure-access` (kwarg: `treasure_id`)

### i18n keys (frontend reads these; translator must supply both `en.yaml` and `pt.yaml`)

| Key | Purpose |
|-----|---------|
| `treasures_page.loading` | Loading state on list page |
| `treasures_page.new_treasure` | "New" button label on list page |
| `treasure_page.loading` | Loading state on detail page |
| `treasure_page.edit` | Edit link label on detail page |
| `treasure_new_page.title` | Title of create form |
| `treasure_new_page.name_label` | Name field label |
| `treasure_new_page.value_label` | Value field label |
| `treasure_new_page.submit` | Submit button label |
| `treasure_new_page.error` | Generic error message |
| `treasure_edit_page.title` | Title of edit form |
| `treasure_edit_page.name_label` | Name field label |
| `treasure_edit_page.value_label` | Value field label |
| `treasure_edit_page.submit` | Submit button label |
| `treasure_edit_page.error` | Generic error message |
