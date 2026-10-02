# Translator Plan: Frontend: staff photos page with per-type tabs, Replace and Delete

Main plan: [plan.md](plan.md)

## Shared contracts

Produce exactly the keys listed under "i18n keys" in [plan.md](plan.md#shared-contracts): every `staff_photos_page.*` key (including the nested `types.<slug>` map for all 13 slugs) in a new `staff_photos_page.yaml`, plus `header.nav_staff_photos` in `common.yaml`. The frontend reads these exact key paths.

## Implementation Steps

### Step 1 — Add `staff_photos_page.yaml` (en + pt)

Create `frontend/assets/i18n/en/staff_photos_page.yaml` and `frontend/assets/i18n/pt/staff_photos_page.yaml`, each with the single top-level key `staff_photos_page:` and every key from the shared contract (en values as listed; natural Brazilian Portuguese for pt, e.g. `title: Fotos`, `types.game: Jogos`, `status_ready: Pronta`). Model the style on `staff_users_page.yaml` / `staff_user_page.yaml`. No `index.js` change is needed — page namespaces are loaded lazily by file name.

### Step 2 — Add the header nav key

Add `nav_staff_photos: Photos` (en) / `nav_staff_photos: Fotos` (pt) under `header:` in `frontend/assets/i18n/{en,pt}/common.yaml`, next to `nav_staff_crawler`.

## Files to Change

- `frontend/assets/i18n/en/staff_photos_page.yaml` — new namespace (en)
- `frontend/assets/i18n/pt/staff_photos_page.yaml` — new namespace (pt)
- `frontend/assets/i18n/en/common.yaml` — `header.nav_staff_photos`
- `frontend/assets/i18n/pt/common.yaml` — `header.nav_staff_photos`

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe yarn check_i18n` (CI job: `frontend-checks`)

## Notes

- Do not touch `index.js`; `commonNamespaces` is unchanged because no new top-level namespace is added to `common.yaml`.
