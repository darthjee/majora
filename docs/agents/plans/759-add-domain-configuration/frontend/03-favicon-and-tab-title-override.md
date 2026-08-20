# Favicon + tab title override

Once the domain config from step 01 resolves:

- Always set `document.title = config.title` (the API never returns `null` for `title`, so this is unconditional — it just re-asserts `"Majora"` when unconfigured, matching `frontend/index.html:7`'s existing static `<title>Majora</title>`).
- Only when `config.favicon` is non-null, rewrite the favicon `<link>`'s `href` (`document.querySelector('link[rel="icon"]').href = config.favicon`, or equivalent). When `config.favicon` is `null`, do nothing — leave `frontend/index.html`'s static `<link rel="icon" href="/assets/images/favicon.png">` untouched.

Place this as a side effect near wherever step 01 wired the fetch (e.g. a `useEffect` keyed on the resolved config).

## Files to Change

- Wherever step 01 placed the bootstrap fetch (e.g. `frontend/assets/js/components/common/header/controllers/HeaderController.js`, or a dedicated small effect/module if that reads cleaner) — add the `document.title`/favicon `<link>` side effect
