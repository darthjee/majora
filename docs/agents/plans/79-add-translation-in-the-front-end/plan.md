# Plan: Add translation in the front-end

Issue: [79-add-translation-in-the-front-end.md](../issues/79-add-translation-in-the-front-end.md)

## Overview
Add a lightweight, hand-rolled i18n layer (consistent with this repo's existing style of small custom utilities — `Router`, `GenericClient`, `AuthEvents` — rather than pulling in a heavy i18n framework): an English YAML translation file bundled at build time, a singleton translator with a `t(key)` lookup, a `window`-level change event (mirroring `AuthEvents`), a header language selector (flag + code) that persists the choice in `localStorage`, and a full sweep extracting existing hardcoded UI strings into translation keys. Add documentation describing the setup.

## Context
All UI text is currently hardcoded directly in JSX render methods (mostly in `*Helper.jsx` files, following this repo's Component/Helper/Controller split). There is no translation mechanism and no language selector. `App.jsx`/`AppController.js` already use a `key={hash}` remount trick on hash change — the same approach is reused here: a `key={lang}` remount on language change, avoiding the need for every component to individually subscribe to translation updates.

## Implementation Steps

### Step 1 — Add a YAML parser dependency
Add `js-yaml` to `frontend/package.json` dependencies (`yarn add js-yaml`). Vite supports importing text assets with the `?raw` suffix, so the English YAML file can be bundled and parsed at module-load time with no runtime fetch — satisfying "translations are loaded as the page loads" without async-loading complexity for the only language that exists today.

### Step 2 — English translation file
Add `frontend/assets/i18n/en.yaml` with nested keys grouped by area, e.g.:
```yaml
header:
  title: Majora
  subtitle: RPG Campaign Management System
  nav_games: Games
  login: Login
  logoff: Logoff
  send_test_email: Send test email
  test_email_sent: Test email sent
  test_email_error: Failed to send test email
login_modal:
  title: Login
  username_label: Username
  password_label: Password
  cancel: Cancel
  submit: Login
  forgot_password: Forgot password?
  incorrect: User name or password incorrect.
  error: An unexpected error occurred, please try again later.
  recover_title: Recover password
  email_label: Email
  recover_submit: Send recovery email
  back_to_login: Back to login
  recovery_sent: If that email is registered, a recovery link has been sent.
# ...continue for every helper identified in Step 4 (games list, game detail, characters, pagination, recover-password page, etc.)
```
Use one top-level namespace per page/element (matching the existing folder layout under `components/elements` and `components/pages`) so keys stay easy to locate.

### Step 3 — Core i18n utilities
- `frontend/assets/js/i18n/Translator.js` — singleton class: loads `en.yaml` (imported via `?raw` and parsed with `js-yaml`) into an in-memory map at module load, exposes `t(key, fallback = key)` (dot-path lookup, e.g. `t('header.login')`), `getLanguage()`, and `setLanguage(code)` (currently only `'en'` is supported; `setLanguage` still updates state/storage/emits the event so the selector and persistence work end-to-end even with one language available — future languages plug in by adding more bundled YAML files and a lookup table in this class).
- `frontend/assets/js/i18n/LanguageStorage.js` — thin `localStorage` wrapper (`getLanguage()`/`setLanguage(code)`, default `'en'`), following the exact guard pattern already used by `AuthStorage.js` (`typeof localStorage === 'undefined'` check).
- `frontend/assets/js/i18n/LanguageEvents.js` — `emit(language)`/`subscribe(handler)`/`unsubscribe(handler)` around a `window` `CustomEvent('language:changed', { detail: { language } })`, mirroring `AuthEvents.js` exactly.
- On app bootstrap, `Translator` reads the persisted language from `LanguageStorage` so a reload keeps the last choice (still `'en'` only for now, but the persistence path is real).

### Step 4 — Extract hardcoded strings
Sweep every `*Helper.jsx` file under `frontend/assets/js/components/` (and any `.jsx` component rendering literal text directly, not just helpers) and replace hardcoded strings with `Translator.t('<namespace>.<key>')` calls, adding the corresponding keys to `en.yaml` as you go. Cover at minimum: `HeaderHelper.jsx`, `LoginModalHelper.jsx`, `RecoverPasswordHelper.jsx`, `GamesHelper.jsx`, `GameHelper.jsx`, `GameCharactersHelper.jsx`, `CharacterHelper.jsx`, `GameCardHelper.jsx`, `CharacterCardHelper.jsx`, `CharacterInfoHelper.jsx`, `CharacterPreviewSectionHelper.jsx`, `PaginationHelper.jsx`, `BackButtonHelper.jsx`. Leave `data-testid` attributes, console/log messages, and code comments untouched — only user-visible text.

### Step 5 — Language selector in the header
- Add `frontend/assets/js/components/elements/LanguageSelector.jsx` (+ `helpers/LanguageSelectorHelper.jsx`, `controllers/LanguageSelectorController.js`, following the same trio convention) rendering a small dropdown/button showing a flag emoji and the language code (e.g. "🇬🇧 en"), with one entry per language registered in `Translator` (just `en` for now). Selecting an entry calls `Translator.setLanguage(code)`.
- Wire it into `HeaderHelper.render` next to the existing nav/auth controls.

### Step 6 — React to language changes
In `frontend/assets/js/components/App.jsx`: add a `lang` state initialized from `Translator.getLanguage()`, subscribe to `LanguageEvents` in the existing `useEffect` (alongside the `hashchange` listener already managed by `AppController`, or via a small addition to `AppController.buildEffect()` — whichever keeps `App.jsx` consistent with its current thin-wrapper style), and include `lang` in the remount key passed to `controller.renderPage` (extending the existing `key={hash}` `React.Fragment` in `AppHelper.render` to `key={`${hash}:${lang}`}`) so every page/element re-renders with the new language without needing per-component subscriptions.

### Step 7 — Documentation
Add `docs/agents/i18n.md` (linked from `AGENTS.md`'s documentation table) describing: where `en.yaml` lives, the `namespace.key` convention, how `Translator.t()` is used in components, how the language selector and persistence work, and the steps to add a new language (add `<code>.yaml` under `frontend/assets/i18n/`, register it in `Translator`'s language table, add it to `LanguageSelector`'s options).

### Step 8 — Tests
Add specs for `Translator`, `LanguageStorage`, `LanguageEvents`, `LanguageSelector`/`LanguageSelectorHelper`/`LanguageSelectorController`, and update every spec file for a Helper touched in Step 4 to assert on the translated text (or mock `Translator.t` and assert the right keys are requested, whichever keeps specs stable if copy changes later — prefer asserting keys over literal English text where practical, since translated strings are deliberately a moving target).

## Files to Change
- `frontend/package.json` — add `js-yaml`.
- `frontend/assets/i18n/en.yaml` — new.
- `frontend/assets/js/i18n/Translator.js` — new.
- `frontend/assets/js/i18n/LanguageStorage.js` — new.
- `frontend/assets/js/i18n/LanguageEvents.js` — new.
- `frontend/assets/js/components/elements/LanguageSelector.jsx` + `helpers/LanguageSelectorHelper.jsx` + `controllers/LanguageSelectorController.js` — new.
- `frontend/assets/js/components/elements/helpers/HeaderHelper.jsx` — render `LanguageSelector`, translate existing strings.
- `frontend/assets/js/components/App.jsx`, `components/helpers/AppHelper.jsx`, `components/AppController.js` — language-change remount wiring.
- All `*Helper.jsx` files listed in Step 4 — translate strings.
- `docs/agents/i18n.md` — new documentation.
- `AGENTS.md` — add a row to the documentation table linking `docs/agents/i18n.md`.
- `frontend/specs/...` — new/updated specs per Step 8.

## CI Checks
- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm run coverage` (CI job: `jasmine`)

## Notes
- Only an English translation set is in scope for this issue (per the issue's Expected Behavior); the selector, persistence, and `Translator` API are still fully built out so a second language is a drop-in addition (new YAML file + one line in `Translator`'s language table + one entry in the selector).
- Keep `Translator.t()` calls returning the key itself as a fallback when a key is missing, so a typo never crashes rendering — surfacing a missing-key bug as visibly-wrong text instead of a runtime error.
