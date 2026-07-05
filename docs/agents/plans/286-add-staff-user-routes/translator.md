# Translator Plan: Add staff user routes

Main plan: [plan.md](plan.md)

## Shared contracts

The frontend agent (`frontend.md`) references these keys from its new components/helpers —
add exactly this key set (adjust nesting only if it conflicts with an existing convention
found in `frontend/assets/i18n/en.yaml`/`pt.yaml`) so both sides agree on names:

- `header.nav_staff_users` — nav link label ("Users" / similar, staff-only).
- `staff_users_page.loading`, `staff_users_page.title`, `staff_users_page.name_column`,
  `staff_users_page.email_column`, `staff_users_page.edit`, `staff_users_page.generate_link`,
  `staff_users_page.copy_link`, `staff_users_page.copied`, `staff_users_page.link_error`.
- `staff_user_page.loading`, `staff_user_page.title`, `staff_user_page.name_label`,
  `staff_user_page.email_label`, `staff_user_page.edit`, `staff_user_page.error`.
- `staff_user_edit_page.title`, `staff_user_edit_page.name_label`,
  `staff_user_edit_page.email_label`, `staff_user_edit_page.submit`,
  `staff_user_edit_page.error`.

## Implementation Steps

### Step 1 — Add keys to both language files

Add the full key set above to both `frontend/assets/i18n/en.yaml` and
`frontend/assets/i18n/pt.yaml`, following the existing nesting/naming style visible around the
`treasures_page` / `treasure_page` / `treasure_edit_page` blocks (top-level key per
page/component, snake_case leaf keys). Write natural English copy for `en.yaml` and an
accurate Portuguese translation for `pt.yaml` — do not leave placeholders.

### Step 2 — Verify key parity

Run the project's translation key-parity check (see `frontend/package.json` scripts and/or
`.circleci/config.yml` for the exact script name — do not guess; confirm during
implementation) via `docker-compose run majora_fe <script>` to confirm `en.yaml` and
`pt.yaml` stay in sync after the additions.

## Files to Change

- `frontend/assets/i18n/en.yaml` — add new keys (English).
- `frontend/assets/i18n/pt.yaml` — add new keys (Portuguese).

## CI Checks

- `frontend/`: translation key-parity script (CI job: frontend lint/tests, confirm exact job
  name during implementation) via `docker-compose run majora_fe <script>`.

## Notes

- Do not invent new keys beyond what `frontend.md` needs — coordinate key names with the
  frontend agent's implementation if it ends up needing something not listed here (e.g. an
  additional error/status string), rather than diverging silently.
- If the frontend agent renames the "recovery link" UI copy while implementing, keep this file
  and the actual yaml keys in sync in the same PR.
