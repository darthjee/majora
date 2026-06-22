# Plan: Add Portuguese translations

Issue: [95-add-portuguese-translations.md](../../issues/95-add-portuguese-translations.md)

## Overview
Add Brazilian Portuguese (`pt`) as a second supported language in the
frontend's hand-rolled i18n layer, following the documented drop-in process
in `docs/agents/i18n.md`. The new `pt.yaml` file starts as an exact copy of
`en.yaml` (untranslated) — the actual Portuguese text will be filled in by
the user afterwards, so this plan only wires up the language, not the
translated strings.

## Context
- Translations live in `frontend/assets/i18n/<code>.yaml`, parsed via
  `js-yaml` and loaded by `frontend/assets/js/i18n/Translator.js`.
- `Translator.js` keeps a `TRANSLATIONS` lookup table mapping language code
  to parsed YAML.
- `frontend/assets/js/components/elements/controllers/LanguageSelectorController.js`
  keeps a `FLAGS` table mapping language code to a flag emoji, used to
  populate the language selector dropdown.
- Only `en` exists today, with `🇬🇧` as its flag.

## Implementation Steps

### Step 1 — Add the `pt.yaml` translation file
Copy `frontend/assets/i18n/en.yaml` to `frontend/assets/i18n/pt.yaml` as-is
(same keys, same English values for now). Do not translate the values —
the user will translate this file manually in a follow-up.

### Step 2 — Register `pt` in `Translator.js`
Import `pt.yaml?raw` alongside the existing `en.yaml?raw` import and add a
`pt: load(ptYaml)` entry to the `TRANSLATIONS` table.

### Step 3 — Add the Brazilian flag to the language selector
Add `pt: '🇧🇷'` to the `FLAGS` table in `LanguageSelectorController.js`, so
`getOptions()` returns `pt` alongside `en`.

### Step 4 — Update specs affected by the new language option
Update the existing assertions in
`LanguageSelectorControllerSpec.js` and `LanguageSelectorSpec.js` that
hard-code the single `en` option, so they account for the new `pt` entry
(flag `🇧🇷`) without breaking.

## Files to Change
- `frontend/assets/i18n/pt.yaml` — new file, copy of `en.yaml` (untranslated).
- `frontend/assets/js/i18n/Translator.js` — import `pt.yaml` and register it
  under `pt` in `TRANSLATIONS`.
- `frontend/assets/js/components/elements/controllers/LanguageSelectorController.js`
  — add `pt: '🇧🇷'` to `FLAGS`.
- `frontend/specs/assets/js/components/elements/controllers/LanguageSelectorControllerSpec.js`
  — update `getOptions()` expectations to include `pt`.
- `frontend/specs/assets/js/components/elements/LanguageSelectorSpec.js` —
  update rendered dropdown expectations to include `'🇧🇷 pt'`.

## CI Checks
- `frontend`: `npm run coverage` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)

## Notes
- `pt.yaml` is intentionally left untranslated (identical to `en.yaml`) per
  explicit user instruction — actual Portuguese text is out of scope for
  this change and will be added manually afterwards.
- No other code changes are required — `Translator.getAvailableLanguages()`
  and the selector pick up the new entry automatically, as documented in
  `docs/agents/i18n.md`.
