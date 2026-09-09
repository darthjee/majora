# Translations (en/pt)

New page-specific i18n namespace, following the `<name>_page.yaml` /
`<name>_page:` convention (e.g. `staff_users_page.yaml` /
`staff_users_page:`). No `index.js` manifest change needed in either
language — page-specific namespaces are resolved lazily through the
`chunkLoaders` `Proxy` by filename, only `common`-bundled namespaces need a
`commonNamespaces` entry.

## Files to Change

- `frontend/assets/i18n/en/staff_crawler_page.yaml` — new file, `
  staff_crawler_page:` top-level key with (at least) `title`, `loading`,
  `error` (fetch/access failure message), and an empty-state string for the
  right column before anything is selected (e.g. `no_selection`).
- `frontend/assets/i18n/pt/staff_crawler_page.yaml` — matching Portuguese
  translation, same keys, required for `check_i18n` (verifies key parity
  across languages) to pass.
- `StaffCrawlerHelper.jsx` (step 04) references these keys via
  `Translator.t('staff_crawler_page.<key>')`, same call shape as
  `StaffDashboardHelper.jsx`.
