# Issue: Add Portuguese translations

## Description
The frontend currently only ships English (`en`) translations. We need to
add Brazilian Portuguese (`pt`) as a second supported language, following
the existing drop-in process documented in `docs/agents/i18n.md`.

## Problem
- Only `frontend/assets/i18n/en.yaml` exists; there is no Portuguese
  translation file.
- `Translator.js` only imports/registers the `en` language.
- The language selector's flag table only has an entry for `en`, so there is
  no Brazilian flag (🇧🇷) option in the dropdown.

## Expected Behavior
- Users can select Portuguese (`pt`) from the language selector dropdown,
  shown with the Brazilian flag emoji (🇧🇷).
- All existing user-visible strings have a Portuguese translation.
- Switching to `pt` persists across reloads, the same way `en` does today.

## Files to create / edit
- **Create** `frontend/assets/i18n/pt.yaml` — Portuguese translation of every
  key present in `en.yaml`.
- **Edit** `frontend/assets/js/i18n/Translator.js` — import `pt.yaml?raw` and
  register it under the `pt` key in the `TRANSLATIONS` lookup table.
- **Edit** `frontend/assets/js/components/elements/controllers/LanguageSelectorController.js`
  — add a `pt: '🇧🇷'` entry to the `FLAGS` table.
- **Edit** `frontend/specs/assets/js/components/elements/controllers/LanguageSelectorControllerSpec.js`
  — update expectations on `getOptions()` to include the new `pt` entry.
- **Edit** `frontend/specs/assets/js/components/elements/LanguageSelectorSpec.js`
  — update expectations on the rendered dropdown to include `'🇧🇷 pt'`.

## Solution
1. Copy `en.yaml` to `pt.yaml` and translate every value, keeping the same
   `namespace.key` structure.
2. Import and register `pt.yaml` in `Translator.js`'s `TRANSLATIONS` table.
3. Add the `pt: '🇧🇷'` flag mapping in `LanguageSelectorController.js`.
4. Update the two specs above to account for the new language option.

## Benefits
- Makes the app accessible to Portuguese-speaking (Brazilian) users.
- Exercises the multi-language support that was already built out for this
  exact purpose, validating the documented "Adding a new language" flow.

---
See issue for details: https://github.com/darthjee/majora/issues/95
