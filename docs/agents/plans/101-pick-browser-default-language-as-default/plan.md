# Plan: Pick Browser Default Language As Default

Issue: [101-pick-browser-default-language-as-default.md](../../issues/101-pick-browser-default-language-as-default.md)

## Overview
When there is no stored `localStorage.language` and no logged-in user preference yet, `LanguageStorage.getLanguage()` currently always returns the hardcoded `'en'` default. This plan makes it fall back to the browser's preferred language (`navigator.language`/`navigator.languages`) first, matching against the supported language codes (`en`, `pt`), before falling back to `'en'`.

## Context
- `frontend/assets/js/i18n/LanguageStorage.js` hardcodes `DEFAULT_LANGUAGE = 'en'` and returns it whenever `localStorage.language` is unset.
- `frontend/assets/js/i18n/Translator.js` initializes `#language` from `LanguageStorage.getLanguage()` and owns the `TRANSLATIONS` map (`{ en, pt }`), which is the authoritative list of supported language codes.
- `HeaderController.js` applies a logged-in user's `favorite_language` after status load, overriding whatever language was initially picked — that flow is unaffected by this change since it runs after `Translator`/`LanguageStorage` initialization.
- `navigator.language`/`navigator.languages` are not read anywhere in the codebase today.

## Implementation Steps

### Step 1 — Make supported languages available to `LanguageStorage`
`LanguageStorage` needs to know which language codes are valid in order to match the browser preference against them, but `Translator` currently owns `TRANSLATIONS` and depends on `LanguageStorage` (importing it would create a circular dependency). Pass the list of supported languages as a parameter to `getLanguage(supportedLanguages)` instead, and update the single call site in `Translator.js` (`LanguageStorage.getLanguage()` → `LanguageStorage.getLanguage(Translator.getAvailableLanguages())`). Note `Translator.getAvailableLanguages()` is a static method on the same class being initialized; since `TRANSLATIONS` is a module-level constant evaluated before the class body, calling it during the `#language` field initializer is safe.

### Step 2 — Read the browser's preferred language in `LanguageStorage`
In `LanguageStorage.getLanguage(supportedLanguages)`:
1. If `localStorage` is unavailable, keep returning `DEFAULT_LANGUAGE` (existing guard, also covers SSR/test environments).
2. If `localStorage.language` is set, return it unchanged (existing behavior, takes priority).
3. Otherwise, inspect `navigator.language` and `navigator.languages` (guard with `typeof navigator === 'undefined'` for safety in non-browser test environments), normalize each candidate to its base language code (e.g. `'pt-BR'` → `'pt'`), and return the first one that is included in `supportedLanguages`.
4. If none match, fall back to `DEFAULT_LANGUAGE`.

### Step 3 — Update specs
- `LanguageStorageSpec.js`: add cases for browser-language detection — matching language present in `navigator.languages`, non-matching language falling back to `DEFAULT_LANGUAGE`, region-qualified codes (`pt-BR`) being normalized to `pt`, and `localStorage.language` still taking priority over `navigator.language` when both are present.
- `TranslatorSpec.js`: verify the call site still passes the available languages through and existing behavior (default `'en'` when nothing else applies) is unchanged.

## Files to Change
- `frontend/assets/js/i18n/LanguageStorage.js` — accept `supportedLanguages` in `getLanguage`, add browser-language detection/matching before falling back to `DEFAULT_LANGUAGE`.
- `frontend/assets/js/i18n/Translator.js` — pass `Translator.getAvailableLanguages()` into `LanguageStorage.getLanguage(...)`.
- `frontend/specs/assets/js/i18n/LanguageStorageSpec.js` — new specs for browser-language fallback behavior.
- `frontend/specs/assets/js/i18n/TranslatorSpec.js` — confirm initialization still passes through correctly, if not already covered.

## CI Checks
- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm run coverage` (CI job: `jasmine`)

## Notes
- `navigator.languages` is an ordered list of preferences (most-preferred first); prefer it over the single `navigator.language` value when present, falling back to `navigator.language` if `navigator.languages` is unavailable.
- Region-qualified codes (e.g. `pt-BR`, `en-US`) must be normalized to their base code (`pt`, `en`) before matching against `supportedLanguages`, since the app only ships base-language YAML files.
- This change only affects the *initial* language resolution; the existing `setLanguage`/`LanguageEvents` flow and the logged-in `favorite_language` override in `HeaderController` are untouched.
